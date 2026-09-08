import { useEffect, useState } from 'react';
import { ChevronRight, RotateCcw, X } from 'lucide-react';

export type ReadingVocabularyCard = {
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string;
};

interface ReadingVocabularyFlashcardModalProps {
  card: ReadingVocabularyCard | null;
  onClose: () => void;
}

/**
 * An optional vocabulary aid for Reading Mode. This intentionally has no
 * submit/progress callbacks: opening or flipping a card never changes the
 * learner's activity completion.
 */
export default function ReadingVocabularyFlashcardModal({
  card,
  onClose,
}: ReadingVocabularyFlashcardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [card?.word]);

  useEffect(() => {
    if (!card) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, onClose]);

  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 font-['Outfit',sans-serif]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-vocabulary-card-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="w-full max-w-[620px] rounded-[22px] bg-white p-5 shadow-[0px_20px_50px_rgba(15,23,42,0.28)] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5C9DFF]">Vocabulary support</p>
            <h2 id="reading-vocabulary-card-title" className="mt-1 text-[19px] font-bold text-[#0F1450]">Flashcard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] text-[#475569] transition-colors hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-[#2563EB]/30"
            aria-label="Close vocabulary flashcard"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="[perspective:1200px]">
          <button
            type="button"
            onClick={() => setIsFlipped((wasFlipped) => !wasFlipped)}
            aria-pressed={isFlipped}
            aria-label={isFlipped ? 'Show the word side of this flashcard' : 'Reveal this flashcard'}
            className="group block w-full rounded-[18px] text-left outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/30"
          >
            <div className={`relative h-[260px] w-full transition-transform duration-500 [transform-style:preserve-3d] sm:h-[280px] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              <div className="absolute inset-0 flex [backface-visibility:hidden] flex-col items-center justify-center rounded-[18px] bg-gradient-to-br from-[#4F8DFB] to-[#2563EB] p-7 text-center shadow-[0px_8px_24px_rgba(37,99,235,0.22)] sm:p-9">
                <h3 className="max-w-[500px] text-[28px] font-extrabold leading-snug tracking-[-0.35px] text-white sm:text-[34px]">
                  {card.word}
                </h3>
                <p className="mt-2 text-[15px] font-semibold italic text-white/85">{card.partOfSpeech}</p>
                <span className="mt-6 flex items-center gap-1.5 text-[13px] font-semibold text-white/85 transition-transform group-hover:translate-y-0.5">
                  Tap to reveal <ChevronRight className="h-4 w-4" />
                </span>
              </div>

              <div className="absolute inset-0 flex [backface-visibility:hidden] [transform:rotateY(180deg)] flex-col items-center justify-center rounded-[18px] border border-[#99F6E4] bg-[#F0FDFA] p-6 text-center shadow-[0px_8px_24px_rgba(13,148,136,0.15)] sm:p-8">
                <p className="max-w-[500px] text-[16px] font-bold leading-relaxed text-[#115E59]">{card.definition}</p>
                <p className="mt-4 max-w-[500px] rounded-[10px] border border-[#99F6E4] bg-white/80 px-4 py-2 text-[13px] font-semibold leading-relaxed text-[#0F766E]">
                  Example: {card.example.replace(/^Ex:\s*/i, '')}
                </p>
                <span className="mt-5 flex items-center gap-1.5 text-[13px] font-semibold text-[#0F766E]">
                  <RotateCcw className="h-3.5 w-3.5" /> Tap to flip back
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
