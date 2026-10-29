import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { LearningComponent } from '@/services/learningService';
import { GradedAnswerButton, gradedAttemptKey } from '../AnswerFeedback';

interface DropdownComponentProps {
  component: LearningComponent;
  onAnswerChange?: (answers: Record<string, string>) => void;
  onSubmit?: (answers: Record<string, string>) => void;
  isSubmitted?: boolean;
  disabled?: boolean;
}

export default function DropdownComponent({
  component,
  onAnswerChange,
  onSubmit,
  isSubmitted = false,
  disabled = false,
}: DropdownComponentProps) {
  // Extract items from content or options
  const rawFields = component.content?.fields || component.content?.items || [];
  const rawOptions = component.options || component.content?.options || [];
  const matchingLeftItems = component.matchingLeftItems || [];
  const matchingRightItems = component.matchingRightItems || [];
  
  const items: Array<{ id: string; label: string; defaultAnswer?: string }> =
    rawFields.length > 0
      ? rawFields.map((f: any, idx: number) => ({
          id: f.id || `item-${idx}`,
          label: f.sentence || f.label || f.prompt || `Item ${idx + 1}`,
          defaultAnswer: f.defaultAnswer,
        }))
      : matchingLeftItems.length > 0
      ? matchingLeftItems.map((p, idx) => ({
          id: `pair-${idx}`,
          label: p.value,
          defaultAnswer: matchingRightItems[idx]?.value,
        }))
      : component.content?.prompt
      ? [{ id: 'answer', label: String(component.content.prompt) }]
      : [];

  const options: Array<{ label: string; value: string }> =
    rawOptions.length > 0
      ? rawOptions.map((o: any) => ({
          label: o.label || o.value,
          // The learner API grades objective answers by option id. Labels may
          // change between content versions, but option ids remain stable.
          value: o.id || o.value || o.label,
        }))
      : matchingRightItems.length > 0
      ? matchingRightItems.map((item) => ({
          label: item.value,
          value: item.value,
        }))
      : [];

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    if (component.attempt?.response) {
      const response = component.attempt.response;
      return response.answers ?? (response.optionId && items.length === 1 ? { [items[0].id]: response.optionId } : response);
    }
    return {};
  });

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (itemId: string, value: string) => {
    if (disabled || isSubmitted) return;
    const newAnswers = { ...selectedAnswers, [itemId]: value };
    setSelectedAnswers(newAnswers);
    setOpenDropdownId(null);
    onAnswerChange?.(newAnswers);
  };

  // Set of already selected values across other items (Options Exhaustion)
  const usedValues = Object.entries(selectedAnswers).reduce((acc, [key, val]) => {
    if (val && key) acc.add(val);
    return acc;
  }, new Set<string>());

  const title = component.title || component.content?.prompt || 'Dropdown Elimination';
  const tag = component.content?.tag || 'OPTIONS EXHAUST';
  const badge = component.content?.badge || 'MATCHING EXERCISE';

  if (!items.length || !options.length) {
    return <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This dropdown activity has no valid learner content.</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="w-full bg-white rounded-[20px] border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(15,23,42,0.04)] p-6 md:p-8 flex flex-col gap-6 font-['Outfit',sans-serif] transition-all"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0D9488]">
            {badge}
          </span>
          <h2 className="text-[20px] md:text-[22px] font-bold text-[#0F172A] tracking-[-0.3px]">
            {title}
          </h2>
        </div>

        {tag && (
          <div className="self-start sm:self-auto px-3.5 py-1 rounded-full border border-[#5EEAD4] bg-[#F0FDFA] text-[#0D9488] text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
            {tag}
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3.5">
        {items.map((item) => {
          const selectedValue = selectedAnswers[item.id] || '';
          const isOpen = openDropdownId === item.id;
          const response = component.attempt?.response;
          const submittedValue = response?.answers?.[item.id] ?? response?.[item.id] ?? (items.length === 1 ? response?.optionId : undefined);
          const fieldResult = component.attempt?.feedback?.fieldResults?.find((field: { id: string }) => field.id === item.id);
          const result = selectedValue && selectedValue === submittedValue && component.attempt?.submittedAt
            ? fieldResult?.isCorrect ?? (items.length === 1 ? component.attempt.isCorrect : null)
            : null;

          return (
            <div
              key={item.id}
              className="w-full rounded-[14px] border border-[#EEF2F6] bg-[#F8FAFC]/70 hover:bg-white hover:border-[#CBD5E1] p-4 md:px-6 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all relative"
            >
              {/* Left Item Label */}
              <span className="font-bold text-[15px] md:text-[16px] text-[#0F172A]">
                {item.label}
              </span>

              {/* Right Custom Dropdown Trigger */}
              <div className="relative w-full sm:w-auto min-w-[220px]">
                <GradedAnswerButton
                  feedbackKey={gradedAttemptKey(component)}
                  result={result}
                  type="button"
                  onClick={() => !disabled && !isSubmitted && setOpenDropdownId(isOpen ? null : item.id)}
                  disabled={disabled || isSubmitted}
                  className={`w-full bg-white border ${
                    isOpen ? 'border-[#0D9488] ring-2 ring-[#0D9488]/15' : 'border-[#E2E8F0]'
                  } rounded-[10px] px-4 py-2.5 flex items-center justify-between gap-3 text-[14px] font-semibold text-[#0D9488] shadow-sm hover:border-[#CBD5E1] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span className={selectedValue ? 'text-[#0D9488] font-bold' : 'text-[#94A3B8] font-normal'}>
                    {options.find((option) => option.value === selectedValue)?.label || selectedValue || 'Select an option...'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#0D9488] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </GradedAnswerButton>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-full sm:w-[260px] bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0px_10px_25px_rgba(15,23,42,0.12)] py-1.5 z-30 max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    {options.map((opt) => {
                      const isUsedElsewhere = usedValues.has(opt.value) && selectedValue !== opt.value;
                      const isSelected = selectedValue === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isUsedElsewhere}
                          onClick={() => handleSelectOption(item.id, opt.value)}
                          className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#F0FDFA] text-[#0D9488] font-bold'
                              : isUsedElsewhere
                              ? 'text-[#CBD5E1] line-through bg-gray-50/50 cursor-not-allowed'
                              : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0D9488] font-medium cursor-pointer'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#0D9488]" />}
                          {isUsedElsewhere && (
                            <span className="text-[10px] text-gray-400 no-underline font-normal">Used</span>
                          )}
                        </button>
                      );
                    })}

                    {selectedValue && (
                      <button
                        type="button"
                        onClick={() => handleSelectOption(item.id, '')}
                        className="w-full text-left px-4 py-2 text-[12px] text-rose-500 hover:bg-rose-50 border-t border-gray-100 font-medium transition-colors cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Submit Action if passed */}
      {onSubmit && !isSubmitted && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onSubmit(selectedAnswers)}
            disabled={disabled || Object.keys(selectedAnswers).length === 0}
            className="bg-[#0D9488] hover:bg-[#0F766E] active:scale-[0.98] text-white px-6 py-2.5 rounded-[10px] font-bold text-[14px] transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answers
          </button>
        </div>
      )}
    </div>
  );
}
