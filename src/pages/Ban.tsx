import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserByUsername, getUserById } from "@/lib/roblox-api";
import { Loader2 } from "lucide-react";

export default function Ban() {
  const [robloxId, setRobloxId] = useState("");
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const { toast } = useToast();

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    
    if (value.trim().length > 0) {
      setFetchingUser(true);
      try {
        const user = await getUserByUsername(value.trim());
        if (user) {
          setRobloxId(user.id.toString());
          toast({
            title: "User Found",
            description: `Found ${user.name} (ID: ${user.id})`,
          });
        } else {
          toast({
            title: "User Not Found",
            description: "No Roblox user found with that username",
            variant: "destructive",
          });
          setRobloxId("");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch user from Roblox",
          variant: "destructive",
        });
      } finally {
        setFetchingUser(false);
      }
    }
  };

  const handleRobloxIdChange = async (value: string) => {
    setRobloxId(value);
    
    if (value.trim().length > 0 && !isNaN(Number(value))) {
      setFetchingUser(true);
      try {
        const user = await getUserById(value.trim());
        if (user) {
          setUsername(user.name);
          toast({
            title: "User Found",
            description: `Found ${user.name} (ID: ${user.id})`,
          });
        } else {
          toast({
            title: "User Not Found",
            description: "No Roblox user found with that ID",
            variant: "destructive",
          });
          setUsername("");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch user from Roblox",
          variant: "destructive",
        });
      } finally {
        setFetchingUser(false);
      }
    }
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!robloxId || !username) {
      toast({
        title: "Error",
        description: "Please provide either a username or Roblox ID",
        variant: "destructive",
      });
      return;
    }
    
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
        // Create player if doesn't exist
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ roblox_id: robloxId, username: username })
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
        description: `Player ${robloxId} has been banned for ${duration}.`,
      });
      
      setRobloxId("");
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
              <div className="relative">
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  disabled={fetchingUser}
                />
                {fetchingUser && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">OR</div>

            <div className="space-y-2">
              <Label htmlFor="roblox-id">Roblox ID</Label>
              <div className="relative">
                <Input
                  id="roblox-id"
                  placeholder="Enter Roblox ID"
                  value={robloxId}
                  onChange={(e) => handleRobloxIdChange(e.target.value)}
                  disabled={fetchingUser}
                />
                {fetchingUser && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
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

            <Button type="submit" variant="destructive" className="w-full" disabled={loading || fetchingUser}>
              {loading ? "Banning..." : "Ban Player"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
