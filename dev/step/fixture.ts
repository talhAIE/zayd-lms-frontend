// Synthetic learner-only data. No source questions, keys or grading logic.
import type {
  StepInProgressAttempt,
  StepSectionKind,
} from "../../src/types/step.contract";
export const user = {
  id: "step-qa",
  username: "step.synthetic",
  role: "student",
  region: "ROW",
  firstName: "Layout",
  lastName: "Student",
};
export const owner = {
  id: user.id,
  username: user.username,
  region: user.region,
};
export function attempt(kind: StepSectionKind): StepInProgressAttempt {
  return {
    id: kind,
    topicId: kind,
    sectionId: kind,
    courseId: "step",
    kind,
    title: `Synthetic ${kind} activity`,
    contentVersion: 1,
    state: "in_progress",
    revision: 0,
    startedAt: "2026-11-10T00:00:00Z",
    lastSavedAt: null,
    selections: [],
    questions: Array.from({ length: kind === "grammar" ? 60 : 4 }, (_, i) => ({
      id: `q${i}`,
      displayOrder: i + 1,
      instruction: "Choose one option to complete the sentence.",
      stem: `Example ${i + 1}: The children ____ in the park.`,
      grouping:
        kind === "grammar"
          ? { id: "group", title: "Example nouns", level: "A1" }
          : null,
      options: ["A", "B", "C", "D"].map((label, j) => ({
        id: `q${i}o${j}`,
        label: label as "A" | "B" | "C" | "D",
        text:
          j === 1
            ? "A long choice with a blank ____ and punctuation. ".repeat(5)
            : j === 2
              ? "مثال نص عربي للتأكد من عرض النص بشكل صحيح"
              : j === 3
                ? "LongUnbrokenChoice".repeat(12)
                : "Example answer",
      })),
    })),
    passage:
      kind === "reading"
        ? {
            id: "passage",
            title: "A synthetic garden",
            paragraphs: [
              "The children visit a garden. They see trees and flowers.",
              "They read a story together. ".repeat(25),
            ],
          }
        : null,
    audio:
      kind === "listening"
        ? {
            id: "audio",
            title: "Synthetic tone",
            contentType: "audio/mpeg",
            durationMs: 10000,
          }
        : null,
  };
}
