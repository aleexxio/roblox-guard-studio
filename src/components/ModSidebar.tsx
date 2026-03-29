import { Ban, AlertTriangle, Users, Tag, UserCog, Unlock, ShieldCheck, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Role = "moderator" | "admin";

const allItems = [
  { title: "Ban Player", url: "/ban", icon: Ban },
  { title: "Warn Player", url: "/warn", icon: AlertTriangle },
  { title: "Lookup Player", url: "/lookup", icon: Users },
  { title: "Data Management", url: "/player-data", icon: UserCog, adminOnly: true },
  { title: "Unban Player", url: "/unban", icon: Unlock, adminOnly: true },
  { title: "Promo Codes", url: "/promo-codes", icon: Tag, adminOnly: true },
  { title: "Group Bans", url: "/group-bans", icon: UsersRound, adminOnly: true },
  { title: "Manage Mods", url: "/manage-mods", icon: ShieldCheck, adminOnly: true },
];

interface ModSidebarProps {
  userRole: Role;
}

export function ModSidebar({ userRole }: ModSidebarProps) {
  const filteredItems = allItems.filter(item => {
    if ('adminOnly' in item && item.adminOnly) {
      return userRole === 'admin';
    }
    return true;
  });

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <h1 className="text-lg font-bold text-sidebar-foreground">Game Moderation</h1>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        <SidebarMenu>
          {filteredItems.map((item) => (
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
