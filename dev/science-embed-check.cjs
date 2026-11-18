const fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript"),
  assert = require("node:assert/strict");
const moduleValue = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("src/components/science/scienceEmbed.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  { exports: moduleValue.exports, module: moduleValue, URL },
);
const resolve = moduleValue.exports.scienceEmbedUrl;
let count = 0;
for (const folder of ["motion-unit2-v2", "forces-unit3-v1"]) {
  const content = JSON.parse(
    fs.readFileSync(
      `../step-backend/content/science-spark/${folder}/external.json`,
      "utf8",
    ),
  );
  for (const activity of content.activities)
    for (const target of activity.targets ?? [activity]) {
      const url = resolve(activity.provider, target.url);
      assert(
        url.startsWith(
          activity.provider === "kahoot"
            ? "https://embed.kahoot.it/"
            : "https://phet.colorado.edu/sims/",
        ),
      );
      count++;
    }
}
assert.equal(count, 11);
for (const url of [
  "javascript:alert(1)",
  "https://phet.colorado.edu.evil.test/sims/html/friction/latest/friction_en.html",
  "https://phet.colorado.edu/sims/html/friction/latest/friction_en.html?redirect=evil",
  "https://evil.test",
  "https://phet.colorado.edu/en/simulations/friction#other",
  "https://user@phet.colorado.edu/en/simulations/friction",
])
  assert.throws(() => resolve("phet", url));
for (const url of [
  "https://create.kahoot.it/details/title/04b958f5-d8c5-434a-a705-23ef341263c0?redirect=evil",
  "https://create.kahoot.it/auth/login",
  "http://create.kahoot.it/details/id",
  "https://evil.test/details/title/04b958f5-d8c5-434a-a705-23ef341263c0",
])
  assert.throws(() => resolve("kahoot", url));
console.log(
  "Science embed URLs: all 11 supplied targets and unsafe URL rejection passed.",
);
