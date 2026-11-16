/** Backward-compatible v1 response tokens, shared by API validation and recovery.
 * Single choice stays a raw option id. Extended responses are canonical JSON.
 */
export type ResponseQuestion = {
  responseKind?: 'single_choice' | 'multi_choice' | 'written';
  options: Array<{ id: string }>;
};
export function selectedPracticeOptions(value: string | undefined): string[] {
  if (!value) return [];
  if (!value.startsWith('[')) return [value];
  try {
    const v: unknown = JSON.parse(value);
    return Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : [];
  } catch {
    return [];
  }
}
export function writtenPracticeText(value: string | undefined): string {
  try {
    const v = JSON.parse(value ?? '') as { text?: unknown };
    return v && typeof v.text === 'string' ? v.text : '';
  } catch {
    return '';
  }
}
export function practiceMultiToken(ids: string[]): string {
  return JSON.stringify([...new Set(ids)].sort());
}
export function validPracticeResponse(
  q: ResponseQuestion,
  value: string,
): boolean {
  if (typeof value !== 'string') return false;
  if (q.responseKind === 'written') {
    const text = writtenPracticeText(value);
    return text.length <= 4000 && JSON.stringify({ text }) === value;
  }
  if (q.responseKind === 'multi_choice') {
    const ids = selectedPracticeOptions(value);
    return (
      ids.length <= q.options.length &&
      practiceMultiToken(ids) === value &&
      ids.every((id) => q.options.some((o) => o.id === id))
    );
  }
  return q.options.some((o) => o.id === value);
}
export function hasPracticeResponse(
  q: ResponseQuestion,
  value: string | undefined,
): boolean {
  if (!value || !validPracticeResponse(q, value)) return false;
  if (q.responseKind === 'written')
    return Boolean(writtenPracticeText(value).trim());
  return (
    q.responseKind !== 'multi_choice' ||
    selectedPracticeOptions(value).length > 0
  );
}
