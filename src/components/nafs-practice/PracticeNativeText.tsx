import type { PracticeTextLayout } from "@/types/nafs-practice.contract";

/** Selectable text and CSS rules, preserving fractions, powers and radicals.
 * Ordinary questions still use NafsText and wrap naturally. No HTML injection,
 * image, SVG, canvas or PDF viewer is used for mathematical text.
 */
export function PracticeNativeText({ layout }: { layout: PracticeTextLayout }) {
  return (
    <span
      className="inline-block max-w-full align-middle overflow-x-auto overflow-y-hidden py-1"
      tabIndex={0}
      aria-label="Mathematical text"
    >
      <span
        className="relative inline-block align-middle text-base font-normal"
        style={{
          width: `${layout.width}em`,
          height: `${layout.height + 0.2}em`,
        }}
      >
        {layout.glyphs.map((glyph, index) => (
          <span
            key={index}
            style={{
              position: "absolute",
              left: `${glyph.x}em`,
              top: `${glyph.y}em`,
              width: `${glyph.width}em`,
              height: `${glyph.size}em`,
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontFamily: glyph.serif
                  ? '"Times New Roman", serif'
                  : "Arial, sans-serif",
                fontSize: `${glyph.size}em`,
                lineHeight: 1,
                fontWeight: glyph.bold ? 700 : 400,
                fontStyle: glyph.italic ? "italic" : "normal",
                whiteSpace: "pre",
              }}
            >
              {glyph.text}
            </span>
          </span>
        ))}
        {layout.rules.map((rule, index) => (
          <span
            key={`rule-${index}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${rule.x}em`,
              top: `${rule.y}em`,
              width: `${rule.length}em`,
              borderTop: "1px solid currentColor",
              transform: `rotate(${rule.angle}deg)`,
              transformOrigin: "0 0",
              pointerEvents: "none",
            }}
          />
        ))}
      </span>
    </span>
  );
}
