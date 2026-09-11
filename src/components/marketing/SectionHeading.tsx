import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  /** A word or phrase inside `title` rendered in the serif accent face. */
  accentWord?: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
  /** Rendered on the opposite side of the title on wide screens. */
  action?: React.ReactNode;
}

/**
 * The one heading treatment used by every marketing section, so rhythm and
 * hierarchy stay identical down the page. `accentWord` swaps one phrase into
 * the italic serif — the signature move of the type system.
 */
export function SectionHeading({
  eyebrow,
  title,
  accentWord,
  description,
  align = "center",
  className,
  action,
}: SectionHeadingProps) {
  const reduce = useReducedMotion();
  const centred = align === "center";

  const parts = React.useMemo(() => {
    if (!accentWord || !title.includes(accentWord)) return [title];
    const idx = title.indexOf(accentWord);
    return [title.slice(0, idx), accentWord, title.slice(idx + accentWord.length)];
  }, [title, accentWord]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, ease: EASE.expo }}
      className={cn(
        "flex flex-col gap-4",
        centred ? "items-center text-center" : "items-start text-left",
        action && "sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className
      )}
    >
      <div className={cn("max-w-2xl", centred && "mx-auto")}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}

        <h2 className={cn("text-display-md font-semibold text-foreground", eyebrow && "mt-5")}>
          {parts.length === 1
            ? title
            : parts.map((p, i) => (
                // A <span> rather than a Fragment: the dev-time component
                // tagger annotates every element, and Fragments reject props.
                <span key={i} className={i === 1 ? "font-accent italic text-gradient" : undefined}>
                  {p}
                </span>
              ))}
        </h2>

        {description && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

export default SectionHeading;
