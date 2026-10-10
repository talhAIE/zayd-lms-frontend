type ReadingAudioMessage = { content: string; audioUrl?: string | null; readingSpeechText?: string | null };

export function readingPracticeSpeechText(message: ReadingAudioMessage): string | null {
  if (message.readingSpeechText !== undefined) return message.readingSpeechText;
  // Compatibility for history from before sentence-only audio was introduced.
  // Greedy outer quotes preserve dialogue quotes and line breaks in the target.
  return message.content.match(/^(?:Please read the following sentence aloud|Please try reading this sentence again|Good job! Now read the next sentence|You have completed three attempts on this sentence\. Now read the next sentence|We could not verify that reading after three attempts\. Let's continue with the next sentence):\s*"([\s\S]+)"\s*$/)?.[1] ?? null;
}

export function readingPracticeAudioUrl(message: ReadingAudioMessage): string | null {
  // Older URLs narrate the instruction. Use target-only browser speech instead.
  return message.readingSpeechText ? message.audioUrl ?? null : null;
}
