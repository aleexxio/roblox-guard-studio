import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserByUsername, getUserById } from "@/lib/roblox-api";
import { sendDiscordWebhook } from "@/lib/discord-webhook";
import { Loader2 } from "lucide-react";

const PRESET_REASONS = [
  "Exploiting",
  "Inappropriate Actions",
  "Game Staff Impersonation",
];

export default function Ban() {
  const [robloxId, setRobloxId] = useState("");
  const [username, setUsername] = useState("");
  const [reasonType, setReasonType] = useState<"preset" | "custom">("preset");
  const [presetReason, setPresetReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const { toast } = useToast();

  const reason = reasonType === "preset" ? presetReason : customReason;

  const handleUsernameBlur = async () => {
    if (username.trim().length > 0 && !robloxId) {
      setFetchingUser(true);
      try {
        const user = await getUserByUsername(username.trim());
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

  const handleRobloxIdBlur = async () => {
    if (robloxId.trim().length > 0 && !username && !isNaN(Number(robloxId))) {
      setFetchingUser(true);
      try {
        const user = await getUserById(robloxId.trim());
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
    
    if (!robloxId && !username) {
      toast({
        title: "Error",
        description: "Please provide either a username or Roblox ID",
        variant: "destructive",
      });
      return;
    }

    // Auto-fetch if one is missing
    let finalRobloxId = robloxId;
    let finalUsername = username;

    if (!robloxId && username) {
      setFetchingUser(true);
      try {
        const user = await getUserByUsername(username.trim());
        if (user) {
          finalRobloxId = user.id.toString();
          setRobloxId(finalRobloxId);
        } else {
          toast({
            title: "User Not Found",
            description: "No Roblox user found with that username",
            variant: "destructive",
          });
          setFetchingUser(false);
          return;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch user from Roblox",
          variant: "destructive",
        });
        setFetchingUser(false);
        return;
      }
      setFetchingUser(false);
    }

    if (!username && robloxId) {
      setFetchingUser(true);
      try {
        const user = await getUserById(robloxId.trim());
        if (user) {
          finalUsername = user.name;
          setUsername(finalUsername);
        }
      } catch (error) {
        // Continue without username if fetch fails
      }
      setFetchingUser(false);
    }
    
    setLoading(true);
    
    try {
      // Find or create player
      let { data: player, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('roblox_id', finalRobloxId)
        .maybeSingle();

      if (playerError) throw playerError;

      if (!player) {
        // Create player if doesn't exist
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ roblox_id: finalRobloxId, username: finalUsername || `Player_${finalRobloxId}` })
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

      // Calculate appealable_at (14 days from now)
      const appealableAt = new Date();
      appealableAt.setDate(appealableAt.getDate() + 14);

      // Get current user info for webhook
      const { data: sessionData } = await supabase.auth.getSession();
      const moderatorEmail = sessionData.session?.user?.email || 'Unknown';
      const moderatorUsername = moderatorEmail.split('@')[0];

      // Create ban
      const { error: banError } = await supabase
        .from('bans')
        .insert({
          player_id: player.id,
          moderator_id: sessionData.session?.user?.id,
          reason,
          duration,
          expires_at: expiresAt,
          appealable_at: appealableAt.toISOString(),
        });

      if (banError) throw banError;

      // Send Discord webhook
      await sendDiscordWebhook({
        type: 'ban',
        roblox_id: finalRobloxId,
        username: finalUsername || `Player_${finalRobloxId}`,
        reason,
        notes,
        duration: duration === 'permanent' ? 'Permanent' : duration,
        moderator_username: moderatorUsername,
      });

      toast({
        title: "Player Banned",
        description: `Player ${finalUsername || finalRobloxId} has been banned for ${duration === 'permanent' ? 'Permanent' : duration}.`,
      });
      
      setRobloxId("");
      setUsername("");
      setPresetReason("");
      setCustomReason("");
      setDuration("");
      setNotes("");
      setReasonType("preset");
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
              <Label htmlFor="ban-username">Username</Label>
              <div className="relative">
                <Input
                  id="ban-username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={handleUsernameBlur}
                  disabled={fetchingUser}
                />
                {fetchingUser && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">OR</div>

            <div className="space-y-2">
              <Label htmlFor="ban-roblox-id">Roblox ID</Label>
              <div className="relative">
                <Input
                  id="ban-roblox-id"
                  placeholder="Enter Roblox ID"
                  value={robloxId}
                  onChange={(e) => setRobloxId(e.target.value)}
                  onBlur={handleRobloxIdBlur}
                  disabled={fetchingUser}
                />
                {fetchingUser && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Reason Type</Label>
              <RadioGroup value={reasonType} onValueChange={(value) => setReasonType(value as "preset" | "custom")} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preset" id="preset" />
                  <Label htmlFor="preset" className="cursor-pointer">Preset Reason</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer">Custom Reason</Label>
                </div>
              </RadioGroup>

              {reasonType === "preset" ? (
                <Select value={presetReason} onValueChange={setPresetReason} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {PRESET_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Textarea
                  id="reason"
                  placeholder="Enter custom ban reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                  rows={4}
                />
              )}
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
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
