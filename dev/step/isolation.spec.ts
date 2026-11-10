import { test, expect } from "@playwright/test";
import { mock } from "./browser-fixture";
// Exercise existing Primary routes with synthetic snapshots, never production.
for (const grade of [1, 2, 3])
  for (const width of [390, 1440])
    test(`Primary grade ${grade} at ${width}px keeps its own MCQ flow`, async ({
      page,
    }) => {
      const state = await mock(page);
      await page.setViewportSize({ width, height: 900 });
      const lesson = {
        id: `primary-${grade}`,
        grade,
        title: `Synthetic Primary Grade ${grade}`,
        contentVersion: 1,
      };
      const snapshot = {
        sessionId: "primary-session",
        revision: 0,
        lesson,
        progress: { completedItems: 1, totalItems: 4, completed: false },
        item: {
          id: "practice",
          step: "practice",
          imageKey: "picture",
          prompt: { text: "Which picture do you like?", audioKey: "prompt" },
          options: [
            { id: "a", text: "A garden", audioKey: "a" },
            { id: "b", text: "A classroom", audioKey: "b" },
          ],
        },
        feedback: null as null | {
          text: string;
          accepted: boolean;
          selectedOptionId: string;
        },
        selectedModelId: null,
        draftId: null,
        allowedActions: ["choose"],
        media: {
          picture: { kind: "image", alt: "Synthetic practice picture" },
        },
      };
      await page.route("**/api/v1/primary/**", async (route) => {
        const p = new URL(route.request().url()).pathname;
        if (p.endsWith("/availability"))
          return route.fulfill({ json: { available: true, lesson } });
        if (p.includes("/media/"))
          return route.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#dbeafe"/></svg>',
          });
        if (p.endsWith("/actions")) {
          snapshot.revision++;
          snapshot.feedback = {
            text: "Synthetic Primary feedback",
            accepted: true,
            selectedOptionId: "a",
          };
        }
        return route.fulfill({ json: snapshot });
      });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/student/primary/${lesson.id}`);
      await expect(
        page.getByRole("heading", { name: lesson.title }),
      ).toBeVisible();
      await expect(
        page.getByRole("list", { name: "Lesson steps" }),
      ).toBeVisible();
      await expect(
        page.getByRole("img", { name: "Synthetic practice picture" }),
      ).toBeVisible();
      await page
    .getByRole("button", { name: "Choose: A garden", exact: true })
        .first()
        .click();
      await expect(
        page.getByText("Synthetic Primary feedback", { exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
      expect(state.requests.filter((r) => r.path.startsWith("/step/"))).toEqual(
        [],
      );
    });
