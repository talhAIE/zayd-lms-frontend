import React from 'react';
import { RotateCcw, Award } from 'lucide-react';

interface TopicCompletionModalProps {
  isOpen: boolean;
  onRetake: () => void;
  isJustCompleted?: boolean;
  onFinish?: () => void;
}

export const TopicCompletionModal: React.FC<TopicCompletionModalProps> = ({
  isOpen,
  onRetake,
  isJustCompleted,
  onFinish
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[420px] bg-white rounded-[24px] p-6 sm:p-7 shadow-2xl border border-gray-100 flex flex-col items-center text-center font-['Outfit',sans-serif] gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Award Icon Badge */}
        <div className="w-14 h-14 bg-[#EFF6FF] border border-[#5C9DFF]/30 rounded-full flex items-center justify-center text-[#5C9DFF] shadow-sm">
          <Award className="w-7 h-7" />
        </div>

        {/* Text Group */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[22px] font-bold text-[#0F1450] tracking-[-0.3px] leading-tight">
            Topic Completed!
          </h3>
          <p className="text-[14px] leading-[20px] text-[#6E748F] px-2">
            {isJustCompleted
              ? "You have successfully completed this activity. You can finish now or reset it to practise again."
              : "You have already completed this activity. You can finish now or reset it to practise again."}
          </p>
        </div>

        {/* Actions */}
        <div className="w-full pt-1 flex flex-col gap-3">
          {onFinish && (
            <button
              onClick={onFinish}
              className="w-full py-3 px-4 bg-[#5C9DFF] text-white rounded-full font-semibold text-[14px] hover:bg-[#4A8BEB] transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Finish</span>
            </button>
          )}
          <button
            onClick={onRetake}
            className="w-full py-3 px-4 border border-[#5C9DFF] bg-white text-[#4A8BEB] rounded-full font-semibold text-[14px] hover:bg-[#EFF6FF] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Lesson</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicCompletionModal;
