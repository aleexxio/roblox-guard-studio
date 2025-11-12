import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

type Role = "moderator" | "admin";

interface HeaderProps {
  userRole: Role;
}

export function Header({ userRole }: HeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-lg font-bold">Roblox Moderation Panel</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Role:</span>
        <Badge variant={userRole === "admin" ? "default" : "secondary"} className="capitalize">
          {userRole}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="ml-2"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
