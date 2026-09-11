import { Outlet } from "react-router-dom";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MobileTabBar } from "@/components/dashboard/MobileTabBar";
import { ShellProvider } from "@/components/dashboard/ShellContext";
import { PageTransition } from "@/components/motion/PageTransition";
import { CompanyProvider } from "@/contexts/CompanyContext";

/**
 * Recruiter workspace shell.
 *
 * Desktop: a persistent collapsible rail beside a scrolling content column.
 * Mobile:  a slide-over drawer plus a bottom tab bar, so the four busiest
 *          destinations are one thumb-tap away instead of two.
 */
const DashboardLayout = () => (
  <CompanyProvider>
    <ShellProvider>
      <div className="relative flex min-h-svh w-full bg-background">
        {/* Ambient wash so the workspace does not read as a flat grey slab */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 [background:radial-gradient(60%_50%_at_80%_0%,hsl(var(--primary)/0.06),transparent_70%)]"
        />

        <DashboardSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-w-0 flex-1 px-4 pb-24 md:px-6 lg:pb-8">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>

        <MobileTabBar />
      </div>
    </ShellProvider>
  </CompanyProvider>
);

export default DashboardLayout;
