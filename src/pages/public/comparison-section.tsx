import { CheckCircle2, AlertCircle } from "lucide-react";
import "./comparison-section.css";

const classroomPoints = [
  "وقت محدود للتحدث والقراءة والاستماع",
  "فرص أقل للتكرار والمحاولة وتحسين الأداء",
  "صعوبة تقديم تغذية راجعة لكل طالب",
];

const zaydPoints = [
  "يمارس مهارات اللغة الإنجليزية بتفاعل",
  "يتلقى تغذية راجعة فورية لتحسين أدائه",
  "يتقدم وفق مستواه مع فرص متكررة للمحاولة",
];

export default function ComparisonSection() {
  return (
    <section className="classroom-comparison" dir="rtl" lang="ar" aria-labelledby="comparison-heading">
      <div className="classroom-comparison__container">
        <div className="classroom-comparison__header">
          <p className="classroom-comparison__eyebrow">يدرس الإنجليزية لسنوات</p>
          <h2 id="comparison-heading" className="classroom-comparison__heading">لكــن كــم يتحــدث فعليًــا؟</h2>
          <p className="classroom-comparison__intro">
            المشكلة ليست دائمًا في شرح اللغة، بل في أن كل طالب لا يحصل على الوقت الكافي لممارستها بصورة فردية.
          </p>
        </div>

        <div className="classroom-comparison__cards">
          <article className="comparison-card comparison-card--classroom" aria-labelledby="classroom-card-heading">
            <span className="comparison-card__badge">داخل الفصل</span>
            <h3 id="classroom-card-heading" className="comparison-card__heading">معلم واحد ... وعشرات الطلاب</h3>
            <p className="comparison-card__description">
              مهما بلغت كفاءة المعلم، يظل وقت الحصة محدودًا، مما يقلل فرص ممارسة الإنجليزية بصورة فردية منتظمة لكل طالب.
            </p>
            <ul className="comparison-card__points">
              {classroomPoints.map((point) => (
                <li key={point}><AlertCircle aria-hidden="true" /><span>{point}</span></li>
              ))}
            </ul>
          </article>

          <span className="classroom-comparison__versus" aria-hidden="true" dir="ltr">VS</span>

          <article className="comparison-card comparison-card--zayd" aria-labelledby="zayd-card-heading">
            <span className="comparison-card__badge">مع زيد</span>
            <h3 id="zayd-card-heading" className="comparison-card__heading">لكل طالب مساحة لممارسة الإنجليزية</h3>
            <p className="comparison-card__description">
              زيد يعزز دور المعلم، ويمنح لكل طالب فرصًا لممارسة الإنجليزية وفق مستواه وسرعته.
            </p>
            <ul className="comparison-card__points">
              {zaydPoints.map((point) => (
                <li key={point}><CheckCircle2 aria-hidden="true" /><span>{point}</span></li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
