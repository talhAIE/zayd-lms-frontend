import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Copy, Star, Eye, FileText, Pen, Link, Target, Terminal } from 'lucide-react';
import { LearningComponent } from '@/services/learningService';

interface SemanticReviewComponentProps {
  component: LearningComponent;
  onAnswerChange?: (text: string) => void;
  onSubmit?: (text: string) => Promise<any> | void;
  isSubmitted?: boolean;
  disabled?: boolean;
  defaultText?: string;
  reviewFeedback?: Record<string, unknown> | null;
  showModelAnswer?: boolean;
  onViewModelAnswer?: () => Promise<void> | void;
}

export default function SemanticReviewComponent({
  component,
  onAnswerChange,
  onSubmit,
  isSubmitted = false,
  disabled = false,
  defaultText = '',
  reviewFeedback = null,
  showModelAnswer = false,
  onViewModelAnswer,
}: SemanticReviewComponentProps) {
  const prompt =
    component.content?.prompt ||
    component.description ||
    component.title ||
    '';

  const minimumCharacters = component.content?.minimumCharacters || 10;
  const placeholder = component.content?.placeholder || '';
  const isCompiledParagraph = component.content?.presentation === 'compiled_paragraph';

  const [text, setText] = useState<string>(() => {
    if (component.attempt?.response?.paragraph) {
      return String(component.attempt.response.paragraph);
    }
    if (component.attempt?.response?.text) {
      return String(component.attempt.response.text);
    }
    if (component.attempt?.response?.response) {
      return String(component.attempt.response.response);
    }
    return defaultText;
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRevealingModelAnswer, setIsRevealingModelAnswer] = useState(false);
  const [feedback, setFeedback] = useState<any>(() => {
    if (reviewFeedback) {
      return reviewFeedback;
    }
    // A compiled paragraph receives its feedback from the Writing Review API.
    // Never render a generic component-attempt acknowledgement as fake AI
    // feedback when an older direct launch submitted it through the wrong path.
    if (!isCompiledParagraph && component.attempt?.feedback) {
      return component.attempt.feedback;
    }
    return null;
  });

  const [viewState, setViewState] = useState<'builder' | 'evaluation' | 'model_answer'>('builder');

  // A writing review is returned separately from the component attempt. Keep
  // that richer result visible after the parent refreshes lesson progress.
  useEffect(() => {
    if (reviewFeedback) {
      setFeedback(reviewFeedback);
      return;
    }
    if (!isCompiledParagraph && component.attempt?.feedback) {
      setFeedback(component.attempt.feedback);
    }
  }, [component.attempt?.feedback, isCompiledParagraph, reviewFeedback]);

  useEffect(() => {
    if (showModelAnswer) {
      setViewState('model_answer');
    }
  }, [showModelAnswer]);

  const handleChange = (val: string) => {
    if (disabled || isSubmitted) return;
    setText(val);
    onAnswerChange?.(val);
  };

  const handleAnalyze = async () => {
    if (disabled || isSubmitted || text.trim().length < minimumCharacters) return;
    setIsAnalyzing(true);
    try {
      if (onSubmit) {
        const result = await onSubmit(text);
        const newFeedback = result?.attempt?.feedback || result?.feedback;
        if (newFeedback) setFeedback(newFeedback);
      }
    } catch (err) {
      console.error('Semantic review error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewModelAnswer = async () => {
    if (isRevealingModelAnswer) return;
    if (!onViewModelAnswer) {
      setViewState('model_answer');
      return;
    }

    setIsRevealingModelAnswer(true);
    try {
      await onViewModelAnswer();
    } catch (error) {
      // The page-level handler presents the learner-safe API error. Catching
      // here prevents repeated clicks from producing unhandled promises.
      console.error('Unable to reveal writing model answer:', error);
    } finally {
      setIsRevealingModelAnswer(false);
    }
  };

  const isReady = text.trim().length >= minimumCharacters;

  if (!prompt) {
    return <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This open-input activity has no valid learner prompt.</div>;
  }

  const presentation = component.content?.presentation;
  
  if (presentation === 'compiled_paragraph') {
    const buildHeading = component.content?.buildHeading || 'Build My Paragraph';
    const buildButtonLabel = component.content?.buildButtonLabel || 'Confirm and Build My Paragraph';
    const outputHeading = component.content?.outputHeading || 'Your Compiled Paragraph';
    const writingAnalysisHeading = component.content?.feedback?.heading || 'Zayd AI Evaluation';
    const modelAnswerHeading = component.content?.modelAnswer?.sectionHeading || 'Ideal Model Answer';
    const modelAnswerText =
      typeof feedback === 'object' && feedback !== null
        ? feedback.modelAnswer || feedback.correctAnswer
        : null;
    const hasFeedback = Boolean(feedback);
    const currentViewState = hasFeedback ? (viewState === 'builder' ? 'evaluation' : viewState) : 'builder';

    if (currentViewState === 'builder') {
      return (
        <div className="w-full bg-white rounded-[20px] border border-[#E2E8F0] shadow-sm p-6 md:p-8 flex flex-col gap-6 font-['Outfit',sans-serif]">
          <h2 className="text-[20px] font-bold text-[#0F172A]">{buildHeading}</h2>
          
          <div className="flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled || isSubmitted || isAnalyzing}
              placeholder={placeholder || 'Write your paragraph here...'}
              className="w-full rounded-[14px] border border-[#CBD5E1] p-4 text-[#0F172A] text-[15px] leading-relaxed placeholder-[#94A3B8] focus:border-[#4F8DFB] focus:ring-4 focus:ring-[#4F8DFB]/15 outline-none transition-all min-h-[160px] resize-y disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between items-center text-[12px] text-[#94A3B8] px-1">
              <span>
                {minimumCharacters > 0 && (
                  <>Min characters: {minimumCharacters} {text.length < minimumCharacters && `(${minimumCharacters - text.length} remaining)`}</>
                )}
              </span>
              <span>{text.length} chars</span>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={disabled || !isReady || isAnalyzing || isSubmitted}
              className={`
                rounded-full bg-[#10B981] hover:bg-[#059669] active:scale-[0.98] text-white px-7 py-3 font-bold text-[14px] flex items-center gap-2.5 transition-all shadow-sm
                ${(!isReady || disabled || isSubmitted || isAnalyzing) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isAnalyzing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isAnalyzing ? 'Building...' : isSubmitted ? 'Paragraph Built' : buildButtonLabel}</span>
            </button>
          </div>
        </div>
      );
    }

    const isModelAnswer = currentViewState === 'model_answer';
    const fieldResults = feedback?.fieldResults || [];
    
    const displayMetrics: any[] = fieldResults.map((metric: any) => {
      let icon = FileText;
      if (metric.key === 'punctuation' || metric.label?.toLowerCase().includes('punctuation')) icon = Pen;
      if (metric.key === 'cohesion' || metric.label?.toLowerCase().includes('cohesion')) icon = Link;
      if (metric.key === 'coherence' || metric.label?.toLowerCase().includes('coherence')) icon = Target;
      if (metric.key === 'vocabulary' || metric.label?.toLowerCase().includes('vocabulary')) icon = Terminal;
      return { ...metric, icon };
    });
    const scoredMetrics = displayMetrics
      .map((metric) => metric.score)
      .filter((score): score is number => typeof score === 'number');
    const overallQuality =
      typeof feedback?.score === 'number'
        ? feedback.score
        : scoredMetrics.length > 0
          ? Math.round(scoredMetrics.reduce((sum, score) => sum + score, 0) / scoredMetrics.length)
          : null;
    const taskAchievedText = feedback?.comment || 'Your writing review is ready.';

    return (
      <div className="w-full bg-white rounded-[20px] border border-[#E2E8F0] shadow-sm p-6 md:p-8 flex flex-col gap-6 font-['Outfit',sans-serif]">
        
        {/* Read-only Compiled Paragraph */}
        <div className="w-full rounded-[14px] border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2 font-bold text-[#0F172A] text-[15px]">
               <FileText className="w-4 h-4 text-[#94A3B8]" />
               {outputHeading}
            </div>
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors border border-[#E2E8F0] rounded-md px-2.5 py-1">
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <div className="p-5 text-[14px] text-[#475569] leading-relaxed">
            {text}
          </div>
        </div>

        {!isModelAnswer ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Zayd AI Evaluation Header Card */}
            <div className="w-full rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-[12px] bg-[#FEF3C7] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#D97706] fill-[#D97706]" />
                 </div>
                 <div className="flex flex-col gap-1.5">
                   <h3 className="text-[18px] font-bold text-[#0F172A]">{writingAnalysisHeading}</h3>
                   <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">Comprehensive Scan Complete</span>
                 </div>
               </div>
               <div className="flex flex-col items-end gap-1.5">
                 <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Overall Quality</span>
                 <div className="bg-[#4F8DFB] text-white font-bold text-[24px] rounded-[8px] px-4 py-1.5 shadow-sm leading-none">
                   {overallQuality === null ? '—' : `${overallQuality}%`}
                 </div>
               </div>
            </div>

            {/* Task Achieved Banner */}
            <div className="w-full rounded-[12px] bg-[#ECFDF5] p-4 flex items-start gap-3 border border-[#D1FAE5]">
              <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <p className="text-[14px] text-[#065F46] leading-relaxed">
                <strong className="font-bold">Task Achieved:</strong> {taskAchievedText}
              </p>
            </div>

            {/* Prompt Alignment Section */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Prompt Alignment</span>
              {displayMetrics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayMetrics.map((metric, idx) => {
                  const score = metric.score || 0;
                  const isLow = score < 80;
                  const Icon = metric.icon || FileText;
                  return (
                    <div key={idx} className="rounded-[12px] border border-[#E2E8F0] p-4 bg-[#FAFAF9] flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-[#94A3B8]" />
                          <span className="text-[13px] font-bold text-[#0F172A]">{metric.label || metric.key}</span>
                          {isLow && (
                            <span className="text-[9px] font-bold text-white bg-[#F59E0B] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Needs Attention</span>
                          )}
                        </div>
                        <span className={`text-[13px] font-bold ${isLow ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>{score}%</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isLow ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} style={{ width: `${score}%` }} />
                      </div>
                      
                      {/* Feedback Text */}
                      <p className="text-[12px] text-[#64748B] leading-relaxed mt-1">
                        {metric.comment || metric.feedback || 'Excellent work.'}
                      </p>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <p className="rounded-[12px] border border-[#E2E8F0] bg-[#FAFAF9] p-4 text-[13px] leading-relaxed text-[#64748B]">
                  Detailed rubric feedback is not available for this review. Your teacher can provide further guidance.
                </p>
              )}
            </div>

            {/* View System Model Answer Button */}
            {typeof modelAnswerText === 'string' && modelAnswerText.trim() && (
              <button
                type="button"
                onClick={() => void handleViewModelAnswer()}
                disabled={isRevealingModelAnswer}
                className="mt-2 w-full bg-[#4F8DFB] hover:bg-[#3B82F6] active:scale-[0.99] text-white font-bold text-[14px] py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Eye className="w-4 h-4" /> {isRevealingModelAnswer ? 'Opening Model Answer...' : 'View System Model Answer'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Ideal Model Answer Card */}
            <div className="w-full rounded-[16px] bg-[#FEF9C3] p-6 border border-[#FEF08A] shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#F59E0B] flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <h3 className="text-[16px] font-bold text-[#0F172A]">{modelAnswerHeading}</h3>
              </div>
              <p className="text-[14px] text-[#0F172A] leading-relaxed">
                {modelAnswerText}
              </p>
            </div>

          </div>
        )}
      </div>
    );
  }

  // STANDARD OPEN INPUT RENDERER
  return (
    <div className="w-full bg-white rounded-[20px] border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(15,23,42,0.04)] p-6 md:p-8 flex flex-col gap-5 font-['Outfit',sans-serif] transition-all">
      {/* Header with AI badge */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] font-bold text-[13px] flex items-center justify-center shadow-sm flex-shrink-0">
          AI
        </div>
        <h2 className="text-[18px] md:text-[20px] font-bold text-[#0F172A] tracking-[-0.3px]">
          Zayd Semantic Review
        </h2>
      </div>

      {/* Sub-header & Prompt */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#0284C7]">
          AI REVIEW
        </span>
        <p className="text-[14px] md:text-[15px] font-medium text-[#0284C7] leading-relaxed">
          {prompt}
        </p>
      </div>

      {/* Textarea */}
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled || isSubmitted || isAnalyzing}
          placeholder={placeholder}
          className="w-full rounded-[14px] border border-[#CBD5E1] p-4 text-[#0F172A] text-[14px] placeholder-[#94A3B8] focus:border-[#4F8DFB] focus:ring-4 focus:ring-[#4F8DFB]/15 outline-none transition-all min-h-[140px] resize-y disabled:bg-gray-50 disabled:cursor-not-allowed"
        />

        <div className="flex justify-between items-center text-[12px] text-[#94A3B8] px-1">
          <span>
            {minimumCharacters > 0 && (
              <>Min characters: {minimumCharacters} {text.length < minimumCharacters && `(${minimumCharacters - text.length} remaining)`}</>
            )}
          </span>
          <span>{text.length} chars</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-start pt-1">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={disabled || !isReady || isAnalyzing || isSubmitted}
          className={`
            rounded-full bg-[#4F8DFB] hover:bg-[#3B82F6] active:scale-[0.98] text-white px-6 py-3 font-bold text-[14px] flex items-center gap-2.5 transition-all shadow-sm
            ${(!isReady || disabled || isSubmitted || isAnalyzing) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isAnalyzing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-[#FDE047] fill-[#FDE047]" />
          )}
          <span>{isAnalyzing ? 'Analyzing response...' : isSubmitted ? 'Analyzed' : 'Analyze with Zayd AI'}</span>
        </button>
      </div>

      {/* Feedback Card if present */}
      {(feedback || (isSubmitted && component.attempt?.feedback)) && (
        <div className="mt-2 p-4 rounded-[14px] bg-[#F0FDF4] border border-[#BBF7D0] flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-[#16A34A] font-bold text-[14px]">
            <CheckCircle2 className="w-4 h-4" />
            <span>AI Review Feedback</span>
          </div>
          <p className="text-[13px] text-[#166534] leading-relaxed">
            {typeof feedback === 'string' ? feedback : feedback?.comment || component.attempt?.feedback || 'Great job! Your explanation demonstrated clear understanding.'}
          </p>
        </div>
      )}
    </div>
  );
}
