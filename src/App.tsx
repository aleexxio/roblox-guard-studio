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

import Ban from "./pages/Ban";
import Warn from "./pages/Warn";
import Lookup from "./pages/Lookup";
import PromoCodes from "./pages/PromoCodes";
import GroupBans from "./pages/GroupBans";
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
  const [authReady, setAuthReady] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    const syncSession = (nextSession: Session | null) => {
      setSession(nextSession);
      setUserRole(null);
      setRoleError(null);
      setRoleLoading(!!nextSession?.user);
      setAuthReady(true);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUserRole = async () => {
      if (!session?.user) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Failed to fetch user role:', error);
        setRoleError(error.message);
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      setUserRole(data?.role || null);
      setRoleLoading(false);
    };

    fetchUserRole();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  if (!authReady || roleLoading) {
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
    const accountName = session.user.email?.split('@')[0] || 'this account';

    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center text-foreground">
        {roleError
          ? `We couldn't verify permissions for ${accountName}. Please refresh and try again, or contact an administrator.`
          : `No role assigned for ${accountName}. Contact an administrator.`}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ModSidebar userRole={userRole} />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Ban />} />
              <Route path="/ban" element={<Ban />} />
              <Route path="/warn" element={<Warn />} />
              <Route path="/lookup" element={<Lookup />} />
              {userRole === "admin" && (
                <>
                  <Route path="/promo-codes" element={<PromoCodes />} />
                  <Route path="/group-bans" element={<GroupBans />} />
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
