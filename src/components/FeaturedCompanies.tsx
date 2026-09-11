import { Building2, MapPin } from "lucide-react";

import { usePublicCompanies } from "@/hooks/useApiQuery";
import { Marquee } from "@/components/motion/PageTransition";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";

interface Company {
  id: number;
  name: string;
  industry: string;
  location: string;
  logo: string | null;
  website: string | null;
  size: string;
}

/* ══════════════════════════════════════════════════════════════════════════
   TRUSTED COMPANIES
   A grid of logo cards became a continuous marquee: it reads as a long list
   without taking a screen-and-a-half of vertical space, and it works at any
   count without leaving an awkward half-empty final row.
   ══════════════════════════════════════════════════════════════════════════ */

function CompanyCard({ company }: { company: Company }) {
  return (
    <div className="group flex w-60 shrink-0 items-center gap-3 rounded-[var(--radius-lg)] border border-border/70 bg-surface px-4 py-3.5 transition-all duration-300 ease-expo hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-secondary ring-1 ring-inset ring-border/60">
        {company.logo ? (
          <img
            src={company.logo}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-expo group-hover:scale-110"
          />
        ) : (
          <Building2 className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{company.name}</p>
        <p className="truncate text-xs text-muted-foreground">{company.industry}</p>
        {company.location && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground/70">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{company.location}</span>
          </p>
        )}
      </div>
    </div>
  );
}

const FeaturedCompanies = () => {
  const { data: companies, isLoading } = usePublicCompanies();

  if (isLoading) {
    return (
      <section className="border-y border-border/60 bg-surface-2/40 py-14">
        <div className="container mx-auto">
          <Skeleton className="mx-auto h-3 w-48" />
          <div className="mt-8 flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-60 shrink-0 rounded-[var(--radius-lg)]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const list = (companies as Company[] | undefined) ?? [];
  if (list.length === 0) return null;

  // Two rows drifting in opposite directions reads richer than one long strip.
  const half = Math.ceil(list.length / 2);
  const rowA = list.slice(0, half);
  const rowB = list.length > 3 ? list.slice(half) : list;

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-surface-2/40 py-16 sm:py-20">
      <div className="container mx-auto">
        <SectionHeading
          eyebrow="Trusted companies"
          title="Teams already hiring on Hyre."
          accentWord="already"
        />
      </div>

      <div className="mt-10 space-y-4">
        <Marquee speed="slow">
          {rowA.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </Marquee>

        {rowB.length > 0 && (
          <Marquee speed="slow" reverse>
            {rowB.map((c) => (
              <CompanyCard key={`b-${c.id}`} company={c} />
            ))}
          </Marquee>
        )}
      </div>
    </section>
  );
};

export default FeaturedCompanies;
