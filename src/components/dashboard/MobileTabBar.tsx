import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { MOBILE_PRIMARY } from "@/components/dashboard/nav-config";
import { useShell } from "@/components/dashboard/ShellContext";

/**
 * Thumb-reachable bottom navigation for phones. The previous build only had an
 * off-canvas drawer, which meant every section change cost two taps; the four
 * highest-traffic destinations now cost one, with everything else behind "More".
 */
export function MobileTabBar() {
  const location = useLocation();
  const { setMobileNavOpen } = useShell();

  const isActive = (url: string, end?: boolean) =>
    end ? location.pathname === url : location.pathname.startsWith(url);

  return (
    <nav
      aria-label="Primary"
      className="glass-strong fixed inset-x-0 bottom-0 z-30 border-t border-border/60 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {MOBILE_PRIMARY.map((item) => {
          const active = isActive(item.url, item.end);
          return (
            <li key={item.url} className="flex-1">
              <NavLink
                to={item.url}
                end={item.end}
                data-tap
                className={cn(
                  "relative flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium no-underline",
                  "transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-active"
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                <span className="truncate">{item.short ?? item.title}</span>
              </NavLink>
            </li>
          );
        })}

        <li className="flex-1">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="More navigation"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default MobileTabBar;
