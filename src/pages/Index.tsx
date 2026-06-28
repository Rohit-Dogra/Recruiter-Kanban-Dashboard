import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import PipelineVisualization from "@/components/PipelineVisualization";
import StatsSection from "@/components/StatsSection";
import FeaturedCompanies from "@/components/FeaturedCompanies";
import RecentJobs from "@/components/RecentJobs";
import Footer from "@/components/Footer";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

const sectionReveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const Index = () => {
  const { theme } = useTheme();

  return (
    <div className={theme === "dark" ? "dark bg-background min-h-screen" : "bg-background min-h-screen"}>
      <Header />
      <HeroSection />
      <motion.div {...sectionReveal}>
        <FeaturedCompanies />
      </motion.div>
      <motion.div {...sectionReveal}>
        <RecentJobs />
      </motion.div>
      <motion.div {...sectionReveal}>
        <FeatureGrid />
      </motion.div>
      <motion.div {...sectionReveal} transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }}>
        <PipelineVisualization />
      </motion.div>
      <motion.div {...sectionReveal} transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }}>
        <StatsSection />
      </motion.div>
      <motion.div {...sectionReveal} transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.1 }}>
        <Footer />
      </motion.div>
    </div>
  );
};

export default Index;
