import "./future-skills-section.css";

const futureTags = [
  "الدراسة الجامعية",
  "المعرفة العالمية",
  "سوق العمل",
  "التدريب والتطوير",
  "التواصل المهني",
];

export default function FutureSkillsSection() {
  return (
    <section className="future-skills" dir="rtl" lang="ar" aria-labelledby="future-skills-heading">
      <div className="future-skills__container">
        <div className="future-skills__card">
          <div className="future-skills__copy">
            <span className="future-skills__eyebrow">مهارة للمستقبل</span>
            <h2 id="future-skills-heading" className="future-skills__heading">
              <span>الإنجليزية ليست مادة</span>
              <span>دراسيــة فقــط</span>
            </h2>
            <p className="future-skills__description">
              ما يتعلمه الطالب اليوم يمكن أن يفتح أمامه فرصًا أكبر غدًا في الدراسة
              الجامعية والوصول إلى المعرفة والاستعداد لسوق العمل.
            </p>
          </div>
          <ul className="future-skills__tags" aria-label="مجالات استخدام الإنجليزية">
            {futureTags.map((tag) => (
              <li key={tag} className="future-skills__tag">{tag}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
