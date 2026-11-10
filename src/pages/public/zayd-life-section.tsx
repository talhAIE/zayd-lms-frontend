import scenarioArtwork from "@/assets/landing-page/zayd-life-scenarios.png";
import "./zayd-life-section.css";

const scenarios = [
  { label: "في المطار", position: "100% 0%" },
  { label: "في المطعم", position: "50% 0%" },
  { label: "في السوق", position: "0% 0%" },
  { label: "أثناء السفر", position: "100% 100%" },
  { label: "في المواقف الاجتماعية", position: "50% 100%" },
  { label: "ومواقف أخرى كثيرة", position: "0% 100%" },
];

export default function ZaydLifeSection() {
  return (
    <section id="life" className="zayd-life" dir="rtl" lang="ar" aria-labelledby="zayd-life-heading">
      <div className="zayd-life__container">
        <div className="zayd-life__copy">
          <p className="zayd-life__eyebrow">من المنهج إلى الحياة</p>
          <h2 id="zayd-life-heading" className="zayd-life__heading">
            <span>الإنجليزية لا تنتهي</span>
            <span className="zayd-life__heading-accent">عند حدود الكتاب</span>
          </h2>
          <p className="zayd-life__description">
            في <strong><bdi dir="ltr">Zayd Life</bdi> و <bdi dir="ltr">Zayd Plus</bdi></strong>، تمتد ممارسة الإنجليزية إلى أكثر من 40 موضوعًا وموقفًا من الحياة اليومية، لتنمية القدرة على التواصل بثقة في مواقف حقيقية.
          </p>
          <p className="zayd-life__message">
            <span>لأن الهدف ليس فقط أن يتعلم الإنجليزية،</span>
            <span>بل القدرة على استخدامها في الحياة.</span>
          </p>
        </div>

        <ul className="zayd-life__scenarios" aria-label="مواقف الحياة اليومية لممارسة الإنجليزية">
          {scenarios.map((scenario) => (
            <li key={scenario.label} className="zayd-life__scenario">
              <span className="zayd-life__artwork" aria-hidden="true" style={{ backgroundImage: `url(${scenarioArtwork})`, backgroundPosition: scenario.position }} />
              <span className="zayd-life__label">{scenario.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
