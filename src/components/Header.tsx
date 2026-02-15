import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-lg font-bold">Roblox Moderation Panel</h1>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Log Out
      </Button>
    </header>
  );
}
