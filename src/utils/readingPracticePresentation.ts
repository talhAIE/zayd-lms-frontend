/** Recover the displayed target independently of legacy audio metadata/quote style. */
export function readingPracticePresentation(content: string, speechText: string | null) {
  const quoted = content.trim().match(/^([\s\S]*?):\s*["“]([\s\S]+)["”]\s*$/);
  if (quoted && (speechText || /read[\s\S]*sentence|sentence[\s\S]*read/i.test(quoted[1]))) {
    return { instruction: `${quoted[1].trim()}:`, sentence: (speechText || quoted[2]).replace(/\*\*([\s\S]*?)\*\*/g, '$1').trim() };
  }
  if (!speechText?.trim()) return null;
  const at = content.indexOf(speechText);
  return {
    instruction: at >= 0 ? content.slice(0, at).trim().replace(/["“]$/, '').trim() : 'Read the following sentence aloud:',
    sentence: speechText.replace(/\*\*([\s\S]*?)\*\*/g, '$1').trim(),
  };
}
