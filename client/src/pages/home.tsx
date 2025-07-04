import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import PainPointsSection from "@/components/pain-points-section";
import SolutionSection from "@/components/solution-section";
import FeaturesSection from "@/components/features-section";
import TestimonialsSection from "@/components/testimonials-section";
import PricingSection from "@/components/pricing-section";
import CtaSection from "@/components/cta-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <HeroSection />
      <PainPointsSection />
      <SolutionSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
