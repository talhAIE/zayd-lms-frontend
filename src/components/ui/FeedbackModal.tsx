import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  feedbackText: string;
  onClose: () => void;
  responseContext?: React.ReactNode;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  feedbackText,
  onClose,
  responseContext
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[460px] bg-white rounded-[24px] p-6 shadow-2xl border border-gray-100 flex flex-col font-['Outfit',sans-serif] gap-4 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#6E748F] hover:text-[#0F1450] hover:bg-gray-100 rounded-full transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EFF6FF] border border-[#5C9DFF]/30 rounded-full flex items-center justify-center text-[#5C9DFF] flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[18px] font-bold text-[#0F1450] leading-tight">
              Tutor Feedback
            </h3>
            <span className="text-[12px] text-[#6E748F]">
              Tips for your practice response
            </span>
          </div>
        </div>

        {/* Feedback Content Box */}
        {responseContext}
        <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-[16px] text-[14px] leading-[22px] text-[#0F1450] whitespace-pre-wrap max-h-[260px] overflow-y-auto">
          {feedbackText || 'Great effort! Keep practicing to improve your fluency.'}
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#5C9DFF] text-white rounded-full font-semibold text-[14px] hover:bg-[#4A8BEB] transition-colors shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
