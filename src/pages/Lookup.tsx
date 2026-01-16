import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserByUsername, getUserById } from "@/lib/roblox-api";

const formatPlaytime = (totalHours: number): string => {
  const totalSeconds = Math.floor(totalHours * 3600);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

export default function Lookup() {
  const [robloxId, setRobloxId] = useState("");
  const [username, setUsername] = useState("");
  const [playerData, setPlayerData] = useState<any>(null);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!robloxId && !username) {
      toast({
        title: "Error",
        description: "Please enter a username or Roblox ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Determine search method
      let searchRobloxId = robloxId;
      
      // If only username provided, fetch Roblox ID first
      if (!robloxId && username) {
        const user = await getUserByUsername(username.trim());
        if (user) {
          searchRobloxId = user.id.toString();
          setRobloxId(searchRobloxId);
        } else {
          toast({
            title: "User Not Found",
            description: "No Roblox user found with that username",
            variant: "destructive",
          });
          setPlayerData(null);
          setLoading(false);
          return;
        }
      }

      // If only Roblox ID provided, fetch username
      if (robloxId && !username) {
        const user = await getUserById(robloxId.trim());
        if (user) {
          setUsername(user.name);
        }
      }

      // Get player data from database
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('roblox_id', searchRobloxId)
        .maybeSingle();

      if (playerError) throw playerError;

      if (!player) {
        toast({
          title: "Player Not Found",
          description: `No player found with Roblox ID: ${searchRobloxId}. They may not have joined the game yet.`,
          variant: "destructive",
        });
        setPlayerData(null);
        return;
      }

      // Get warnings with details
      const { data: warnings, error: warningsError } = await supabase
        .from('warnings')
        .select('*')
        .eq('player_id', player.id)
        .order('issued_at', { ascending: false });

      if (warningsError) throw warningsError;

      // Get bans with details
      const { data: bans, error: bansError } = await supabase
        .from('bans')
        .select('*')
        .eq('player_id', player.id)
        .order('banned_at', { ascending: false });

      if (bansError) throw bansError;

      setPlayerData({
        username: player.username,
        robloxId: player.roblox_id,
        joinDate: new Date(player.join_date).toLocaleDateString(),
        warnings: warnings || [],
        bans: bans || [],
        playtime: formatPlaytime(player.playtime_hours || 0),
        lastSeen: player.last_seen 
          ? new Date(player.last_seen).toLocaleString() 
          : "Never",
        money: player.money || 0,
        xp: player.xp || 0,
        devProducts: player.dev_products || [],
        gamepasses: player.gamepasses || [],
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to lookup player",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Player Lookup</h1>
        <p className="text-muted-foreground">Search for player information by username or Roblox ID</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Search Player</CardTitle>
          <CardDescription>Enter a username or Roblox ID to view player details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lookup-username">Username</Label>
              <div className="relative">
                <Input
                  id="lookup-username"
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
              <Label htmlFor="lookup-roblox-id">Roblox ID</Label>
              <div className="relative">
                <Input
                  id="lookup-roblox-id"
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

            <Button type="submit" className="w-full" disabled={loading || fetchingUser}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {playerData && (
        <>
          <Card className="border-border shadow-glow-primary/20">
            <CardHeader>
              <CardTitle>Player Information</CardTitle>
              <CardDescription>Details for {playerData.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Roblox ID</p>
                  <p className="font-medium">{playerData.robloxId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{playerData.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Join Date</p>
                  <p className="font-medium">{playerData.joinDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Playtime</p>
                  <p className="font-medium">{playerData.playtime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Money</p>
                  <p className="font-medium">${playerData.money.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">XP</p>
                  <p className="font-medium text-muted-foreground italic">Coming soon</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Seen</p>
                  <p className="font-medium">{playerData.lastSeen}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Purchased Dev Products</p>
                  {playerData.devProducts && playerData.devProducts.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {playerData.devProducts.map((product: any, index: number) => (
                        <Badge key={index} variant="secondary">{product.name || product}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No dev products purchased</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Purchased Gamepasses</p>
                  {playerData.gamepasses && playerData.gamepasses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {playerData.gamepasses.map((pass: any, index: number) => (
                        <Badge key={index} variant="outline" className="border-primary text-primary">{pass.name || pass}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No gamepasses purchased</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-glow-primary/20">
            <CardHeader>
              <CardTitle>Warnings ({playerData.warnings.length})</CardTitle>
              <CardDescription>All warnings issued to this player</CardDescription>
            </CardHeader>
            <CardContent>
              {playerData.warnings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No warnings found</p>
              ) : (
                <div className="space-y-3">
                  {playerData.warnings.map((warning: any) => (
                    <div key={warning.id} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{warning.message}</p>
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">Warning</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Issued: {new Date(warning.issued_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-glow-primary/20">
            <CardHeader>
              <CardTitle>Bans ({playerData.bans.length})</CardTitle>
              <CardDescription>All bans issued to this player</CardDescription>
            </CardHeader>
            <CardContent>
              {playerData.bans.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No bans found</p>
              ) : (
                <div className="space-y-3">
                  {playerData.bans.map((ban: any) => (
                    <div key={ban.id} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium mb-1">{ban.reason}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant={ban.is_active ? "destructive" : "outline"}>
                              {ban.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{ban.duration}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Banned: {new Date(ban.banned_at).toLocaleString()}</p>
                        {ban.expires_at && (
                          <p>Expires: {new Date(ban.expires_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
