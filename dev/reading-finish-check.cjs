// Exercise the actual Reading Finish handler and route helpers without network access.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const navigation = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/utils/learning-navigation.ts'), 'utf8')), {
  module: navigation, exports: navigation.exports,
});
const source = ts.createSourceFile('ReadingModeTopics.tsx', fs.readFileSync(path.join(root, 'src/pages/student/topics/ReadingModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'finishMode') handler = node.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(handler, 'Reading must expose its Finish handler');
const mode = (id, modeSource = 'components', extra = {}) => ({ id, modeKey: 'skill-mode', modeSource, status: 'available', isLocked: false, ...extra });
const current = mode('reading', 'legacy_ai', { status: 'completed', modeKey: 'reading-mode' });
async function finish(modes, lessons = [], extra = {}) {
  const paths = [], requests = [];
  const dependencies = {
    ...navigation.exports,
    courseId: 'course', unitId: 'unit', lessonId: 'lesson', lessonModeId: 'reading',
    allLessonsPath: '/student/courses/course/units/unit',
    setShowCompletionModal: () => {}, navigate: value => paths.push(value),
    fetchLessonModes: async id => { requests.push(['modes', id]); return modes; },
    fetchUnitLessons: async id => { requests.push(['lessons', id]); return lessons; },
    ...extra,
  };
  await new Function(...Object.keys(dependencies), compile('const ' + handler + ';') + '; return finishMode;')(...Object.values(dependencies))();
  assert.equal(paths.length, 1);
  return { path: paths[0], requests };
}
(async () => {
  for (const next of [mode('skill'), mode('speaking', 'legacy_ai', { modeKey: 'speaking-mode' }), mode('quiz', 'quiz')]) {
    const result = await finish([mode('previous'), current, next]);
    assert.equal(result.path, navigation.exports.getLearningModePath({ courseId: 'course', unitId: 'unit', lessonId: 'lesson' }, next));
    assert.deepEqual(result.requests, [['modes', 'lesson']]);
  }
  const next = mode('next');
  assert.equal((await finish([current, mode('done', 'components', { status: 'completed' }), mode('locked', 'components', { status: 'locked' }), next])).path, '/student/courses/course/units/unit/lessons/lesson/modes/next');
  const lessons = [{ id: 'lesson', status: 'completed', isLocked: false }, { id: 'next-lesson', status: 'available', isLocked: false }];
  assert.equal((await finish([current], lessons)).path, '/student/courses/course/units/unit/lessons/next-lesson');
  assert.equal((await finish([current])).path, '/student/courses/course/units/unit');
  assert.equal((await finish([current], [], { fetchLessonModes: async () => { throw new Error('Unavailable'); } })).path, '/student/courses/course/units/unit');
  assert.equal((await finish([current], [], { courseId: undefined, allLessonsPath: '/student/courses' })).path, '/student/courses');
  console.log('Reading Finish checks passed: component, legacy and direct activity routes; completed/locked filtering; final activity; failures and missing context.');
})().catch(error => { console.error(error); process.exitCode = 1; });
