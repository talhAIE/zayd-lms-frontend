import { test, expect } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import axios from "axios";

function setup(adapter: any) {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  };
  const original = axios.defaults.adapter;
  axios.defaults.adapter = adapter;
  const load = (file: string, api?: unknown) => {
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
    const module = { exports: {} as any };
    vm.runInNewContext(js, {
      module,
      exports: module.exports,
      localStorage,
      Blob,
      console: { warn() {} },
      window: { location: { href: "" } },
      require: (key: string) => {
        if (key === "axios") return axios;
        if (key === "@/config/ApiConfig")
          return { default: api, __esModule: true };
        if (key === "@/utils/tokenUtils")
          return { clearAuthData: () => values.clear() };
        throw Error("Unexpected runtime dependency");
      },
    });
    return module.exports;
  };
  const api = load("config/ApiConfig.tsx").default;
  const exports = load("services/nafsService.ts", api);
  const service = exports.nafsService;
  const owner = { id: "nafs-service-test", username: "nafs.synthetic" };
  values.set("AiTutorUser", JSON.stringify({ ...owner, role: "student" }));
  values.set("accessToken", "old-access");
  values.set("refreshToken", "old-refresh");
  return {
    service,
    teacherService: exports.nafsTeacherService,
    owner,
    values,
    signal: new AbortController().signal,
    restore: () => {
      axios.defaults.adapter = original;
    },
  };
}
const ok = (config: any, data: any) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});
const reject = (config: any, status: number) =>
  Promise.reject(
    new axios.AxiosError(
      "synthetic transport failure",
      "ERR_BAD_REQUEST",
      config,
      undefined,
      { ...ok(config, {}), status },
    ),
  );
test("NAFS mutations preserve contract envelopes, request IDs, bounded timeout and shared bearer auth", async () => {
  const calls: any[] = [];
  const env = setup(async (c: any) => {
    calls.push(c);
    return ok(c, { status: true, data: { saved: "synthetic-response" } });
  });
  try {
    const body = {
      optionId: "A",
      expectedRevision: 4,
      requestId: "fixed-request",
    };
    expect(
      await env.service.save(
        env.owner,
        env.signal,
        "attempt",
        "question",
        body,
      ),
    ).toEqual({ saved: "synthetic-response" });
    expect(calls[0].url).toBe("/nafs/attempts/attempt/answers/question");
    expect(calls[0].baseURL).toBe("http://nafs.local/api/v1");
    expect(calls[0].headers.Authorization).toBe("Bearer old-access");
    expect(calls[0].timeout).toBe(30000);
    expect(JSON.parse(calls[0].data)).toEqual(body);
  } finally {
    env.restore();
  }
});
test("optional 404 discovery is empty, while direct access and server failures stay errors", async () => {
  const env = setup((c: any) => reject(c, 404));
  try {
    expect(await env.service.courses(env.owner, env.signal)).toEqual({
      courses: [],
    });
    await assert.rejects(async () =>
      env.service.assessment(env.owner, env.signal, "quiz"),
    );
  } finally {
    env.restore();
  }
  const failed = setup((c: any) => reject(c, 503));
  try {
    await assert.rejects(async () =>
      failed.service.courses(failed.owner, failed.signal),
    );
  } finally {
    failed.restore();
  }
});
test("account change or aborted lifetime cancels before a NAFS request can be sent", async () => {
  let calls = 0;
  const env = setup((c: any) => {
    calls++;
    return ok(c, {});
  });
  try {
    env.values.set(
      "AiTutorUser",
      JSON.stringify({ id: "other", username: "other", role: "student" }),
    );
    await assert.rejects(async () =>
      env.service.start(env.owner, env.signal, "quiz"),
    );
    expect(calls).toBe(0);
  } finally {
    env.restore();
  }
});
test("a delayed response from a previous student is never delivered to the next session", async () => {
  let release!: (response: any) => void, config: any;
  const env = setup((c: any) => {
    config = c;
    return new Promise((r) => {
      release = r;
    });
  });
  try {
    const pending = env.service.attempt(env.owner, env.signal, "attempt");
    const rejected = assert.rejects(async () => pending);
    await expect.poll(() => Boolean(release)).toBe(true);
    env.values.set(
      "AiTutorUser",
      JSON.stringify({ id: "next", username: "next", role: "student" }),
    );
    release(ok(config, { status: true, data: { attempt: "must not render" } }));
    await rejected;
  } finally {
    env.restore();
  }
});
test("401 refresh reuses the exact save payload and updates bearer authorization once", async () => {
  const calls: any[] = [];
  const env = setup(async (c: any) => {
    calls.push(c);
    if (c.url.endsWith("/auth/refresh"))
      return ok(c, { accessToken: "new-access", refreshToken: "new-refresh" });
    if (c.headers.Authorization === "Bearer old-access") return reject(c, 401);
    return ok(c, { status: true, data: { saved: true } });
  });
  try {
    const body = {
      optionId: "A",
      expectedRevision: 0,
      requestId: "same-on-refresh",
    };
    await env.service.save(env.owner, env.signal, "attempt", "q", body);
    expect(calls.filter((c) => c.url.endsWith("/auth/refresh"))).toHaveLength(
      1,
    );
    const saves = calls.filter((c) => c.url.includes("/answers/"));
    expect(saves).toHaveLength(2);
    expect(saves.map((c) => JSON.parse(c.data))).toEqual([body, body]);
    expect(saves[1].headers.Authorization).toBe("Bearer new-access");
  } finally {
    env.restore();
  }
});
test("private media uses the API asset route and Blob bytes, never query-string credentials", async () => {
  let sent: any;
  const env = setup(async (c: any) => {
    sent = c;
    return ok(c, new Blob(["synthetic PNG bytes"], { type: "image/png" }));
  });
  try {
    const blob = await env.service.media(
      env.owner,
      env.signal,
      "attempt",
      "asset",
    );
    expect(blob.type).toBe("image/png");
    expect(sent.url).toBe("/nafs/attempts/attempt/assets/asset");
    expect(sent.url).not.toContain("?");
    expect(sent.responseType).toBe("blob");
    expect(sent.headers.Authorization).toBe("Bearer old-access");
  } finally {
    env.restore();
  }
});

test("teacher results share bearer refresh and preserve filters without client teacher identity", async () => {
  const calls: any[] = [];
  const env = setup(async (c: any) => {
    calls.push(c);
    if (c.url.endsWith("/auth/refresh"))
      return ok(c, { accessToken: "new-access", refreshToken: "new-refresh" });
    if (c.headers.Authorization === "Bearer old-access") return reject(c, 401);
    return ok(c, {
      status: true,
      data: {
        results: [],
        assessments: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      },
    });
  });
  const owner = { ...env.owner, role: "teacher" };
  env.values.set("AiTutorUser", JSON.stringify(owner));
  try {
    const query = {
      assessmentId: "english-only",
      completion: "completed",
      page: 2,
      limit: 10,
    };
    await env.teacherService.results(owner, env.signal, query);
    const reads = calls.filter((c) => c.url === "/nafs/teacher/results");
    expect(reads).toHaveLength(2);
    expect(reads.map((c) => c.params)).toEqual([query, query]);
    expect(reads[1].headers.Authorization).toBe("Bearer new-access");
    expect(reads[1].timeout).toBe(30000);
    expect(calls.filter((c) => c.url.endsWith("/auth/refresh"))).toHaveLength(
      1,
    );
  } finally {
    env.restore();
  }
});

test("a student cannot issue a teacher results request through the teacher transport", async () => {
  let sent = 0;
  const env = setup(async (c: any) => {
    sent++;
    return ok(c, {});
  });
  try {
    await assert.rejects(() =>
      env.teacherService.results(env.owner, env.signal, {}),
    );
    await assert.rejects(() =>
      env.teacherService.results(
        { ...env.owner, role: "teacher" },
        env.signal,
        {},
      ),
    );
    expect(sent).toBe(0);
  } finally {
    env.restore();
  }
});

test("a late teacher response is canceled after role change even when user ID stays the same", async () => {
  let release!: (response: any) => void, config: any;
  const env = setup((c: any) => {
    config = c;
    return new Promise((r) => {
      release = r;
    });
  });
  const owner = { ...env.owner, role: "teacher" };
  env.values.set("AiTutorUser", JSON.stringify(owner));
  try {
    const pending = env.teacherService.results(owner, env.signal, {});
    const rejected = assert.rejects(async () => pending);
    await expect.poll(() => Boolean(release)).toBe(true);
    env.values.set(
      "AiTutorUser",
      JSON.stringify({ ...owner, role: "student" }),
    );
    release(
      ok(config, { status: true, data: { results: ["must not render"] } }),
    );
    await rejected;
  } finally {
    env.restore();
  }
});
