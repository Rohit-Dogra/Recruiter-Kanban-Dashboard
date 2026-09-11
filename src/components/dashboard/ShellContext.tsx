import * as React from "react";

interface ShellContextValue {
  /** Desktop rail is collapsed to icons. */
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  /** Mobile navigation drawer. */
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
}

const ShellContext = React.createContext<ShellContextValue | null>(null);

const STORAGE_KEY = "hyre-sidebar-collapsed";
/* Pre-rename key — see ThemeContext for why this fallback exists. */
const LEGACY_STORAGE_KEY = "hirermind-sidebar-collapsed";

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = React.useState<boolean>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)) === "1";
    } catch {
      return false;
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const setCollapsed = React.useCallback((v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* storage unavailable — the preference just won't persist */
    }
  }, []);

  const toggleCollapsed = React.useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);

  // ⌘\ / Ctrl+\ toggles the rail, matching the convention in editors and IDEs.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  const value = React.useMemo(
    () => ({ collapsed, setCollapsed, toggleCollapsed, mobileNavOpen, setMobileNavOpen }),
    [collapsed, setCollapsed, toggleCollapsed, mobileNavOpen]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextValue {
  const ctx = React.useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within a ShellProvider");
  return ctx;
}
