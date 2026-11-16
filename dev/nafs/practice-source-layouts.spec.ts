import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
test("all 139 source equations render as native text beside their original notation", async ({
  page,
}, info) => {
  const root = path.resolve(
    process.cwd(),
    "../zayd-lms-backend/prisma/data/nafs-practice/quiz-1",
  );
  const data = JSON.parse(
    fs.readFileSync(path.join(root, "presentation-v1/display.json"), "utf8"),
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "v1/manifest.json"), "utf8"),
  );
  const cards = [];
  for (const c of manifest.collections) {
    const snapshot = JSON.parse(
      fs.readFileSync(path.join(root, "v1", c.file), "utf8"),
    );
    for (const q of snapshot.questions) {
      const d = data.questions[q.key];
      const fields = [
        {
          label: q.key + " stem",
          field: "stem",
          layout: d.stemLayout,
          asset: q.figureAssetId,
        },
        ...d.options.map((o: { id: string; textLayout: unknown }) => ({
          label: q.key + " " + o.id,
          field: o.id,
          layout: o.textLayout,
          asset: q.options.find((v: { id: string }) => v.id === o.id).assetId,
        })),
      ];
      for (const f of fields) {
        if (!f.layout) continue;
        const asset = snapshot.assets.find(
          (a: { id: string }) => a.id === f.asset,
        );
        const file = asset
          ? path.join(root, "v1/assets", asset.sha256 + ".png")
          : path.resolve(
              root,
              "../../../../tmp/practice-text-review/layout-originals",
              createHash("sha256")
                .update(q.key + ":" + f.field)
                .digest("hex") + ".png",
            );
        cards.push({
          label: f.label,
          layout: f.layout,
          original:
            "data:image/png;base64," + fs.readFileSync(file).toString("base64"),
        });
      }
    }
  }
  expect(cards).toHaveLength(139);
  for (let i = 0; i < cards.length; i += 20) {
    await page.route("**/native-preview-data.json", (r) =>
      r.fulfill({ json: cards.slice(i, i + 20) }),
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/dev/nafs/native-preview.html");
    await expect(page.locator("article")).toHaveCount(
      Math.min(20, cards.length - i),
    );
    await page.screenshot({
      path: info.outputPath(`source-equations-${i}.png`),
      fullPage: true,
    });
    await page.unroute("**/native-preview-data.json");
  }
});
