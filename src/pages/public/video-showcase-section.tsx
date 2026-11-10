import { Maximize, Play, Volume2 } from "lucide-react";
import "./video-showcase-section.css";

interface VideoShowcaseSectionProps {
  // Supply the promotional video here when it is ready; native controls handle playback.
  videoSrc?: string;
}

export default function VideoShowcaseSection({ videoSrc }: VideoShowcaseSectionProps) {
  return (
    <section id="zayd-demo" className="demo-showcase" dir="rtl" lang="ar" aria-labelledby="demo-heading">
      <div className="demo-showcase__container">
        <header className="demo-showcase__heading-group">
          <p className="demo-showcase__eyebrow">دقيقة واحدة تكفي لفهم الفكرة</p>
          <h2 id="demo-heading" className="demo-showcase__heading">
            شاهد زيد وهو{" "}
            <span className="demo-showcase__heading-ending">يصنع <span className="demo-showcase__heading-accent">الفرق</span></span>
          </h2>
          <p className="demo-showcase__description">
            شاهد كيف تتحول دراسة الإنجليزية إلى ممارسة حقيقية وثقة في التحدث.
          </p>
        </header>

        <div className="demo-showcase__player" data-has-video={Boolean(videoSrc)}>
          {videoSrc ? (
            <video className="demo-showcase__video" src={videoSrc} controls playsInline preload="metadata" aria-label="الفيديو التعريفي لزيد" />
          ) : (
            <>
              <div className="demo-showcase__play-area">
                <button type="button" className="demo-showcase__play" disabled aria-label="الفيديو التعريفي لزيد — سيُضاف قريبًا" aria-describedby="demo-video-status">
                  <Play aria-hidden="true" focusable="false" />
                </button>
                <span className="demo-showcase__play-label">شاهد الفيديو</span>
              </div>
              <p id="demo-video-status" className="sr-only">سيُضاف الفيديو التعريفي قريبًا. عناصر المشغل معطلة حتى يتوفر الفيديو.</p>
              {/* Visual preview only; real controls appear with the video source. */}
              <div className="demo-showcase__controls-preview" aria-hidden="true" dir="ltr">
                <Play className="demo-showcase__small-play" />
                <span className="demo-showcase__time">0:00 / 1:10</span>
                <span className="demo-showcase__timeline"><span /></span>
                <span className="demo-showcase__duration">01:10</span>
                <Volume2 />
                <Maximize />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
