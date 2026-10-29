import Navbar from "./navbar";
import HeroSection from "./hero-section";
import VideoShowcaseSection from "./video-showcase-section";
import ComparisonSection from "./comparison-section";
import CurriculumSection from "./curriculum-section";
import PersonalizedLearningSection from "./personalized-learning-section";
import ZaydLifeSection from "./zayd-life-section";
import FutureSkillsSection from "./future-skills-section";
import ImpactStatsSection from "./impact-stats-section";
import PricingSection from "./pricing-section";
import SchoolsSection from "./schools-section";
import FAQSection from "./faq-section";
import FinalCtaSection from "./final-cta-section";
import Footer from "./footer";

export default function Main() {
  return (
    <div className="min-h-screen bg-white text-[#07294D] font-ibm-plex selection:bg-[#48D3BF]/30 selection:text-[#07294D] overflow-x-hidden" dir="rtl">
      {/* Floating Glassmorphic Navbar */}
      <Navbar />

      <main id="home" className="relative flex flex-col w-full">
        {/* Section 1: Hero Experience & Key Stats */}
        <HeroSection />

        {/* Section 2: 70-second Video Demo Showcase */}
        <VideoShowcaseSection />

        {/* Section 3: Classroom vs Zayd Practice Comparison */}
        <ComparisonSection />

        {/* Section 4: Saudi Curriculum Alignment */}
        <CurriculumSection />

        {/* Section 5: Personalized Learning (6 Adaptive Pillars) */}
        <PersonalizedLearningSection />

        {/* Section 6: Zayd Life (Real-World Scenarios) */}
        <ZaydLifeSection />

        {/* Section 7: Future Skills & Long-Term Value */}
        <FutureSkillsSection />

        {/* Section 8: Impact & 10x Speaking Stats */}
        <ImpactStatsSection />

        {/* Section 9: Pricing Tiers & 50% Limited Time Offer */}
        <PricingSection />

        {/* Section 10: Zayd for Schools & Groups */}
        <SchoolsSection />

        {/* Section 11: Frequently Asked Questions (FAQ) */}
        <FAQSection />

        {/* Section 12: Final Call-to-Action Banner */}
        <FinalCtaSection />
      </main>

      {/* Comprehensive Dark Modern Footer */}
      <Footer />
    </div>
  );
}
