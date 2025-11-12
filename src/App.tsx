import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModSidebar } from "@/components/ModSidebar";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Home from "./pages/Home";
import Ban from "./pages/Ban";
import Warn from "./pages/Warn";
import Lookup from "./pages/Lookup";
import PromoCodes from "./pages/PromoCodes";
import ManageMods from "./pages/ManageMods";
import Unban from "./pages/Unban";
import PlayerData from "./pages/PlayerData";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

type Role = "moderator" | "admin";

const AppContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setUserRole(data?.role || null);
      setLoading(false);
    };

    fetchUserRole();
  }, [session]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (!userRole) {
    return <div className="min-h-screen flex items-center justify-center">No role assigned. Contact an administrator.</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ModSidebar userRole={userRole} />
        <div className="flex-1 flex flex-col">
          <Header userRole={userRole} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
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
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
