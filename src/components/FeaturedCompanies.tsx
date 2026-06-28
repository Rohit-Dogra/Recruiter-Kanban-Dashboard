import { Building2, Globe, MapPin, Users } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePublicCompanies } from "@/hooks/useApiQuery";
import { motion } from "framer-motion";

interface Company {
  id: number;
  name: string;
  industry: string;
  location: string;
  logo: string | null;
  website: string | null;
  size: string;
}

const FeaturedCompanies = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: companies, isLoading } = usePublicCompanies();

  if (isLoading || !companies || companies.length === 0) return null;

  return (
    <section className={`py-20 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-background" : "bg-secondary"}`}>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div
            className={`inline-flex items-center gap-2 border text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 ${
              isDark ? "border-zinc-700 bg-zinc-900/60 text-zinc-400" : "border-zinc-200 bg-zinc-100 text-zinc-500"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Trusted Companies
          </div>
          <h2
            className={`text-3xl lg:text-4xl font-black mb-3 ${isDark ? "text-white" : "text-zinc-900"}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Companies Hiring on{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">HirerMind</span>
          </h2>
          <p className={`text-sm max-w-lg mx-auto ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Top organizations across industries trust our platform to find the right talent.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {(companies as Company[]).slice(0, 12).map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`group rounded-xl border p-5 text-center transition-all duration-200 ${
                isDark
                  ? "bg-card border-border hover:border-zinc-600 hover:bg-secondary"
                  : "bg-card border-border hover:border-zinc-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-xl overflow-hidden bg-muted">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className={`w-6 h-6 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
                )}
              </div>
              <p className={`text-sm font-semibold truncate ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                {company.name}
              </p>
              <p className={`text-xs mt-1 truncate ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                {company.industry}
              </p>
              <div className={`flex items-center justify-center gap-1 mt-2 text-xs ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{company.location}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCompanies;
