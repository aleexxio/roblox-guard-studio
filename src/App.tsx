import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModSidebar } from "@/components/ModSidebar";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
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
  const location = useLocation();

  useEffect(() => {
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      // Fetch user role
      setTimeout(async () => {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (data) {
          setUserRole(data.role as Role);
        }
      }, 0);
    } else {
      setUserRole(null);
    }
  }, [session]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-foreground">Loading...</div>
    </div>;
  }

  // Auth route - accessible when not logged in
  if (location.pathname === "/auth") {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
      </Routes>
    );
  }

  // Redirect to auth if not logged in
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Home page (no sidebar)
  if (location.pathname === "/") {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    );
  }

  // Protected routes with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ModSidebar userRole={userRole || "moderator"} />
        <div className="flex-1 flex flex-col">
          <Header userRole={userRole || "moderator"} onRoleChange={setUserRole} />
          <main className="flex-1">
            <Routes>
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
