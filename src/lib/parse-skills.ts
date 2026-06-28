/** Safely parse a skills field that may be a JSON string, an array, or null. */
export function parseSkills(skills: unknown): string[] {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
