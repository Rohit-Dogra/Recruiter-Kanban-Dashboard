/* ══════════════════════════════════════════════════════════════════════════
   BRAND IDENTITY — single source of truth
   The product name and its contact details were previously repeated across 25
   files (including two near-identical offer-letter templates), which is why
   renaming meant touching all of them. Anything identity-shaped belongs here.

   ⚠ The domain below is a placeholder. Point `domain` at whatever you actually
     register — every email, URL and social link derives from it.
   ══════════════════════════════════════════════════════════════════════════ */

const domain = "hyre.com";

export const BRAND = {
  /** Wordmark, as shown to users. */
  name: "Hyre",
  /** Uppercase lockup for print/PDF headers. */
  nameUpper: "HYRE",
  /** Legal entity name used in contracts and offer letters. */
  legalName: "Hyre",
  /** Line under the wordmark. */
  tagline: "AI Recruitment",
  /** One-sentence positioning, used in meta descriptions and share cards. */
  description:
    "Hyre screens every candidate with AI — résumés parsed and scored, screening calls placed, interviews run and offers sent, all in one pipeline.",

  domain,
  url: `https://${domain}`,

  email: {
    general: `hello@${domain}`,
    contact: `contact@${domain}`,
    privacy: `privacy@${domain}`,
    /** Shown as an input placeholder on the admin sign-in screen. */
    adminExample: `admin@${domain}`,
  },

  social: {
    handle: "@hyre",
    twitter: "https://twitter.com/hyre",
    linkedin: "https://www.linkedin.com/company/hyre",
    github: "https://github.com/hyre",
  },
} as const;

export default BRAND;
