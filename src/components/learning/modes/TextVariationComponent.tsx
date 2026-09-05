import { CheckCircle2, Lightbulb, Star, Table2 } from 'lucide-react';
import { LearningComponent } from '@/services/learningService';

interface TextVariationComponentProps { component: LearningComponent; groupedComponents?: LearningComponent[]; }

const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
const rows = (value: unknown): string[][] => Array.isArray(value)
  ? value.filter((row): row is string[] => Array.isArray(row) && row.every((cell) => typeof cell === 'string')) : [];

export default function TextVariationComponent({ component, groupedComponents }: TextVariationComponentProps) {
  const content = component.content || {};
  const presentation = typeof content.presentation === 'string' ? content.presentation : 'default';
  const heading = typeof content.heading === 'string' ? content.heading : component.title;
  const body = typeof content.body === 'string' ? content.body : typeof content.introduction === 'string' ? content.introduction : null;
  const goals = strings(content.goals ?? content.learningGoals);
  const standards = strings(content.standards);

  if (presentation === 'unit_overview') {
    const grouped = groupedComponents || [component];
    const sectionContent = (section: string) => grouped.find((item) => item.content?.section === section)?.content || {};
    const welcome = sectionContent('welcome'); const groupedGoals = sectionContent('goals'); const languageFocus = sectionContent('language_focus'); const preview = sectionContent('preview');
    const bigIdea = typeof welcome.body === 'string' ? welcome.body : typeof content.bigIdea === 'string' ? content.bigIdea : body;
    const overviewGoals = strings(groupedGoals.goals).length ? strings(groupedGoals.goals) : goals;
    const remember = typeof languageFocus.body === 'string' ? languageFocus.body : typeof content.remember === 'string' ? content.remember : typeof content.keyReminder === 'string' ? content.keyReminder : null;
    const previewText = typeof preview.body === 'string' ? preview.body : null;
    const columns = strings(content.columns);
    const tableRows = rows(content.rows);
    const displayColumns = columns.length ? columns : ['What you will learn'];
    const displayRows = tableRows.length ? tableRows : overviewGoals.map((goal) => [goal]);
    return <div className="flex flex-col gap-3 font-['Outfit',sans-serif]">
      <section className="rounded-[14px] bg-gradient-to-r from-[#0267B5] to-[#249CFF] p-5 text-white shadow-sm"><div className="flex items-center gap-2 text-[10px] font-bold tracking-[1.5px] uppercase text-white/90"><Star className="h-3 w-3 fill-current" /> Objective</div><p className="mt-2 text-base font-bold leading-snug">{bigIdea || heading || 'Unit overview'}</p></section>
      {(remember || body) && <section className="flex overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-sm"><div className="flex w-12 shrink-0 items-center justify-center bg-[#EAF4FF]"><div className="h-5 w-4 rounded bg-[#79BFFF]" /></div><div className="p-4"><h2 className="text-sm font-bold text-[#0F172A]">Introduction</h2><p className="mt-1 text-xs leading-relaxed text-[#475569]">{remember || body}</p></div></section>}
      {previewText && <section className="flex overflow-hidden rounded-[14px] border border-[#FEF3C7] bg-[#FFF8E7]"><div className="flex w-12 shrink-0 items-center justify-center bg-[#FDE7B0]"><Lightbulb className="h-5 w-5 text-[#F59E0B]" /></div><div className="p-4"><h2 className="text-xs font-bold uppercase tracking-wider text-[#92400E]">Remember</h2><p className="mt-1 text-xs font-semibold leading-relaxed text-[#C2410C]">{previewText}</p></div></section>}
      {displayRows.length > 0 && <section className="flex overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-sm"><div className="flex w-12 shrink-0 items-center justify-center bg-[#F0EEFF]"><Table2 className="h-5 w-5 text-[#7467EC]" /></div><div className="min-w-0 flex-1 p-4"><h2 className="text-sm font-bold text-[#0F172A]">What You Will Learn</h2><div className="mt-2 overflow-x-auto"><table className="w-full text-left text-[11px]"><thead className="bg-[#F8FAFC]"><tr>{displayColumns.map((column) => <th key={column} className="border-b border-[#E2E8F0] px-3 py-2 font-bold text-[#334155]">{column}</th>)}</tr></thead><tbody>{displayRows.map((row, index) => <tr key={`${row.join('-')}-${index}`} className="border-b border-[#EEF2F6] last:border-0">{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-3 py-2 text-[#475569]">{cell}</td>)}</tr>)}</tbody></table></div></div></section>}
    </div>;
  }

  if (presentation === 'reference_table') {
    const columns = strings(content.columns); const tableRows = rows(content.rows);
    return <section className="overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white shadow-sm font-['Outfit',sans-serif]">{heading && <h2 className="px-6 py-5 text-xl font-bold text-[#0F172A]">{heading}</h2>}<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#EEF2FF]"><tr>{columns.map((column) => <th key={column} className="px-5 py-3 font-bold text-[#3730A3]">{column}</th>)}</tr></thead><tbody>{tableRows.map((row, index) => <tr key={`${row.join('-')}-${index}`} className="border-t border-[#E2E8F0]">{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-5 py-3 text-[#475569]">{cell}</td>)}</tr>)}</tbody></table></div></section>;
  }
  if (presentation === 'writing_introduction') {
    const activityHeading = typeof content.activityHeading === 'string' ? content.activityHeading : 'Writing Activity';
    const activityTitle = typeof content.activityTitle === 'string' ? content.activityTitle : component.title;
    const scenario = typeof content.scenario === 'string' ? content.scenario : '';
    const instruction = typeof content.instruction === 'string' ? content.instruction : '';
    const monitor = content.monitor as any;
    const narration = content.narration as Record<string, unknown> | undefined;
    const vocabulary = Array.isArray(content.vocabulary) ? content.vocabulary : [];

    return (
      <section className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-sm font-['Outfit',sans-serif]">
        <div className="mb-6 flex flex-col gap-2 border-b border-[#E2E8F0] pb-5">
          <span className="text-[12px] font-bold tracking-wider uppercase text-[#4F8DFB]">{activityHeading}</span>
          <h2 className="text-2xl font-bold text-[#0F172A]">{activityTitle}</h2>
        </div>
        
        <div className="flex flex-col gap-5">
          {narration && (
            <div className="flex flex-col gap-4 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <h3 className="text-[16px] font-bold text-[#0F172A]">{typeof narration.heading === 'string' ? narration.heading : 'Narration'}</h3>
              {typeof narration.closeReadDirection === 'string' && <div><p className="text-[14px] font-bold text-[#334155]">Close Read Direction</p><p className="mt-1 text-[14px] leading-relaxed text-[#475569]">{narration.closeReadDirection}</p></div>}
              {typeof narration.writingPrompt === 'string' && <div><p className="text-[14px] font-bold text-[#334155]">Writing Prompt</p><p className="mt-1 text-[14px] leading-relaxed text-[#475569]">{narration.writingPrompt}</p></div>}
              {typeof narration.fullTextReviewNote === 'string' && <div><p className="text-[14px] font-bold text-[#334155]">Optional Full Text Review</p><p className="mt-1 text-[14px] leading-relaxed text-[#475569]">{narration.fullTextReviewNote}</p></div>}
            </div>
          )}

          {!narration && scenario && (
            <div className="rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] p-5">
              <p className="text-[14px] leading-relaxed text-[#475569]">{scenario}</p>
            </div>
          )}
          
          {instruction && (
            <p className="text-[15px] font-medium text-[#334155]">{instruction}</p>
          )}

          {vocabulary.length > 0 && (
            <div className="rounded-[14px] border border-[#DBEAFE] bg-[#EFF6FF] p-5">
              <h3 className="mb-3 text-[15px] font-bold text-[#1D4ED8]">Words You Can Use</h3>
              <ul className="flex flex-col gap-2.5">
                {vocabulary.map((entry: any, index: number) => (
                  <li key={`${entry?.term || 'word'}-${index}`} className="text-[13px] leading-relaxed text-[#1E3A8A]">
                    <strong className="font-bold">{entry?.term}:</strong> {entry?.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {monitor && (
            <div className="mt-2 rounded-[14px] border border-[#BBF7D0] bg-[#F0FDF4] p-5">
              <h3 className="mb-2 text-[15px] font-bold text-[#166534]">{monitor.heading || 'What Zayd Will Monitor'}</h3>
              {monitor.introduction && <p className="mb-4 text-[13px] text-[#166534]">{monitor.introduction}</p>}
              
              {Array.isArray(monitor.skills) && monitor.skills.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {monitor.skills.map((skill: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#16A34A]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <p className="text-[13px] text-[#166534]">
                        <strong className="font-bold">{skill.label}:</strong> {skill.description}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (presentation === 'conversation_groups') {
    const groups = Array.isArray(content.groups) ? content.groups : [];
    return (
      <section className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-sm font-['Outfit',sans-serif]">
        {heading && <h2 className="text-xl font-bold text-[#0F172A]">{heading}</h2>}
        {body && <p className="mt-4 text-sm leading-relaxed text-[#475569]">{body}</p>}
        
        <div className="mt-6 flex flex-col gap-5">
          {groups.map((group: any, index: number) => {
            const groupTitle = typeof group.title === 'string' ? group.title : '';
            const lines = Array.isArray(group.lines) ? group.lines : [];
            return (
              <div key={index} className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:p-5">
                {groupTitle && <h3 className="mb-3 text-[15px] font-bold text-[#0F172A]">{groupTitle}</h3>}
                <div className="flex flex-col gap-2.5">
                  {lines.map((line: any, lineIdx: number) => {
                    const lineStr = typeof line === 'string' ? line : '';
                    const splitIdx = lineStr.indexOf(':');
                    if (splitIdx !== -1) {
                      return (
                        <p key={lineIdx} className="text-[14px] text-[#475569]">
                          <strong className="text-[#334155]">{lineStr.substring(0, splitIdx + 1)}</strong>
                          {lineStr.substring(splitIdx + 1)}
                        </p>
                      );
                    }
                    return <p key={lineIdx} className="text-[14px] text-[#475569]">{lineStr}</p>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  const learningGoal = typeof content.learningGoal === 'string' ? content.learningGoal : null;
  const essentialQuestion = typeof content.essentialQuestion === 'string' ? content.essentialQuestion : null;

  return <section className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-sm font-['Outfit',sans-serif]">{learningGoal && <div className="rounded-[14px] bg-gradient-to-r from-[#0267B5] to-[#249CFF] p-5 text-white"><div className="text-[11px] font-bold uppercase tracking-wider">Learning objective</div><p className="mt-2 text-lg font-bold">{learningGoal}</p></div>}{heading && !learningGoal && <h2 className="text-xl font-bold text-[#0F172A]">{heading}</h2>}{body && <p className="mt-4 text-sm leading-relaxed text-[#475569]">{body}</p>}{essentialQuestion && <div className="mt-4 rounded-xl border-l-4 border-[#3B82F6] bg-[#F8FAFC] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Essential question</p><p className="mt-1 text-sm font-semibold text-[#0F172A]">{essentialQuestion}</p></div>}{goals.length > 0 && <div className="mt-5"><p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Key goals</p><div className="mt-2 space-y-2">{goals.map((goal) => <div key={goal} className="flex gap-2 rounded-lg bg-[#F8FAFC] p-3 text-sm text-[#334155]"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />{goal}</div>)}</div></div>}{standards.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{standards.map((standard) => <span key={standard} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{standard}</span>)}</div>}</section>;
}
