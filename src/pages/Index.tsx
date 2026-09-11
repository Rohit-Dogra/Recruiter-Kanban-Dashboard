import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import PipelineVisualization from "@/components/PipelineVisualization";
import StatsSection from "@/components/StatsSection";
import FeaturedCompanies from "@/components/FeaturedCompanies";
import RecentJobs from "@/components/RecentJobs";
import Footer from "@/components/Footer";
import { ScrollProgress } from "@/components/marketing/ScrollProgress";

/**
 * Landing page. Section order follows the visitor's questions in sequence:
 * what is it (hero) → who uses it (companies) → what's on it (jobs) →
 * how does it work (features → pipeline) → does it work (stats) → act (footer).
 *
 * The `dark` class is owned by ThemeProvider on <html>, so no theme branching
 * is needed here any more.
 */
const Index = () => (
  <div className="min-h-screen bg-background">
    <ScrollProgress />
    <Header />
    <main id="main">
      <HeroSection />
      <FeaturedCompanies />
      <RecentJobs />
      <FeatureGrid />
      <PipelineVisualization />
      <StatsSection />
    </main>
    <Footer />
  </div>
);

export default Index;
