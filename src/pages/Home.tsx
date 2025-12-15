import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/mod-panel-logo.png";

export default function Home() {
  const navigate = useNavigate();

  const firstRow = [
    { title: "BAN", path: "/ban", variant: "destructive" as const },
    { title: "WARN", path: "/warn", variant: "warning" as const },
    { title: "LOOKUP", path: "/lookup", variant: "accent" as const },
    { title: "SERVERS", path: "/player-data", variant: "default" as const },
  ];

  const secondRow = [
    { title: "UNBAN PLAYER", path: "/unban", variant: "destructive" as const },
    { title: "PROMO CODES", path: "/promo-codes", variant: "accent" as const },
    { title: "PLAYER EDITOR", path: "/player-data", variant: "warning" as const },
    { title: "MANAGE APPEALS", path: "/manage-appeals", variant: "accent" as const },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-4xl space-y-12">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={logo} 
            alt="PRC Admin Panel" 
            className="w-48 h-48 object-contain"
          />
        </div>

        {/* Title and Subtitle */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-foreground">Clarlake County Admin Panel</h1>
          <p className="text-muted-foreground">If you're here that means someone is getting banned soon, uh oh!</p>
        </div>

        {/* First Row of Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          {firstRow.map((item) => (
            <Button
              key={item.path}
              variant={item.variant}
              onClick={() => navigate(item.path)}
              className="min-w-[140px] h-12 text-base font-semibold border-2 border-current"
            >
              {item.title}
            </Button>
          ))}
        </div>

        {/* Second Row of Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          {secondRow.map((item) => (
            <Button
              key={item.path}
              variant={item.variant}
              onClick={() => navigate(item.path)}
              className="min-w-[140px] h-12 text-base font-semibold border-2 border-current"
            >
              {item.title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
