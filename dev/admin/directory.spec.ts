import { test, expect, type Page } from "@playwright/test";
const blue = "11111111-1111-4111-8111-111111111111",
  green = "22222222-2222-4222-8222-222222222222";
async function fixture(
  page: Page,
  role = "zayd_super_admin",
  authenticated = true,
) {
  const user = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    username: "admin.synthetic",
    firstName: "Synthetic",
    name: "Synthetic Admin",
    role,
    region: "ROW",
    phoneNumber: null,
  };
  if (authenticated)
    await page.addInitScript((value) => {
      localStorage.setItem("AiTutorUser", JSON.stringify(value));
      localStorage.setItem("accessToken", "synthetic-admin-token");
      localStorage.setItem("refreshToken", "synthetic-refresh-token");
    }, user);
  const program = role.startsWith("nafs_") ? "nafs" : "zayd";
  const schoolScoped = role.endsWith("school_admin");
  const actor = {
    ...user,
    displayName: "Synthetic Admin",
    program,
    scope: schoolScoped ? "school" : "super",
    schoolId: blue,
    schoolName: "Blue School",
  };
  const schools = [
    { id: blue, name: "Blue School", curriculum: "American" },
    { id: green, name: "Green School", curriculum: "American" },
  ];
  const students = Array.from({ length: 26 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    username: `student${String(index + 1).padStart(2, "0")}`,
    displayName: `Synthetic Learner ${index + 1}`,
    schoolId: index % 2 ? green : blue,
    schoolName: index % 2 ? "Green School" : "Blue School",
    curriculum: "American",
    grade: ["3", "6", "9"][index % 3],
    className: ["A", "B"][index % 2],
    status: index === 25 ? "inactive" : "active",
    stats: {
      currentStreak: 1,
      totalUsageSec: 120,
      totalPoints: 10,
      totalLessonsDone: 2,
      totalLessonModesDone: 4,
    },
    nafs: { simulatorCompleted: 1, practiceCompleted: 2 },
  }));
  const state = {
    failed: false,
    delay: 0,
    requests: [] as string[],
    loginBodies: [] as Array<{ username: string; password?: string }>,
  };
  await page.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") return route.abort();
    if (!url.pathname.startsWith("/api/v1/")) return route.continue();
    const path = url.pathname.slice("/api/v1".length);
    state.requests.push(path + url.search);
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, json: { status: "success", data } });
    if (path === "/auth/login") {
      state.loginBodies.push(
        request.postDataJSON() as { username: string; password?: string },
      );
      return route.fulfill({
        status: 200,
        json: {
          status: "success",
          user: { ...user, role: role.toUpperCase() },
          accessToken: "synthetic-admin-token",
          refreshToken: "synthetic-refresh-token",
        },
      });
    }
    if (path === "/auth/logout") return json({});
    if (path === "/admin/filters")
      return json({
        actor,
        schools: schoolScoped ? [schools[0]] : schools,
        grades: ["3", "6", "9"],
        classes: ["A", "B"],
      });
    if (path === "/admin/dashboard") {
      if (state.delay)
        await new Promise((resolve) => setTimeout(resolve, state.delay));
      if (state.failed) return json({}, 503);
      let rows = students.filter((s) => !schoolScoped || s.schoolId === blue);
      const school = url.searchParams.get("schoolId"),
        grade = url.searchParams.get("grade"),
        search = url.searchParams.get("search"),
        status = url.searchParams.get("status");
      if (school) rows = rows.filter((s) => s.schoolId === school);
      if (grade) rows = rows.filter((s) => s.grade === grade);
      if (search)
        rows = rows.filter(
          (s) =>
            s.username.includes(search) ||
            s.displayName.toLowerCase().includes(search.toLowerCase()),
        );
      if (status && status !== "all")
        rows = rows.filter((s) => s.status === status);
      const page = Number(url.searchParams.get("page") || 1),
        limit = Number(url.searchParams.get("limit") || 20);
      return json({
        actor,
        summary: {
          totalStudents: rows.length,
          activeStudents: rows.filter((s) => s.status === "active").length,
          inactiveStudents: rows.filter((s) => s.status !== "active").length,
          schools: new Set(rows.map((s) => s.schoolId)).size,
        },
        students: rows
          .slice((page - 1) * limit, page * limit)
          .map((s) =>
            program === "nafs"
              ? { ...s, stats: undefined }
              : { ...s, nafs: undefined },
          ),
        pagination: {
          page,
          limit,
          total: rows.length,
          totalPages: Math.max(1, Math.ceil(rows.length / limit)),
        },
      });
    }
    if (path.startsWith("/admin/students/")) {
      const student = students.find((s) => path.endsWith(s.id));
      if (!student) return json({}, 404);
      const attempt = {
        id: "synthetic-result",
        state: "submitted",
        earnedMarks: 4,
        totalMarks: 5,
        completedAt: "2026-11-16T10:00:00Z",
      };
      return json(
        program === "nafs"
          ? {
              actor,
              student,
              simulator: [
                {
                  id: "simulator",
                  title: "NAFS English Grade 3",
                  subject: "english",
                  grade: "3",
                  attempt,
                },
              ],
              quizzes: [
                {
                  id: "quiz",
                  title: "NAFS English Grade 3 · Quiz 1",
                  subject: "english",
                  grade: "3",
                  runs: [{ ...attempt, state: "completed", runNumber: 1 }],
                },
              ],
            }
          : {
              actor,
              student,
              stats: student.stats,
              courses: [
                {
                  course: {
                    id: "course",
                    title: "Synthetic English",
                    subject: "English",
                    grade: "3",
                  },
                  progressPct: 50,
                  status: "active",
                  completedAt: null,
                },
              ],
            },
      );
    }
    return json({}, 404);
  });
  return state;
}
for (const width of [1440, 390])
  test(`super admin directory at ${width}px searches, filters schools and opens profiles`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const state = await fixture(page);
    await page.goto("/admin/dashboard");
    await expect(
      page.getByRole("heading", { name: "Zayd Student Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("26 students · Page 1 of 2")).toBeVisible();
    await page.getByLabel("Search username or name").fill("student03");
    await expect(page.getByText("1 students · Page 1 of 1")).toBeVisible();
    await expect(
      page.getByRole("table").getByText("student03", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByLabel("School", { exact: true }).selectOption(green);
    await expect(page.getByText("13 students · Page 1 of 1")).toBeVisible();
    await expect(page.getByRole("table").getByText("Blue School")).toHaveCount(
      0,
    );
    await page.getByLabel("Grade", { exact: true }).selectOption("3");
    await expect(page.getByText("4 students · Page 1 of 1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: info.outputPath(`admin-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "View student04", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Synthetic Learner 4" }),
    ).toBeVisible();
    await expect(
      page.getByText("Synthetic English", { exact: true }),
    ).toBeVisible();
    expect(state.requests.some((r) => r.includes("search=student03"))).toBe(
      true,
    );
  });
test("school admin is presented with only its locked school and students", async ({
  page,
}) => {
  await fixture(page, "zayd_school_admin");
  await page.goto("/admin/dashboard");
  await expect(page.getByLabel("School", { exact: true })).toBeDisabled();
  await expect(
    page.getByLabel("School", { exact: true }).locator("option"),
  ).toHaveCount(1);
  await expect(page.getByText("13 students · Page 1 of 1")).toBeVisible();
  await expect(page.getByRole("table").getByText("Green School")).toHaveCount(
    0,
  );
});
test("NAFS admin sees NAFS-only metrics and separate simulator/quiz student results", async ({
  page,
}) => {
  await fixture(page, "nafs_super_admin");
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("heading", { name: "NAFS Student Dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Simulator completed" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Usage", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByLabel("Sort by")
      .getByRole("option", { name: "Points", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "View student01", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Simulator Test", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quizzes", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("4 / 5", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Recorded course enrollments")).toHaveCount(0);
});
test("legacy admin sign-in redirects to the shared login page", async ({ page }) => {
  await fixture(page, "zayd_super_admin", false);
  await page.goto("/admin/login");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome Back!" })).toBeVisible();
});
test("normal login signs admins in directly using username", async ({
  page,
}) => {
  const f = await fixture(page, "zayd_super_admin", false);
  await page.goto("/login");
  await page.getByRole("textbox").fill("super.admin.zayd");
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  expect(f.loginBodies[0]).toEqual({ username: "super.admin.zayd" });
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
});
for (const role of ["student", "teacher"])
  test(`${role} cannot enter the admin portal`, async ({ page }) => {
    const f = await fixture(page, role);
    await page.goto("/admin/dashboard");
    await expect(page).not.toHaveURL(/\/admin\/dashboard$/);
    expect(f.requests.filter((r) => r.startsWith("/admin/"))).toHaveLength(0);
  });
test("failed directory load can retry and paginate without exposing a stale page", async ({
  page,
}) => {
  const f = await fixture(page);
  f.failed = true;
  await page.goto("/admin/dashboard");
  await expect(page.getByRole("alert")).toContainText(
    "Student data could not load",
  );
  f.failed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("26 students · Page 1 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("26 students · Page 2 of 2")).toBeVisible();
  await expect(
    page.getByRole("table").getByText("student01", { exact: true }),
  ).toHaveCount(0);
});
test("switching account removes student data and ignores a late response", async ({
  page,
}) => {
  const f = await fixture(page);
  f.delay = 1200;
  await page.goto("/admin/dashboard");
  await expect(page.getByText("Loading students…")).toBeVisible();
  await page.evaluate(() => {
    const previous = localStorage.getItem("AiTutorUser");
    const next = JSON.stringify({
      id: "other-admin",
      username: "other",
      role: "nafs_school_admin",
      region: "ROW",
    });
    localStorage.setItem("AiTutorUser", next);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "AiTutorUser",
        oldValue: previous,
        newValue: next,
      }),
    );
  });
  await expect(page.getByRole("alert")).toContainText("Admin session changed");
  await expect(page.getByRole("table")).toHaveCount(0);
});
