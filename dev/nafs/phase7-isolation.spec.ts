import { expect, test } from "@playwright/test";
import { installFixture } from "./browser-fixture";

for (const width of [390, 1440]) {
  test(`NAFS discovery failure leaves ordinary, 3D and Science course entries intact at ${width}px`, async ({
    page,
  }) => {
    const state = await installFixture(page);
    state.failDiscovery = true;
    await page.setViewportSize({ width, height: 950 });
    await page.route("**/api/v1/3d-avatar/availability", (route) =>
      route.fulfill({ json: { available: true } }),
    );
    await page.route("**/api/v1/science-spark/courses", (route) =>
      route.fulfill({
        json: {
          status: true,
          data: {
            available: true,
            courses: [
              {
                courseKey: "synthetic-science",
                sourceGrade: "9",
                title: "Synthetic Science",
                description: "Local fixture",
              },
            ],
          },
        },
      }),
    );
    await page.route("**/api/v1/spark-science/course", (route) =>
      route.fulfill({
        json: {
          status: true,
          data: {
            available: true,
            course: {
              key: "synthetic-spark",
              title: "Synthetic Spark Science",
              description: "Local fixture",
              grade: "9",
              unitKey: "unit",
              unitTitle: "Unit",
              progressPct: 0,
              completedActivities: 0,
              totalActivities: 5,
              completedUnits: 0,
              status: "not_started",
              activities: [],
            },
          },
        },
      }),
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/student/courses");
    await expect(
      page.getByRole("button", { name: "Retry loading NAFS" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Existing English course" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "3D Avatar Mode" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /3D Avatar Mode/ }),
    ).toHaveAttribute("href", "/student/3d-avatar");
    await expect(
      page.getByRole("heading", { name: "Synthetic Science", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open Science" }),
    ).toHaveAttribute("href", "/student/science/courses/synthetic-science");
    await expect(
      page.getByRole("heading", {
        name: "Synthetic Spark Science",
        exact: true,
      }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    expect(
      state.requests.filter((r) => r.path.startsWith("/nafs/practice/")),
    ).toEqual([]);
  });
}
