import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModSidebar } from "@/components/ModSidebar";
import { Header } from "@/components/Header";
import Ban from "./pages/Ban";
import Warn from "./pages/Warn";
import Lookup from "./pages/Lookup";
import PromoCodes from "./pages/PromoCodes";
import ManageMods from "./pages/ManageMods";
import Unban from "./pages/Unban";
import PlayerData from "./pages/PlayerData";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

type Role = "moderator" | "admin";

const App = () => {
  const [userRole, setUserRole] = useState<Role>("moderator");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <ModSidebar userRole={userRole} />
              <div className="flex-1 flex flex-col">
                <Header userRole={userRole} onRoleChange={setUserRole} />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Navigate to="/ban" replace />} />
                    <Route path="/ban" element={<Ban />} />
                    <Route path="/warn" element={<Warn />} />
                    <Route path="/lookup" element={<Lookup />} />
                    {userRole === "admin" && (
                      <>
                        <Route path="/promo-codes" element={<PromoCodes />} />
                        <Route path="/manage-mods" element={<ManageMods />} />
                        <Route path="/unban" element={<Unban />} />
                        <Route path="/player-data" element={<PlayerData />} />
                      </>
                    )}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
