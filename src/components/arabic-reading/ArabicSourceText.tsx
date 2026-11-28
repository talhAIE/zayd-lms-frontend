/** Isolate numeric runs for RTL rendering without normalizing/reordering source characters. */
export function ArabicSourceText({text}: {text:string}) {
  return <>{text.split(/([+-]?[0-9٠-٩۰-۹]+(?:[.,٫٬:/-][0-9٠-٩۰-۹]+)*(?:\s*[٪%])?)/gu)
    .map((part,index)=>/^[+-]?[0-9٠-٩۰-۹]/u.test(part) ? <bdi dir="ltr" key={index}>{part}</bdi> : part)}</>;
}
