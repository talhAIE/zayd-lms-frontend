import { test, expect } from "@playwright/test";
import { fixture, read } from "./fixtures";
const unit = "/student/science/spark-science/unit-3";
test("Unit 3 lesson cards, exact PhET destinations and lesson navigation", async ({
  page,
}) => {
  await fixture(page, 3);
  for (const [lesson, count] of [
    [1, 3],
    [2, 4],
    [3, 3],
  ]) {
    await page.goto(`${unit}/activities/lesson-${lesson}`);
    await expect(
      page.getByRole("link", {
        name: /Interactive Lesson|Lesson Quiz|Lesson Kahoot|PhET Simulations/,
      }),
    ).toHaveCount(count);
    await expect(page.getByRole("link", { name: /Lesson Kahoot/ })).toHaveCount(
      lesson === 2 ? 1 : 0,
    );
  }
  await page.goto(`${unit}/activities/lesson-1-phet`);
  await expect(page.getByRole("group", { name: "Choose simulation" }).getByRole("button")).toHaveCount(3);
  await expect(
    page.locator("iframe"),
  ).toHaveAttribute(
    "src",
    "https://phet.colorado.edu/sims/html/friction/latest/friction_en.html",
  );
  await page
    .getByRole("button", { name: "Complete and return", exact: true })
    .click();
  await expect(page).toHaveURL(`${unit}/activities/lesson-1`);
  await page.getByRole("link", { name: /Interactive Lesson/ }).click();
  await expect(page.locator("iframe")).toBeVisible();
  await page
    .getByRole("button", { name: "Next activity", exact: true })
    .click();
  await expect(page).toHaveURL(`${unit}/activities/lesson-1`);
});
for (const width of [1440, 390])
  test(`all Unit 3 quizzes accept text fills, save, resume, submit and restore at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await fixture(page, 3);
    page.on("dialog", (d) => d.accept());
    for (const key of ["lesson-1", "lesson-2", "lesson-3", "unit"]) {
      const quiz = read(`forces-quizzes-v1/learner/${key}.json`);
      await page.goto(
        `${unit}/activities/${key === "unit" ? "unit-quiz" : key + "-quiz"}`,
      );
      await expect(
        page.getByRole("heading", { name: quiz.title, exact: true }),
      ).toBeVisible();
      for (const q of quiz.questions) {
        await page
          .getByRole("button", { name: q.sourceLabel, exact: true })
          .click();
        if (q.componentType === "mcq")
          await page.getByRole("radio").first().check();
        else if (q.componentType === "open_input")
          await page
            .getByRole("textbox")
            .fill("Scientific explanation and calculation with units.");
        else {
          const inputs = page.getByRole("textbox");
          await expect(inputs).toHaveCount(q.fields.length);
          for (let i = 0; i < q.fields.length; i++) {
            await expect(inputs.nth(i)).toHaveAttribute("inputmode", "text");
            await inputs.nth(i).fill("  scientific term  ");
          }
        }
        await page
          .getByRole("button", { name: "Check Answer", exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: "Correct", exact: true }),
        ).toBeVisible();
      }
      await page.reload();
      await expect(
        page.getByRole("heading", { name: quiz.title, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Submit quiz", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Submit quiz", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Quiz completed", exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Quiz completed", exact: true }),
      ).toBeVisible();
    }
  });
test("course chooser shows both units and opens Unit 3", async ({ page }) => {
  await fixture(page, 3);
  await page.route("**/spark-science/course", (route) =>
    route.fulfill({
      json: {
        status: true,
        data: {
          available: true,
          course: {
            key: "spark-science-motion",
            title: "Spark Science",
            description: "American Grade 9 Science",
            progressPct: 0,
            completedUnits: 0,
            completedActivities: 0,
            totalActivities: 26,
            units: [
              {
                unitNumber: 2,
                unitKey: "motion-unit-1",
                unitTitle: "Unit 2: Motion",
                progressPct: 0,
                status: "not_started",
                totalActivities: 12,
              },
              {
                unitNumber: 3,
                unitKey: "forces-unit-3",
                unitTitle: "Unit 3: Forces and Newton's Laws",
                progressPct: 0,
                status: "not_started",
                totalActivities: 14,
              },
            ],
          },
        },
      },
    }),
  );
  await page.goto("/student/science/spark-science");
  await expect(
    page.getByRole("link", { name: /Unit 2: Motion/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Unit 3: Forces/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Unit 3: Forces and Newton's Laws",
      exact: true,
    }),
  ).toBeVisible();
});
