import { Building2, GraduationCap, Trophy } from "lucide-react";
import "./SmartDashboardsSection.css";

const dashboardCards = [
  {
    id: "admin",
    title: "للإدارة المدرسية: رؤية شاملة",
    icon: Building2,
    points: [
      { title: "لوحة تحكم إدارية", body: "تتيح لك متابعة أداء جميع الفصول والمعلمين في مكان واحد." },
      { title: "تقارير فورية", body: "قياس دقيق لمستوى تطور الطلاب ومدى تفاعل المعلمين مع النظام." },
      { title: "قرارات مبنية على البيانات", body: "اكتشف نقاط الضعف في المنهج وعالجها قبل الاختبارات." },
    ],
  },
  {
    id: "teacher",
    title: "للمعلم: متابعة أسهل بجهد أقل",
    icon: GraduationCap,
    points: [
      { title: "مؤشرات الألوان", body: "تصنيف ذكي للطلاب (أخضر، أصفر، أحمر) لمعرفة من يحتاج للمساعدة فوراً." },
      { title: "تنبيهات سريعة", body: <>إرسال توجيهات (<bdi dir="ltr" lang="en">Nudges</bdi>) للطلاب المتعثرين بضغطة زر.</> },
      { title: "الذكاء الاصطناعي كمساعد", body: "زيد يتولى التصحيح والتقييم، لتتفرغ أنت للتوجيه والدعم." },
    ],
  },
  {
    id: "student",
    title: "للطلاب: متعة الممارسة والتحدي",
    icon: Trophy,
    points: [
      { title: "نظام نقاط تنافسي", body: "تحويل الممارسة اليومية إلى تحدٍ ممتع يكافئ الطالب على استمراريته." },
      { title: "لوحات شرف أسبوعية", body: "إبراز أفضل 20 طالباً لتحفيز التنافس الإيجابي." },
      { title: "مكافآت قابلة للاستبدال", body: "يمكن للطلاب استبدال نقاطهم بمكافآت أو امتيازات داخل الفصل، مما يحفز المعلمين والطلاب معاً." },
    ],
  },
] as const;

export default function SmartDashboardsSection() {
  return (
    <section className="smart-dashboards" dir="rtl" lang="ar" aria-labelledby="smart-dashboards-heading">
      <div className="smart-dashboards__container">
        <h2 id="smart-dashboards-heading" className="smart-dashboards__heading">لوحات تحكم ذكية.. <span className="smart-dashboards__heading-accent">قياس دقيق، تدخل أسرع، وتحفيز مستمر</span></h2>
        <div className="smart-dashboards__cards">
          {dashboardCards.map(({ id, title, icon: Icon, points }) => (
            <article key={id} className={`dashboard-card dashboard-card--${id}`} aria-labelledby={`dashboard-${id}-heading`}>
              <span className="dashboard-card__icon" aria-hidden="true"><Icon size={28} /></span>
              <h3 id={`dashboard-${id}-heading`}>{title}</h3>
              <ul>
                {points.map((point) => <li key={point.title}><strong>{point.title}:</strong>{" "}{point.body}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
