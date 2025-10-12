import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Ban, AlertTriangle, Search, Tag, Users, Unlock, Database } from "lucide-react";
import logo from "@/assets/mod-panel-logo.png";

export default function Home() {
  const navigate = useNavigate();

  const moderatorSections = [
    { title: "Ban Player", icon: Ban, path: "/ban", variant: "destructive" as const },
    { title: "Warn Player", icon: AlertTriangle, path: "/warn", variant: "default" as const },
    { title: "Player Lookup", icon: Search, path: "/lookup", variant: "secondary" as const },
  ];

  const adminSections = [
    { title: "Promo Codes", icon: Tag, path: "/promo-codes", variant: "default" as const },
    { title: "Manage Moderators", icon: Users, path: "/manage-mods", variant: "default" as const },
    { title: "Unban Player", icon: Unlock, path: "/unban", variant: "default" as const },
    { title: "Player Data", icon: Database, path: "/player-data", variant: "default" as const },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-5xl space-y-12">
        {/* Logo and Title */}
        <div className="text-center space-y-6">
          <img 
            src={logo} 
            alt="Moderation Panel" 
            className="mx-auto w-full max-w-2xl rounded-2xl shadow-glow-primary/30"
          />
          <div>
            <h1 className="text-5xl font-bold text-foreground mb-2">Moderation Panel</h1>
            <p className="text-muted-foreground text-lg">Select a section to get started</p>
          </div>
        </div>

        {/* Moderator Sections */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-8 bg-primary rounded-full" />
            Moderator Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moderatorSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.path}
                  className="p-6 border-border hover:border-primary/50 transition-all cursor-pointer group hover:shadow-glow-primary/20"
                  onClick={() => navigate(section.path)}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{section.title}</h3>
                    </div>
                    <Button variant={section.variant} className="w-full">
                      Access
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Admin Sections */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-8 bg-accent rounded-full" />
            Admin Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.path}
                  className="p-6 border-border hover:border-accent/50 transition-all cursor-pointer group hover:shadow-glow-primary/20"
                  onClick={() => navigate(section.path)}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{section.title}</h3>
                    </div>
                    <Button variant={section.variant} className="w-full">
                      Access
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
