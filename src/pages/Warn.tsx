import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Warn() {
  const [username, setUsername] = useState("");
  const [warning, setWarning] = useState("");
  const { toast } = useToast();

  const handleWarn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Replace with actual API call
    console.log("Warning user:", { username, warning });
    
    toast({
      title: "Warning Issued",
      description: `${username} has been warned.`,
      variant: "default",
    });
    
    setUsername("");
    setWarning("");
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Warn Player</h1>
        <p className="text-muted-foreground">Issue a warning to a player</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Warning Information</CardTitle>
          <CardDescription>Enter the details to warn a player</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWarn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warning">Warning Message</Label>
              <Textarea
                id="warning"
                placeholder="Enter warning message"
                value={warning}
                onChange={(e) => setWarning(e.target.value)}
                required
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
              Issue Warning
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
