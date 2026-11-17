import { test, expect } from "@playwright/test";
import { fixture, read } from "./fixtures";

test("Module 1 Kahoot and PhET stay in the Zayd dialog", async ({ page }) => {
  await fixture(page);
  const unit = "nature-of-science-unit-1";
  const state = (activityKey: string) => ({
    activityKey,
    opened: true,
    completed: false,
    firstOpenedAt: new Date().toISOString(),
    completedAt: null,
  });
  const activities = [
    {
      activityKey: "practice",
      title: "Practice",
      kind: "external_practice",
      provider: "kahoot",
      nextActivityKey: "simulation",
    },
    {
      activityKey: "simulation",
      title: "Simulation",
      kind: "external_simulation",
      provider: "phet",
      nextActivityKey: null,
    },
  ];
  await page.route("**/api/v1/science-spark/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const key = path.includes("/simulation/") ? "simulation" : "practice";
    let data: unknown = {
      unit: { unitKey: unit, title: "Unit 1" },
      activities: activities.map((activity) => ({
        activity,
        state: state(activity.activityKey),
      })),
      unitCompleted: false,
    };
    if (path.endsWith("/content"))
      data =
        key === "practice"
          ? {
              kind: "external_practice",
              activityKey: key,
              provider: "kahoot",
              embedMode: "preview",
              embedUrl:
                "https://embed.kahoot.it/aa08c9f9-3350-4fcb-85da-2a34eaf58169",
              detailsUrl:
                "https://create.kahoot.it/details/light/aa08c9f9-3350-4fcb-85da-2a34eaf58169",
            }
          : {
              kind: "external_simulation",
              activityKey: key,
              provider: "phet",
              embedUrl:
                "https://phet.colorado.edu/sims/html/quantum-wave-interference/latest/quantum-wave-interference_en.html",
              detailsUrl:
                "https://phet.colorado.edu/en/simulations/quantum-wave-interference",
            };
    else if (path.endsWith("/open")) data = state(key);
    return route.fulfill({ json: { status: true, data } });
  });
  await page.route(
    /https:\/\/(embed\.kahoot\.it|phet\.colorado\.edu)\//,
    (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<button>Embedded activity fixture</button>",
      }),
  );
  for (const key of ["practice", "simulation"]) {
    await page.goto(`/student/science/units/${unit}/activities/${key}`);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("iframe")).toHaveAttribute(
      "src",
      key === "practice"
        ? /embed\.kahoot\.it/
        : /sims\/html\/quantum-wave-interference/,
    );
    await expect(page.frameLocator("iframe").getByRole("button")).toBeVisible();
    await expect(
      page.getByRole("dialog").locator('a[target="_blank"]'),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: key === "practice" ? "Close Practice" : "Close Simulation",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(`/student/science/units/${unit}`);
  }
});

for (const width of [1440, 390])
  for (const unit of [2, 3]) {
    test(`Unit ${unit} embeds every Kahoot and PhET inside Zayd at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await fixture(page, unit);
      await page.route(
        /https:\/\/(embed\.kahoot\.it|phet\.colorado\.edu)\//,
        (route) =>
          route.fulfill({
            contentType: "text/html",
            body: '<html><body><button onclick="document.body.dataset.played=\'true\'">Play fixture</button><a href="https://example.invalid" target="_blank">Popup fixture</a></body></html>',
          }),
      );
      const external = read(
        `${unit === 2 ? "motion-unit2-v2" : "forces-unit3-v1"}/external.json`,
      );
      for (const activity of external.activities) {
        const path = `/student/science/spark-science/unit-${unit}/activities/${activity.key}`;
        await page.goto(path);
        const frame = page.locator("iframe");
        await expect(frame).toBeVisible();
        await expect(page.locator('a[target="_blank"]')).toHaveCount(0);
        await expect(frame).not.toHaveAttribute(
          "sandbox",
          /allow-popups|allow-top-navigation/,
        );
        for (const target of activity.targets ?? [activity]) {
          if (activity.targets?.length > 1)
            await page
              .getByRole("button", { name: target.title, exact: true })
              .click();
          const expected =
            activity.provider === "kahoot"
              ? `https://embed.kahoot.it/${target.url.match(/[0-9a-f-]{36}/i)![0]}`
              : target.key === "friction"
                ? "https://phet.colorado.edu/sims/html/friction/latest/friction_en.html"
                : target.url;
          await expect(frame).toHaveAttribute("src", expected);
          await page
            .frameLocator("iframe")
            .getByRole("button", { name: "Play fixture" })
            .click();
          await expect(
            page.frameLocator("iframe").locator("body"),
          ).toHaveAttribute("data-played", "true");
          await page.frameLocator("iframe").getByText("Popup fixture").click();
          await expect(page).toHaveURL(path);
          expect(page.context().pages()).toHaveLength(1);
        }
        await page
          .getByRole("button", { name: "Reload player", exact: true })
          .click();
        await expect(
          page.frameLocator("iframe").locator("body"),
        ).not.toHaveAttribute("data-played", "true");
        await page
          .getByRole("button", { name: "Complete and return", exact: true })
          .click();
        await expect(page).not.toHaveURL(path);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }
