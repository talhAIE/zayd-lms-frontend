import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { LearningComponent } from '@/services/learningService';

interface FlashcardsComponentProps {
  component: LearningComponent;
  onSubmit?: (response: { viewedCardIds: string[] }) => Promise<unknown> | void;
  isSubmitted?: boolean;
}

export default function FlashcardsComponent({ component, onSubmit, isSubmitted = false }: FlashcardsComponentProps) {
  const rawCards = Array.isArray(component.content?.cards) ? component.content.cards : [];
  const cards = rawCards.map((card: any, index: number) => ({
    id: card.id || `card-${index}`,
    front: card.front || card.term || card.question || '',
    back: card.back || card.definition || card.answer || '',
    example: card.example,
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  // Preserve a previously submitted review set. This lets a learner continue
  // correctly when older content is repaired server-side, instead of forcing
  // them to flip every card again just to re-submit the same review.
  const [viewedCards, setViewedCards] = useState<Set<string>>(() => {
    const previouslyViewed = component.attempt?.response?.viewedCardIds;
    if (!Array.isArray(previouslyViewed)) return new Set();

    const validCardIds = new Set(cards.map((card) => card.id));
    return new Set(
      previouslyViewed.filter(
        (cardId): cardId is string =>
          typeof cardId === 'string' && validCardIds.has(cardId),
      ),
    );
  });
  const hasSubmittedCompletionRef = useRef(false);
  const currentCard = cards[currentIndex] || cards[0];

  useEffect(() => {
    if (
      !onSubmit ||
      isSubmitted ||
      viewedCards.size !== cards.length ||
      hasSubmittedCompletionRef.current
    ) {
      return;
    }

    hasSubmittedCompletionRef.current = true;
    void Promise.resolve(onSubmit({ viewedCardIds: [...viewedCards] })).catch(
      () => {
        hasSubmittedCompletionRef.current = false;
      },
    );
  }, [cards.length, isSubmitted, onSubmit, viewedCards]);

  const flipCard = () => {
    if (!currentCard) return;

    setIsFlipped((wasFlipped) => {
      const willShowAnswer = !wasFlipped;
      if (willShowAnswer) {
        setViewedCards((previous) => new Set([...previous, currentCard.id]));
      }
      return willShowAnswer;
    });
  };

  const changeCard = (nextIndex: number) => {
    setCurrentIndex(nextIndex);
    setIsFlipped(false);
  };

  if (!cards.length) {
    return <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This flashcard activity has no valid learner cards.</div>;
  }

  return (
    <div className="flex w-full flex-col gap-4 font-['Outfit',sans-serif]">
      <div className="flex items-center justify-between px-1 text-[12px] font-semibold text-[#64748B]">
        <span>{isFlipped ? 'Card revealed' : 'Tap the card to reveal'}</span>
        <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 font-bold text-[#2563EB]">{viewedCards.size} of {cards.length}</span>
      </div>

      <div className="mx-auto w-full max-w-[760px] [perspective:1200px]">
        <button
          type="button"
          onClick={flipCard}
          aria-pressed={isFlipped}
          aria-label={isFlipped ? 'Show the other side of this flashcard' : 'Reveal this flashcard'}
          className="group block w-full rounded-[18px] text-left outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/30"
        >
          <div className={`relative h-[230px] w-full transition-transform duration-500 [transform-style:preserve-3d] sm:h-[250px] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            <div className="absolute inset-0 flex [backface-visibility:hidden] flex-col items-center justify-center rounded-[18px] bg-gradient-to-br from-[#4F8DFB] to-[#2563EB] p-7 text-center shadow-[0px_8px_24px_rgba(37,99,235,0.22)] sm:p-9">
              <h2 className="max-w-[650px] text-[21px] font-extrabold leading-snug tracking-[-0.35px] text-white sm:text-[27px]">
                {currentCard?.front}
              </h2>
              <span className="mt-5 flex items-center gap-1.5 text-[13px] font-semibold text-white/85 transition-transform group-hover:translate-y-0.5">
                Tap to reveal <ChevronRight className="h-4 w-4" />
              </span>
            </div>

            <div className="absolute inset-0 flex [backface-visibility:hidden] [transform:rotateY(180deg)] flex-col items-center justify-center rounded-[18px] border border-[#99F6E4] bg-[#F0FDFA] p-7 text-center shadow-[0px_8px_24px_rgba(13,148,136,0.15)] sm:p-9">
              <p className="max-w-[650px] text-[16px] font-bold leading-relaxed text-[#115E59] sm:text-[18px]">
                {currentCard?.back}
              </p>
              {currentCard?.example && (
                <p className="mt-4 max-w-[620px] rounded-[10px] border border-[#99F6E4] bg-white/80 px-4 py-2 text-[13px] font-semibold text-[#0F766E]">
                  Example: {currentCard.example.replace(/^Ex:\s*/i, '')}
                </p>
              )}
              <span className="mt-5 flex items-center gap-1.5 text-[13px] font-semibold text-[#0F766E]">
                <RotateCcw className="h-3.5 w-3.5" /> Tap to flip back
              </span>
            </div>
          </div>
        </button>
      </div>

      {cards.length > 1 && (
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => changeCard(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex cursor-pointer items-center gap-1 rounded-[10px] border border-[#E2E8F0] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#475569] shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <button
            type="button"
            onClick={() => changeCard(currentIndex + 1)}
            disabled={currentIndex === cards.length - 1}
            className="flex cursor-pointer items-center gap-1 rounded-[10px] bg-[#4F8DFB] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
