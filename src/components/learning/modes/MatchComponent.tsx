import { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { LearningComponent } from '@/services/learningService';
import { GradedAnswerSurface, gradedAttemptKey } from '../AnswerFeedback';

interface MatchComponentProps {
  component: LearningComponent;
  onAnswerChange?: (pairs: Record<string, string>) => void;
  onSubmit?: (pairs: Record<string, string>) => void;
  isSubmitted?: boolean;
  disabled?: boolean;
}

interface MatchItem {
  id: string;
  text: string;
}

type Connections = Record<string, string>;

function restoreConnections(response: unknown, leftItems: MatchItem[], rightItems: MatchItem[]): Connections {
  if (!response || typeof response !== 'object') return {};

  const leftByText = new Map(leftItems.map((item) => [item.text, item.id]));
  const rightIdsByText = rightItems.reduce<Map<string, string[]>>((result, item) => {
    result.set(item.text, [...(result.get(item.text) ?? []), item.id]);
    return result;
  }, new Map());
  const responseRecord = response as Record<string, unknown>;
  const storedPairs = Array.isArray(responseRecord.matches)
    ? responseRecord.matches
    : Object.entries(responseRecord).map(([leftValue, rightValue]) => ({ leftValue, rightValue }));

  const restored: Connections = {};
  const assignedRights = new Set<string>();

  storedPairs.forEach((pair) => {
    if (!pair || typeof pair !== 'object') return;

    const { leftValue, rightValue } = pair as { leftValue?: unknown; rightValue?: unknown };
    if (typeof leftValue !== 'string' || typeof rightValue !== 'string') return;

    const leftId = leftByText.get(leftValue);
    const rightId = rightIdsByText.get(rightValue)?.find((id) => !assignedRights.has(id));

    if (leftId && rightId && !restored[leftId] && !assignedRights.has(rightId)) {
      restored[leftId] = rightId;
      assignedRights.add(rightId);
    }
  });

  return restored;
}

export default function MatchComponent({
  component,
  onAnswerChange,
  onSubmit,
  isSubmitted = false,
  disabled = false,
}: MatchComponentProps) {
  const contentPairs = useMemo(
    () => Array.isArray(component.content?.matchingPairs) ? component.content.matchingPairs : [],
    [component.content?.matchingPairs]
  );

  const leftItems = useMemo<MatchItem[]>(
    () => (contentPairs.length
      ? contentPairs.map((pair: any, index: number) => ({ id: `left-${index}`, text: String(pair.leftValue ?? '') }))
      : component.matchingLeftItems.map((item, index) => ({ id: `left-${index}`, text: item.value }))),
    [component.matchingLeftItems, contentPairs]
  );

  const rightItems = useMemo<MatchItem[]>(() => {
    const authorOrderedItems = component.content?.rightItems;
    const rightTexts = authorOrderedItems?.length
      ? authorOrderedItems
      : contentPairs.length
        ? contentPairs.map((pair: any) => String(pair.rightValue ?? ''))
        : component.matchingRightItems.map((item) => item.value);

    return rightTexts.map((text: string, index: number) => ({ id: `right-${index}`, text }));
  }, [component.content?.rightItems, component.matchingRightItems, contentPairs]);

  const leftById = useMemo(() => new Map(leftItems.map((item) => [item.id, item])), [leftItems]);
  const rightById = useMemo(() => new Map(rightItems.map((item) => [item.id, item])), [rightItems]);

  const submittedConnections = useMemo(
    () => restoreConnections(component.attempt?.response, leftItems, rightItems),
    [component.attempt?.response, leftItems, rightItems]
  );

  // An activity must always begin empty. The learner builds every connection in
  // the browser, then submits the completed set as one deliberate response.
  // Submitted activities may show their final connections in the read-only view.
  const [connections, setConnections] = useState<Connections>(() => isSubmitted ? submittedConnections : {});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [editedSinceGrade, setEditedSinceGrade] = useState(false);
  const submissionKey = gradedAttemptKey(component);
  useEffect(() => setEditedSinceGrade(false), [submissionKey]);

  useEffect(() => {
    setConnections(isSubmitted ? submittedConnections : {});
    setSelectedLeft(null);
  }, [component.id, component.attempt?.submittedAt, isSubmitted, submittedConnections]);

  const serialiseConnections = useCallback(
    (nextConnections: Connections) =>
      Object.entries(nextConnections).reduce<Connections>((result, [leftId, rightId]) => {
        const leftItem = leftById.get(leftId);
        const rightItem = rightById.get(rightId);

        if (leftItem && rightItem) result[leftItem.text] = rightItem.text;
        return result;
      }, {}),
    [leftById, rightById]
  );

  const commitConnections = useCallback(
    (nextConnections: Connections) => {
      setEditedSinceGrade(true);
      setConnections(nextConnections);
      onAnswerChange?.(serialiseConnections(nextConnections));
    },
    [onAnswerChange, serialiseConnections]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const leftItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [svgLines, setSvgLines] = useState<Array<{ id: string; path: string }>>([]);
  const markerId = useId().replace(/:/g, '');

  const updateSvgLines = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: Array<{ id: string; path: string }> = [];

    Object.entries(connections).forEach(([leftId, rightId]) => {
      const leftEl = leftItemRefs.current[leftId];
      const rightEl = rightItemRefs.current[rightId];

      if (!leftEl || !rightEl) return;

      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();
      const x1 = leftRect.right - containerRect.left;
      const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
      const x2 = rightRect.left - containerRect.left;
      const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;
      const curveOffset = Math.max(28, (x2 - x1) * 0.42);

      newLines.push({
        id: `${leftId}-${rightId}`,
        path: `M ${x1} ${y1} C ${x1 + curveOffset} ${y1}, ${x2 - curveOffset} ${y2}, ${x2} ${y2}`,
      });
    });

    setSvgLines(newLines);
  }, [connections]);

  useEffect(() => {
    const frame = requestAnimationFrame(updateSvgLines);
    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(updateSvgLines));

    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', updateSvgLines);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSvgLines);
    };
  }, [updateSvgLines]);

  const handleLeftClick = (leftId: string) => {
    if (disabled || isSubmitted) return;
    setSelectedLeft((currentSelection) => (currentSelection === leftId ? null : leftId));
  };

  const handleRightClick = (rightId: string) => {
    if (disabled || isSubmitted || !selectedLeft) return;

    const nextConnections = { ...connections };
    const previousLeftForRight = Object.keys(nextConnections).find((leftId) => nextConnections[leftId] === rightId);

    // A right-hand answer always belongs to at most one prompt. Selecting an occupied answer moves it cleanly.
    if (previousLeftForRight && previousLeftForRight !== selectedLeft) delete nextConnections[previousLeftForRight];

    if (nextConnections[selectedLeft] === rightId) {
      delete nextConnections[selectedLeft];
    } else {
      nextConnections[selectedLeft] = rightId;
    }

    commitConnections(nextConnections);
    setSelectedLeft(null);
  };

  const handleReset = () => {
    if (disabled || isSubmitted) return;
    commitConnections({});
    setSelectedLeft(null);
  };

  const title = component.title || 'Connect the Dots';
  const subtitle = component.content?.instruction || 'Select a term on the left, then select its matching description on the right.';
  const badge = component.content?.badge || 'MATCHING EXERCISE';
  const tag = component.content?.tag || 'INTERACTIVE';
  const matchedCount = Object.keys(connections).length;
  const selectionMessage = selectedLeft
    ? 'Now select its matching description on the right.'
    : 'Select a term, then select its match.';

  if (!leftItems.length || !rightItems.length) {
    return <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This matching activity has no valid learner content.</div>;
  }

  return (
    <GradedAnswerSurface feedbackKey={submissionKey} result={!editedSinceGrade && component.attempt?.submittedAt ? component.attempt.isCorrect : null} className="w-full rounded-[20px] border border-[#E2E8F0] bg-white p-6 font-['Outfit',sans-serif] shadow-[0px_4px_20px_rgba(15,23,42,0.04)] transition-all md:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">{badge}</span>
          <h2 className="text-[20px] font-bold tracking-[-0.3px] text-[#0F172A] md:text-[22px]">{title}</h2>
          <p className="text-[13px] text-[#64748B] md:text-[14px]">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {tag && (
            <div className="flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2563EB] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {tag}
            </div>
          )}
          {!isSubmitted && matchedCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Clear all matches"
              aria-label="Clear all matches"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2 text-[12px] font-medium text-[#475569]">
        <span className={selectedLeft ? 'text-[#1D4ED8]' : undefined}>{selectionMessage}</span>
        <span className="rounded-full bg-white px-2.5 py-1 font-bold text-[#0F766E] shadow-sm">{matchedCount} / {leftItems.length} matched</span>
      </div>

      <div ref={containerRef} className="relative mt-3 flex min-h-[220px] w-full items-center justify-between gap-8 py-4 md:gap-16">
        <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#14B8A6" />
            </marker>
          </defs>
          {svgLines.map((line) => (
            <path
              key={line.id}
              d={line.path}
              fill="none"
              stroke="#14B8A6"
              strokeWidth="2.5"
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
              className="drop-shadow-sm transition-all duration-300"
            />
          ))}
        </svg>

        <div className="z-20 flex w-[45%] flex-col gap-4 sm:w-[40%]">
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#475569]">Column A</span>
          {leftItems.map((item, index) => {
            const isSelected = selectedLeft === item.id;
            const isConnected = Boolean(connections[item.id]);

            return (
              <button
                key={item.id}
                ref={(element) => { leftItemRefs.current[item.id] = element; }}
                type="button"
                onClick={() => handleLeftClick(item.id)}
                disabled={disabled || isSubmitted}
                aria-pressed={isSelected}
                className={`flex items-center justify-center rounded-[14px] p-4 text-center text-[14px] font-bold transition-all md:px-6 md:py-4 md:text-[15px] ${
                  isSelected
                    ? 'scale-[1.02] border-2 border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] shadow-md ring-4 ring-[#2563EB]/15'
                    : isConnected
                      ? 'border-2 border-[#14B8A6] bg-[#F0FDFA] text-[#0F172A] shadow-sm'
                      : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                } disabled:cursor-default disabled:opacity-100`}
              >
                <span className="mr-2 text-[#64748B]">{index + 1}.</span>{item.text}
              </button>
            );
          })}
        </div>

        <div className="z-20 flex w-[45%] flex-col gap-4 sm:w-[40%]">
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#475569]">Column B</span>
          {rightItems.map((item, index) => {
            const connectedLeftId = Object.keys(connections).find((leftId) => connections[leftId] === item.id);
            const isConnected = Boolean(connectedLeftId);
            const belongsToSelectedLeft = connectedLeftId === selectedLeft;

            return (
              <button
                key={item.id}
                ref={(element) => { rightItemRefs.current[item.id] = element; }}
                type="button"
                onClick={() => handleRightClick(item.id)}
                disabled={disabled || isSubmitted}
                className={`flex items-center justify-center rounded-[14px] p-4 text-center text-[14px] font-bold transition-all md:px-6 md:py-4 md:text-[15px] ${
                  selectedLeft
                    ? belongsToSelectedLeft
                      ? 'border-2 border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] shadow-sm'
                      : isConnected
                        ? 'border-2 border-dashed border-[#94A3B8] bg-[#F8FAFC] text-[#475569] hover:border-[#2563EB] hover:bg-[#EFF6FF]'
                        : 'border-2 border-dashed border-[#2563EB] bg-[#EFF6FF]/60 text-[#1D4ED8] hover:scale-[1.02] hover:border-solid hover:bg-[#EFF6FF]'
                    : isConnected
                      ? 'border-2 border-[#14B8A6] bg-[#F0FDFA] text-[#0F172A] shadow-sm'
                      : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                } disabled:cursor-default disabled:opacity-100`}
              >
                <span className="mr-2 text-[#64748B]">{String.fromCharCode(65 + index)}.</span>{item.text}
              </button>
            );
          })}
        </div>
      </div>

      {onSubmit && !isSubmitted && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onSubmit(serialiseConnections(connections))}
            disabled={disabled || matchedCount === 0}
            className="cursor-pointer rounded-[10px] bg-[#2563EB] px-6 py-2.5 text-[14px] font-bold text-white shadow-sm transition-all hover:bg-[#1D4ED8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Connections
          </button>
        </div>
      )}
    </GradedAnswerSurface>
  );
}
