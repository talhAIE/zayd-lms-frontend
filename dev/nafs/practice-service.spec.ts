import { test } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import type { PracticeOwner } from "../../src/types/nafs-practice.contract";
import type { nafsPracticePlayerService } from "../../src/services/nafsPracticePlayerService";

function setup(adapter: AxiosAdapter) {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  };
  const original = axios.defaults.adapter;
  axios.defaults.adapter = adapter;
  const load = (file: string, api?: AxiosInstance) => {
    const source = fs
      .readFileSync(path.resolve(process.cwd(), "src", file), "utf8")
      .replaceAll("import.meta.env.VITE_API_BASE_URL", '"http://nafs.local"');
    const js = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText;
    const module = { exports: {} as Record<string, unknown> };
    vm.runInNewContext(js, {
      module,
      exports: module.exports,
      localStorage,
      Blob,
      console: { warn() {} },
      window: { location: { href: "" } },
      require: (key: string) => {
        if (key === "axios") return axios;
        if (key === "./nafsService") return nafsExports;
        if (key === "./nafsPracticeDiscoveryService") return discoveryExports;
        if (key === "@/config/ApiConfig")
          return { default: api, __esModule: true };
        if (key === "@/utils/tokenUtils")
          return { clearAuthData: () => values.clear() };
        throw Error("Unexpected runtime dependency");
      },
    });
    return module.exports;
  };
  const api = load("config/ApiConfig.tsx").default as AxiosInstance;
  const exports = load("services/nafsService.ts", api);
  const nafsExports = exports;
  const discoveryExports = load(
    "services/nafsPracticeDiscoveryService.ts",
    api,
  );
  const practice = load("services/nafsPracticePlayerService.ts", api)
    .nafsPracticePlayerService as typeof nafsPracticePlayerService;
  const owner: PracticeOwner = {
    id: "nafs-service-test",
    username: "nafs.synthetic",
    role: "student",
    region: "ROW",
  };
  values.set("AiTutorUser", JSON.stringify({ ...owner, role: "student" }));
  values.set("accessToken", "old-access");
  values.set("refreshToken", "old-refresh");
  return {
    service: practice,
    teacherService: exports.nafsTeacherService,
    owner,
    values,
    signal: new AbortController().signal,
    restore: () => {
      axios.defaults.adapter = original;
    },
  };
}
const ok = (
  config: InternalAxiosRequestConfig,
  data: unknown,
): AxiosResponse => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});
const reject = (config: InternalAxiosRequestConfig, status: number) =>
  Promise.reject(
    new axios.AxiosError(
      "synthetic transport failure",
      "ERR_BAD_REQUEST",
      config,
      undefined,
      { ...ok(config, {}), status },
    ),
  );

test("practice writes use isolated routes, shared bearer auth, stable payloads and no client scores", async () => {
  const calls: InternalAxiosRequestConfig[] = [];
  const env = setup(async (c: InternalAxiosRequestConfig) => {
    calls.push(c);
    return ok(c, {
      status: true,
      data: { session: {}, saved: {}, checked: {} },
    });
  });
  try {
    const request = {
      requestId: "stable-receipt",
      expectedRevision: 8,
      optionId: "B",
    };
    await env.service.save(
      env.owner,
      env.signal,
      "session",
      "question",
      request,
    );
    await env.service.check(
      env.owner,
      env.signal,
      "session",
      "question",
      request,
    );
    await env.service.complete(env.owner, env.signal, "session", {
      requestId: "finish",
      expectedRevision: 9,
    });
    await env.service.repeat(env.owner, env.signal, "session", {
      requestId: "repeat",
      expectedRevision: 10,
    });
    await env.service.start(env.owner, env.signal, "collection", {
      requestId: "start",
    });
    assert.deepEqual(
      calls.map((c) => c.url),
      [
        "/nafs/practice/sessions/session/selections/question",
        "/nafs/practice/sessions/session/questions/question/check",
        "/nafs/practice/sessions/session/complete",
        "/nafs/practice/sessions/session/repeat",
        "/nafs/practice/collections/collection/sessions",
      ],
    );
    for (const c of calls) {
      assert.equal(c.headers.Authorization, "Bearer old-access");
      assert.equal(c.timeout, 30000);
      assert.equal(c.signal, env.signal);
      assert(
        !/score|earnedMarks|isCorrect|answers|username|region/.test(c.data),
      );
    }
  } finally {
    env.restore();
  }
});
test("401 practice refresh replays exactly the same save body and request ID", async () => {
  const calls: InternalAxiosRequestConfig[] = [];
  let failed = false;
  const env = setup(async (c: InternalAxiosRequestConfig) => {
    if (c.url.endsWith("/auth/refresh"))
      return ok(c, {
        accessToken: "fresh-access",
        refreshToken: "fresh-refresh",
      });
    calls.push(c);
    if (!failed) {
      failed = true;
      return reject(c, 401);
    }
    return ok(c, { status: true, data: { saved: "accepted" } });
  });
  try {
    const body = {
      requestId: "stable-save",
      expectedRevision: 4,
      optionId: "B",
    };
    await env.service.save(env.owner, env.signal, "session", "question", body);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].data, calls[1].data);
    assert.deepEqual(JSON.parse(calls[1].data), body);
    assert.equal(calls[1].headers.Authorization, "Bearer fresh-access");
  } finally {
    env.restore();
  }
});
test("region switch during refresh never rotates the new region tokens or replays old practice", async () => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let refreshStarted!: () => void;
  const started = new Promise<void>((r) => (refreshStarted = r));
  let calls = 0;
  const env = setup(async (c: InternalAxiosRequestConfig) => {
    if (c.url.endsWith("/auth/refresh")) {
      refreshStarted();
      await gate;
      return ok(c, {
        accessToken: "stale-region",
        refreshToken: "stale-refresh",
      });
    }
    calls++;
    return reject(c, 401);
  });
  try {
    const promise = env.service.save(
      env.owner,
      env.signal,
      "session",
      "question",
      { requestId: "save", expectedRevision: 0, optionId: "B" },
    );
    const rejected = assert.rejects(promise);
    await started;
    env.values.set(
      "AiTutorUser",
      JSON.stringify({ ...env.owner, region: "SAUDI" }),
    );
    env.values.set("accessToken", "new-region-token");
    release();
    await rejected;
    assert.equal(calls, 1);
    assert.equal(env.values.get("accessToken"), "new-region-token");
    assert.equal(env.values.get("refreshToken"), "old-refresh");
  } finally {
    env.restore();
  }
});
test("a region/account switch or abort rejects before any practice request is sent", async () => {
  let calls = 0;
  const env = setup(async (c: InternalAxiosRequestConfig) => {
    calls++;
    return ok(c, { status: true, data: {} });
  });
  try {
    env.values.set(
      "AiTutorUser",
      JSON.stringify({ ...env.owner, region: "SAUDI" }),
    );
    await assert.rejects(env.service.session(env.owner, env.signal, "session"));
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      env.service.session(env.owner, controller.signal, "session"),
    );
    assert.equal(calls, 0);
  } finally {
    env.restore();
  }
});
