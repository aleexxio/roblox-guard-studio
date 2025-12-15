import { Ban, AlertTriangle, Users, Tag, UserCog, Unlock, Scale, ShieldCheck } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

type Role = "moderator" | "admin";

const allItems = [
  { title: "Ban", url: "/ban", icon: Ban },
  { title: "Warn", url: "/warn", icon: AlertTriangle },
  { title: "Lookup User", url: "/lookup", icon: Users },
  { title: "Player Editor", url: "/player-data", icon: UserCog },
  { title: "Unban Player", url: "/unban", icon: Unlock },
  { title: "Promo Codes", url: "/promo-codes", icon: Tag },
  { title: "Manage Appeals", url: "/manage-appeals", icon: Scale },
  { title: "Manage Mods", url: "/manage-mods", icon: ShieldCheck, adminOnly: true },
];

interface ModSidebarProps {
  userRole: Role;
}

export function ModSidebar({ userRole }: ModSidebarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUsername = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('user_roles')
          .select('discord_username')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (data?.discord_username) {
          setUsername(data.discord_username);
        } else {
          // Extract username from email (format: username@modpanel.local)
          const email = session.user.email || '';
          const extractedUsername = email.split('@')[0];
          setUsername(extractedUsername);
        }
      }
    };
    fetchUsername();
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

  const filteredItems = allItems.filter(item => {
    if ('adminOnly' in item && item.adminOnly) {
      return userRole === 'admin';
    }
    return true;
  });

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="border-b border-sidebar-border p-4 bg-muted/30">
        <div>
          <h2 className="text-base font-semibold text-sidebar-foreground">Welcome {username || 'Moderator'}!</h2>
          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(currentTime)}</p>
        </div>
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
