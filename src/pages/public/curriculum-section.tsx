import "./curriculum-section.css";

const curriculumSkills = [
  { name: "الاستماع والمناقشة", size: "wide" },
  { name: "القواعد", size: "standard" },
  { name: "الاستماع", size: "standard" },
  { name: "المحادثة", size: "wide" },
  { name: "القراءة", size: "standard" },
  { name: "الكتابة", size: "standard" },
  { name: "التحدث عن الذات", size: "medium" },
  { name: "الصيغة والمعنى والاستخدام", size: "long" },
];

export default function CurriculumSection() {
  return (
    <section id="curriculum" className="curriculum-overview" dir="rtl" lang="ar" aria-labelledby="curriculum-heading">
      <div className="curriculum-overview__container">
        <div className="curriculum-overview__copy">
          <p className="curriculum-overview__eyebrow">متوافق بالكامل مع المنهج</p>
          <h2 id="curriculum-heading" className="curriculum-overview__heading">
            <span>من الأول المتوسط</span>
            <span className="curriculum-overview__heading-accent">إلى الثالث الثانوي</span>
          </h2>
          <p className="curriculum-overview__description">
            لا يحتاج الطالب إلى منهج جديد. زيد يحوّل ما يدرسه بالفعل إلى تجربة ممارسة شخصية وتفاعلية تساعده على استخدام اللغة، لا مجرد معرفتها.
          </p>
          <p className="curriculum-overview__tagline">
            <span>يتعلمها في المنهج…</span>{" "}<span>ويمارسها مع زيد.</span>
          </p>
        </div>

        <div className="curriculum-overview__panel">
          <ul className="curriculum-overview__skills" aria-label="مهارات المنهج التي يمارسها الطالب مع زيد">
            {curriculumSkills.map((skill) => (
              <li key={skill.name} className={`curriculum-overview__skill curriculum-overview__skill--${skill.size}`}>
                {skill.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
