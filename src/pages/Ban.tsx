import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Ban() {
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Find or create player
      let { data: player, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (playerError) throw playerError;

      if (!player) {
        // Create player if doesn't exist
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ username })
          .select('id')
          .single();

        if (createError) throw createError;
        player = newPlayer;
      }

      // Calculate expiration
      let expiresAt = null;
      if (duration !== 'permanent') {
        const now = new Date();
        if (duration === '1h') now.setHours(now.getHours() + 1);
        else if (duration === '24h') now.setHours(now.getHours() + 24);
        else if (duration === '7d') now.setDate(now.getDate() + 7);
        else if (duration === '30d') now.setDate(now.getDate() + 30);
        expiresAt = now.toISOString();
      }

      // Create ban
      const { data: sessionData } = await supabase.auth.getSession();
      const { error: banError } = await supabase
        .from('bans')
        .insert({
          player_id: player.id,
          moderator_id: sessionData.session?.user?.id,
          reason,
          duration,
          expires_at: expiresAt,
        });

      if (banError) throw banError;

      toast({
        title: "Player Banned",
        description: `${username} has been banned for ${duration}.`,
      });
      
      setUsername("");
      setReason("");
      setDuration("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to ban player",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ban Player</h1>
        <p className="text-muted-foreground">Remove a player from the game</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Ban Information</CardTitle>
          <CardDescription>Enter the details to ban a player</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBan} className="space-y-4">
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
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter ban reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" variant="destructive" className="w-full" disabled={loading}>
              {loading ? "Banning..." : "Ban Player"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
