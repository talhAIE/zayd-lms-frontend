import { Fragment } from 'react';

// Render authored text directly. Numeric fractions remain selectable text,
// with stacked numerator/denominator instead of an image of the expression.
export function NafsText({ text }: { text: string }) {
  const pieces = text.split(/(-?\d+\/\d+)/g);
  return (
    <>
      {pieces.map((piece, index) => {
        const fraction = /^(-?\d+)\/(\d+)$/.exec(piece);
        if (!fraction) return <Fragment key={index}>{piece}</Fragment>;
        return (
          <span
            key={index}
            className="inline-block align-middle mx-0.5 text-center leading-tight"
            role="math"
            aria-label={`${fraction[1]} over ${fraction[2]}`}
          >
            <span
              aria-hidden="true"
              className="block border-b border-current px-1 text-[0.85em]"
            >
              {fraction[1]}
            </span>
            <span aria-hidden="true" className="block px-1 text-[0.85em]">
              {fraction[2]}
            </span>
          </span>
        );
      })}
    </>
  );
}
