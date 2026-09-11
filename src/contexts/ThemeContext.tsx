import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  /** Explicitly set the theme. */
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "hyre-theme";
/* Pre-rename key. Read once so the product rename doesn't silently reset the
   theme for anyone who already chose one. Safe to delete after a release or two. */
const LEGACY_STORAGE_KEY = "hirermind-theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    // No explicit choice yet — follow the operating system.
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    // localStorage / matchMedia unavailable
  }
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    // Keep the pre-boot paint colour in sync so reloads stay flash-free.
    root.style.backgroundColor = theme === "dark" ? "#0b0a11" : "#fbfaff";
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

  // Follow the OS until the user makes an explicit choice in this browser.
  useEffect(() => {
    let hasExplicitChoice = false;
    try {
      hasExplicitChoice = localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      /* ignore */
    }
    if (hasExplicitChoice) return;

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const onChange = (e: MediaQueryListEvent) => setThemeState(e.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
