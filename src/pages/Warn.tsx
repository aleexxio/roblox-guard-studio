import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserByUsername, getUserById } from "@/lib/roblox-api";
import { Loader2 } from "lucide-react";

export default function Warn() {
  const [robloxId, setRobloxId] = useState("");
  const [username, setUsername] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const { toast } = useToast();

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

  const handleWarn = async (e: React.FormEvent) => {
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
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ roblox_id: finalRobloxId, username: finalUsername || `Player_${finalRobloxId}` })
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
        description: `Player ${finalUsername || finalRobloxId} has been warned.`,
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
              <Label htmlFor="warn-username">Username</Label>
              <div className="relative">
                <Input
                  id="warn-username"
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
              <Label htmlFor="warn-roblox-id">Roblox ID</Label>
              <div className="relative">
                <Input
                  id="warn-roblox-id"
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

            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading || fetchingUser}>
              {loading ? "Issuing..." : "Issue Warning"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
