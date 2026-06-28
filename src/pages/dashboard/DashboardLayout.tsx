import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const DashboardLayout = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <CompanyProvider>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full px-4 py-4 md:px-6 md:py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
};

export default DashboardLayout;