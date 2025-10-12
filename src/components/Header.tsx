import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

type Role = "moderator" | "admin";

interface HeaderProps {
  userRole: Role;
  onRoleChange: (role: Role) => void;
}

export function Header({ userRole, onRoleChange }: HeaderProps) {
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
          onClick={() => onRoleChange(userRole === "admin" ? "moderator" : "admin")}
          className="ml-2"
        >
          Switch to {userRole === "admin" ? "Moderator" : "Admin"}
        </Button>
      </div>
    </header>
  );
}
