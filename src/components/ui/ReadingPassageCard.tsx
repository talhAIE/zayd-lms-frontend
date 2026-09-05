import React, { useRef, useEffect } from 'react';
import { Play, Pause, ChevronDown, BookOpen } from 'lucide-react';

type ReadingPassageBlock = {
  text?: string;
  speaker?: string;
};

export type ReadingPassagePresentation = {
  format?: 'paragraph' | 'conversation';
  heading?: string;
  title?: string;
  author?: string;
  blocks?: ReadingPassageBlock[];
  vocabularyTerms?: string[];
};

interface ReadingPassageCardProps {
  content: string;
  audioUrl?: string;
  isPlaying?: boolean;
  onToggleAudio?: () => void;
  onExpand?: () => void;
  forceExpanded?: boolean;
  title?: string;
  collapsibleMode?: 'see-more' | 'accordion';
  readingPresentation?: ReadingPassagePresentation;
  showAudioControl?: boolean;
}

const inferConversationBlocks = (content: string): ReadingPassageBlock[] | null => {
  const lines = content.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const blocks = lines.map((line) => {
    const match = line.match(/^([^:]{1,40}):\s*(.+)$/);
    return match ? { speaker: match[1].trim(), text: match[2].trim() } : null;
  });

  return blocks.every((block) => block) ? (blocks as ReadingPassageBlock[]) : null;
};

const ReadingPassageCard: React.FC<ReadingPassageCardProps> = ({
  content,
  audioUrl,
  isPlaying = false,
  onToggleAudio,
  onExpand,
  forceExpanded = false,
  title = 'Reading Passage',
  collapsibleMode = 'see-more',
  readingPresentation,
  showAudioControl = Boolean(audioUrl),
}) => {
  const [isExpanded, setIsExpanded] = React.useState(collapsibleMode === 'accordion' ? false : false);
  const [shouldShowExpandButton, setShouldShowExpandButton] = React.useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content needs expansion button
  useEffect(() => {
    if (contentRef.current) {
      setIsExpanded(false);

      const element = contentRef.current;
      const originalClass = element.className;
      element.className = originalClass.replace('line-clamp-3', 'line-clamp-none');

      const fullHeight = element.scrollHeight;
      element.className = originalClass;

      const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 22;
      const maxHeight = lineHeight * 3;

      setShouldShowExpandButton(fullHeight > maxHeight);
    }
  }, [content]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && onExpand) {
      onExpand();
    }
  };

  const suppliedBlocks = readingPresentation?.blocks?.filter((block) => block.text?.trim()) ?? [];
  const inferredConversation = suppliedBlocks.length === 0
    ? inferConversationBlocks(content)
    : null;
  const blocks = suppliedBlocks.length > 0 ? suppliedBlocks : inferredConversation ?? [];
  const isConversation = readingPresentation?.format === 'conversation'
    ? blocks.length > 0
    : Boolean(inferredConversation);
  const paragraphContent = suppliedBlocks.length > 0
    ? suppliedBlocks.map((block) => block.text?.trim()).filter((text): text is string => Boolean(text))
    : content.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter((text): text is string => Boolean(text));

  return (
    <div className="w-full bg-white border border-[#E5E7EB] rounded-[12px] p-[16px_20px] flex flex-col gap-3 font-['Outfit',sans-serif] min-h-0 flex-shrink overflow-hidden">
      {/* Header Row: Badge & Audio */}
      <div className="flex flex-row justify-between items-center w-full">
        {collapsibleMode === 'accordion' && !forceExpanded ? (
          <button
            type="button"
            onClick={handleToggleExpand}
            className="flex items-center gap-3 cursor-pointer select-none"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
          >
            {/* Reading Passage Badge */}
            <div className="inline-flex flex-row items-center px-3 py-1.5 gap-[6px] bg-[#EFF6FF] border border-[#5C9DFF] rounded-[20px]">
              <BookOpen className="w-3.5 h-3.5 text-[#5C9DFF]" />
              <span className="font-['Outfit'] font-semibold text-[12px] leading-[15px] text-[#5C9DFF]">
                {title}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#6E748F] transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        ) : (
          <div className="flex items-center gap-3">
          {/* Reading Passage Badge */}
          <div className="inline-flex flex-row items-center px-3 py-1.5 gap-[6px] bg-[#EFF6FF] border border-[#5C9DFF] rounded-[20px]">
            <BookOpen className="w-3.5 h-3.5 text-[#5C9DFF]" />
            <span className="font-['Outfit'] font-semibold text-[12px] leading-[15px] text-[#5C9DFF]">
              {title}
            </span>
          </div>
          </div>
        )}

        {showAudioControl && onToggleAudio && (
          <button
            type="button"
            onClick={() => {
              onToggleAudio();
            }}
            className="flex items-center gap-1.5 text-[#5C9DFF] hover:text-[#4A8BEB] transition-colors p-1"
            aria-label={isPlaying ? 'Pause reading passage audio' : 'Play reading passage audio'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span className="text-[12px] font-semibold">Listen</span>
          </button>
        )}
      </div>

      {/* Content */}
      {!(collapsibleMode === 'accordion' && !forceExpanded && !isExpanded) && (
        <div className={`min-h-0 flex-shrink overflow-y-auto pr-2 custom-scrollbar ${collapsibleMode === 'accordion' && !forceExpanded ? 'max-h-[120px]' : ''}`}>
          <div
            ref={contentRef}
            className={`font-['Outfit'] font-normal text-[14px] leading-[22px] text-[#282828] transition-all duration-200 ${
              (collapsibleMode === 'see-more' && !isExpanded && !forceExpanded) ? 'line-clamp-3' : 'line-clamp-none'
            }`}
          >
            {readingPresentation?.title && (
              <h3 className="mb-0.5 text-[16px] font-bold leading-6">{readingPresentation.title}</h3>
            )}
            {readingPresentation?.author && (
              <p className="mb-3 italic">{readingPresentation.author}</p>
            )}
            {isConversation ? (
              <div className="space-y-1">
                {blocks.map((block, index) => (
                  <p key={`${block.speaker ?? 'line'}-${index}`}>
                    {block.speaker && <strong>{block.speaker}: </strong>}
                    {block.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paragraphContent.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* See More Row */}
      {(collapsibleMode === 'see-more' && shouldShowExpandButton && !forceExpanded) && (
        <div className="flex flex-row items-center pt-1">
          <button
            onClick={handleToggleExpand}
            className="font-['Outfit'] font-semibold text-[13px] leading-[16px] text-[#5C9DFF] underline hover:text-[#4A8BEB] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>{isExpanded ? 'See Less' : 'See More'}</span>
            <ChevronDown 
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadingPassageCard;
