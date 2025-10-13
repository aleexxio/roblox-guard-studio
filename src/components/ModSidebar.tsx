import { Ban, AlertTriangle, Users, Server, Settings, Tag, UserCog, Unlock, Scale } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

type Role = "moderator" | "admin";

const allItems = [
  { title: "Ban", url: "/ban", icon: Ban },
  { title: "Warn", url: "/warn", icon: AlertTriangle },
  { title: "Lookup User", url: "/lookup", icon: Users },
  { title: "Private Servers", url: "/player-data", icon: Server },
  { title: "Game Settings", url: "/manage-mods", icon: Settings },
  { title: "Promo Codes", url: "/promo-codes", icon: Tag },
  { title: "Player Editor", url: "/player-data", icon: UserCog },
  { title: "Group Bans", url: "/manage-mods", icon: Users },
  { title: "Unban Player", url: "/unban", icon: Unlock },
  { title: "Manage Appeals", url: "/manage-mods", icon: Scale },
];

interface ModSidebarProps {
  userRole: Role;
}

export function ModSidebar({ userRole }: ModSidebarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="border-b border-sidebar-border p-4 bg-muted/30">
        <div>
          <h2 className="text-base font-semibold text-sidebar-foreground">Welcome Shawnyg!</h2>
          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(currentTime)}</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarMenu>
          {allItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className={({ isActive }) =>
                    isActive
                      ? "bg-muted text-sidebar-foreground font-medium"
                      : "hover:bg-muted/50 text-sidebar-foreground"
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
