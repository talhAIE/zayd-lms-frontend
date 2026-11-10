import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("teacher frontend with real Nest/PostgreSQL access policy", () => {
  test.skip(
    process.env.NAFS_TEACHER_DATABASE_QA !== "true",
    "Requires the explicitly owned local teacher QA server.",
  );
  const file = path.resolve(
    process.cwd(),
    "../zayd-lms-backend/tmp/nafs-phase3/phase5-teacher.private.json",
  );
  for (const kind of ["english", "all", "denied"] as const)
    test(`${kind} teacher: granted scope, final scores and filters`, async ({
      page,
      request,
    }) => {
      const session = JSON.parse(fs.readFileSync(file, "utf8"));
      expect(session.baseUrl).toBe("http://127.0.0.1:5019");
      const selected = session.teachers[kind];
      const headers = { Authorization: `Bearer ${selected.accessToken}` };
      await page.addInitScript(({ user, accessToken }) => {
        localStorage.setItem("AiTutorUser", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", "unused-local-teacher-refresh");
      }, selected);
      await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.hostname !== "127.0.0.1") {
          await route.abort();
          return;
        }
        if (url.pathname.startsWith("/api/v1/nafs/")) {
          const response = await route.fetch({
            url: session.baseUrl + url.pathname + url.search,
          });
          await route.fulfill({ response });
          return;
        }
        if (url.pathname.startsWith("/api/")) {
          await route.fulfill({
            status: 404,
            json: {
              message: "No normal assignments in this isolated QA server",
            },
          });
          return;
        }
        await route.continue();
      });
      const raw = await request.get(
        `${session.baseUrl}/api/v1/nafs/teacher/results?limit=100`,
        { headers },
      );
      expect(raw.status()).toBe(200);
      expect(raw.headers()["cache-control"]).toContain("no-store");
      const data = (await raw.json()).data;
      expect(JSON.stringify(data)).not.toMatch(
        /correctOptionId|answerKey|snapshotJson|selections|questions|relativePath|sha256/,
      );
      expect(data.pagination.total).toBe(
        kind === "all" ? 13 : kind === "english" ? 6 : 0,
      );
      expect(data.assessments).toHaveLength(
        kind === "all" ? 12 : kind === "english" ? 6 : 0,
      );
      if (kind !== "all")
        expect(
          data.results.some(
            (r: any) => r.student.id === session.otherStudentId,
          ),
        ).toBe(false);
      if (kind === "english")
        expect(
          data.assessments.every((a: any) => a.courseTitle.includes("English")),
        ).toBe(true);
      await page.goto("/teacher/dashboard");
      const panel = page.getByRole("region", { name: "NAFS results" });
      if (kind === "denied") {
        await expect(
          page.getByText(/Error loading students data/),
        ).toBeVisible();
        await expect(panel).toHaveCount(0);
        return;
      }
      await expect(panel).toBeVisible();
      await expect(
        panel.getByLabel("NAFS assessment", { exact: true }).locator("option"),
      ).toHaveCount(data.assessments.length + 1);
      for (const row of data.results.filter(
        (r: any) => r.state === "completed",
      )) {
        const studentCourses = await request.get(
          `${session.baseUrl}/api/v1/nafs/courses`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        );
        const course = (await studentCourses.json()).data.courses.find(
          (c: any) => c.assessmentId === row.assessment.id,
        );
        const studentResult = await request.get(
          `${session.baseUrl}/api/v1/nafs/attempts/${course.attemptId}/result`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        );
        const result = (await studentResult.json()).data.result;
        expect(row.earnedMarks).toBe(result.earnedMarks);
        expect(row.assessment.totalMarks).toBe(result.totalMarks);
        await panel
          .getByLabel("NAFS assessment", { exact: true })
          .selectOption(row.assessment.id);
        await panel
          .getByLabel("NAFS completion", { exact: true })
          .selectOption("completed");
        await expect(
          panel.getByRole("cell", {
            name: `${result.earnedMarks} / ${result.totalMarks}`,
            exact: true,
          }),
        ).toBeVisible();
      }
      if (kind === "english") {
        // Directly guessing a different subject cannot widen results or filter options.
        const denied = await request.get(
          `${session.baseUrl}/api/v1/nafs/teacher/results?assessmentId=${session.fixtures[1]}`,
          { headers },
        );
        const body = (await denied.json()).data;
        expect(body.results).toEqual([]);
        expect(
          body.assessments.every((a: any) => a.courseTitle.includes("English")),
        ).toBe(true);
        await expect(panel.getByRole("option", { name: /Math/ })).toHaveCount(
          0,
        );
      } else {
        await panel.getByRole("button", { name: "Clear NAFS filters" }).click();
        await expect(panel.getByText("Page 1 of 2")).toBeVisible();
        await panel
          .getByRole("button", { name: "Next NAFS results page" })
          .click();
        await expect(panel.getByText("Page 2 of 2")).toBeVisible();
        await expect(panel.getByRole("row")).toHaveCount(4);
      }
      const forged = await request.get(
        `${session.baseUrl}/api/v1/nafs/teacher/results?studentId=${session.otherStudentId}`,
        { headers },
      );
      expect(forged.status()).toBe(400);
      const studentOnly = await request.get(
        `${session.baseUrl}/api/v1/nafs/courses`,
        { headers },
      );
      expect(studentOnly.status()).toBe(403);
      const wrongRole = await request.get(
        `${session.baseUrl}/api/v1/nafs/teacher/results`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );
      expect(wrongRole.status()).toBe(403);
    });
});
