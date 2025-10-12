import { Shield, Ban, AlertTriangle, Search, Tag, Users, Unlock, Database } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

type Role = "moderator" | "admin";

const moderatorItems = [
  { title: "Ban Player", url: "/ban", icon: Ban },
  { title: "Warn Player", url: "/warn", icon: AlertTriangle },
  { title: "Lookup Player", url: "/lookup", icon: Search },
];

const adminItems = [
  { title: "Promo Codes", url: "/promo-codes", icon: Tag },
  { title: "Manage Moderators", url: "/manage-mods", icon: Users },
  { title: "Unban Player", url: "/unban", icon: Unlock },
  { title: "Manage Player Data", url: "/player-data", icon: Database },
];

interface ModSidebarProps {
  userRole: Role;
}

export function ModSidebar({ userRole }: ModSidebarProps) {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">Mod Panel</h2>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Moderator Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {moderatorItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userRole === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary font-medium"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
