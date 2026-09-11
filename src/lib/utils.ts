import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge classifies any unknown `text-*` class as a text *colour*, so
 * our custom fluid display sizes (`text-display-md`) were being dropped
 * whenever a colour class followed them in the same `cn()` call. Teaching the
 * merger about the design system's own scales keeps conflict resolution
 * correct instead of forcing us to rename the utilities.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display-xl", "display-lg", "display-md", "display-sm"] },
      ],
      "font-family": [{ font: ["sans", "display", "accent", "mono"] }],
      // Gradient text fills genuinely conflict with a plain text colour.
      "text-color": ["text-gradient", "text-gradient-hero"],
      shadow: [{ shadow: ["xs", "glow", "glow-lg", "inset", "elegant", "card"] }],
      rounded: [{ rounded: ["xs", "2xl", "3xl"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
