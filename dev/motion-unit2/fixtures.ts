import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
export const backend = path.resolve(process.cwd(), "../step-backend");
export const read = (p: string) =>
  JSON.parse(
    fs.readFileSync(path.join(backend, "content/science-spark", p), "utf8"),
  );
export async function fixture(page: Page, unitNumber = 2) {
  const catalog = read(
      unitNumber === 3
        ? "forces-unit3-v1/catalog.json"
        : "motion-unit2-v2/catalog.json",
    ),
    external = read(
      unitNumber === 3
        ? "forces-unit3-v1/external.json"
        : "motion-unit2-v2/external.json",
    );
  const quizPrefix =
    unitNumber === 3 ? "forces-quizzes-v1" : "motion-quizzes-v1";
  const attempts = new Map<string, any>(),
    complete = new Set<string>();
  let incorrectCheck = false,
    lostCheck = false,
    failSave = false,
    lostSubmit = false;
  await page.addInitScript(() => {
    if (!localStorage.getItem("AiTutorUser")) {
      localStorage.setItem(
        "AiTutorUser",
        JSON.stringify({
          id: "motion-browser-qa",
          username: "motion.synthetic",
          role: "student",
          region: "ROW",
          firstName: "Science",
          lastName: "QA",
        }),
      );
      localStorage.setItem("accessToken", "synthetic");
      localStorage.setItem("refreshToken", "synthetic-refresh");
    }
  });
  const leaf = (item: any) => ({
    ...item,
    title:
      item.title ||
      (item.kind === "interactive_lesson"
        ? "Interactive Lesson"
        : item.kind === "quiz"
          ? "Lesson Quiz"
          : item.kind === "kahoot"
            ? "Lesson Kahoot"
            : "PhET Simulations"),
    opened: false,
    completed: complete.has(item.key),
    ...(item.externalKey
      ? {
          targets: (() => {
            const e = external.activities.find(
              (e: any) => e.key === item.externalKey,
            );
            return e.targets || [{ key: e.key, title: e.title, url: e.url }];
          })(),
        }
      : {}),
  });
  const course = () => ({
    available: true,
    course: {
      key: "spark-science-motion",
      title: "Spark Science",
      description: "American Grade 9 Science · Motion",
      grade: "9",
      unitTitle:
        unitNumber === 3
          ? "Unit 3: Forces and Newton's Laws"
          : "Unit 2: Motion",
      unitNumber,
      unitKey: unitNumber === 3 ? "forces-unit-3" : "motion-unit-1",
      status: "in_progress",
      progressPct: Math.floor(
        (complete.size / (unitNumber === 3 ? 14 : 12)) * 100,
      ),
      completedActivities: complete.size,
      totalActivities: unitNumber === 3 ? 14 : 12,
      completedUnits: complete.size === (unitNumber === 3 ? 14 : 12) ? 1 : 0,
      activities: catalog.entries.map((e: any) =>
        e.activities
          ? { ...leaf(e), activities: e.activities.map(leaf) }
          : leaf(e),
      ),
    },
  });
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      p = url.pathname
        .replace("/api/v1", "")
        .replace("/spark-science/units/3", "/spark-science"),
      method = request.method();
    const ok = async (data: any) =>
      route.fulfill({ json: { status: true, data } });
    if (p === "/spark-science/course") return ok(course());
    const activity = p.match(
      /^\/spark-science\/activities\/([^/]+)\/(quiz|open|complete|viewer)$/,
    );
    if (activity) {
      const [, key, action] = activity;
      if (action === "quiz") {
        let a = attempts.get(key);
        if (!a) {
          const quizKey =
              key === "unit-quiz" ? "unit" : key.replace("-quiz", ""),
            q = read(`${quizPrefix}/learner/${quizKey}.json`);
          a = {
            id: "attempt-" + key,
            unitNumber,
            quizKey,
            title: q.title,
            questions: q.questions,
            answers: {},
            revision: 0,
            state: "in_progress",
            score: null,
            maxScore: q.totalMarks,
            gradedItems: 0,
            feedback: null,
          };
          attempts.set(key, a);
        }
        return ok(a);
      }
      if (action === "complete") {
        complete.add(key);
        return ok(course());
      }
      if (action === "open") return ok({ key });
      if (action === "viewer")
        return ok({
          path: "/spark-science/view/synthetic/index.html",
          activityKey: key,
          nonce: "synthetic",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        });
    }
    if (p.startsWith("/spark-science/view/"))
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><h1>Interactive Science Lesson</h1><p>Lesson content</p>",
      });
    const match = p.match(/^\/spark-science\/attempts\/([^/]+)(.*)$/);
    if (match) {
      const a = [...attempts.values()].find((a) => a.id === match[1]);
      if (!a)
        return route.fulfill({ status: 404, json: { message: "Not found" } });
      const suffix = match[2];
      if (suffix.startsWith("/images/"))
        return route.fulfill({
          path: path.join(
            backend,
            `content/science-spark/${quizPrefix}/learner/assets`,
            suffix.split("/").pop()!,
          ),
        });
      if (method === "GET") return ok(a);
      const body = request.postDataJSON();
      const questionCheck = suffix.match(/^\/questions\/([^/]+)\/check$/);
      if (questionCheck) {
        const question = a.questions.find(
          (q: any) => q.id === questionCheck[1],
        );
        const key = read(
          `${quizPrefix}/private/${a.quizKey}.grading.json`,
        ).grading.find((k: any) => k.questionId === question.id);
        a.feedback ??= {};
        a.feedback[question.id] ??= {
          score: incorrectCheck ? 0 : question.points,
          maxScore: question.points,
          feedback: "Synthetic feedback.",
          outcome: incorrectCheck ? "incorrect" : "correct",
          correctAnswer: key.sourceReference,
          contentExplanation: key.sourceExplanation,
        };
        incorrectCheck = false;
        a.revision++;
        a.gradedItems = Object.keys(a.feedback).length;
        if (lostCheck) {
          lostCheck = false;
          return route.abort();
        }
        return ok(a);
      }
      if (suffix === "/answers") {
        if (failSave) {
          failSave = false;
          return route.abort();
        }
        if (body.revision !== a.revision)
          return route.fulfill({ status: 409, json: { message: "Conflict" } });
        a.answers = body.answers;
        a.revision++;
        return ok(a);
      }
      if (suffix === "/submit") {
        a.state = "grading";
        if (lostSubmit) {
          lostSubmit = false;
          return route.abort();
        }
        return ok(a);
      }
      if (suffix === "/grade") {
        a.state = "submitted";
        a.score = a.maxScore;
        a.gradedItems = a.questions.length;
        a.feedback ??= Object.fromEntries(
          a.questions.map((q: any) => [
            q.id,
            {
              score: q.points,
              maxScore: q.points,
              feedback: "Synthetic rubric feedback.",
            },
          ]),
        );
        complete.add(a.quizKey === "unit" ? "unit-quiz" : a.quizKey + "-quiz");
        return ok(a);
      }
    }
    if (p.includes("testing"))
      return route.fulfill({ json: { available: false } });
    if (p.endsWith("/courses")) return ok({ courses: [] });
    return ok({ available: false, courses: [], modes: [] });
  });
  return {
    loseNextCheck: () => {
      lostCheck = true;
    },
    incorrectNextCheck: () => {
      incorrectCheck = true;
    },
    attempts,
    complete,
    failNextSave: () => {
      failSave = true;
    },
    loseSubmit: () => {
      lostSubmit = true;
    },
  };
}
