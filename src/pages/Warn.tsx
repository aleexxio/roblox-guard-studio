import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Warn() {
  const [robloxId, setRobloxId] = useState("");
  const [username, setUsername] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleWarn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Find or create player
      let { data: player, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('roblox_id', robloxId)
        .maybeSingle();

      if (playerError) throw playerError;

      if (!player) {
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ roblox_id: robloxId, username: username || `Player_${robloxId}` })
          .select('id')
          .single();

        if (createError) throw createError;
        player = newPlayer;
      }

      // Create warning
      const { data: sessionData } = await supabase.auth.getSession();
      const { error: warnError } = await supabase
        .from('warnings')
        .insert({
          player_id: player.id,
          moderator_id: sessionData.session?.user?.id,
          message: warning,
        });

      if (warnError) throw warnError;

      toast({
        title: "Warning Issued",
        description: `Player ${robloxId} has been warned.`,
      });
      
      setRobloxId("");
      setUsername("");
      setWarning("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to issue warning",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
              <Label htmlFor="roblox-id">Roblox ID</Label>
              <Input
                id="roblox-id"
                placeholder="Enter Roblox ID"
                value={robloxId}
                onChange={(e) => setRobloxId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username (Optional)</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>
              {loading ? "Issuing..." : "Issue Warning"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
