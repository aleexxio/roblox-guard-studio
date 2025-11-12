import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Lookup() {
  const [robloxId, setRobloxId] = useState("");
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get player data
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('roblox_id', robloxId)
        .maybeSingle();

      if (playerError) throw playerError;

      if (!player) {
        toast({
          title: "Player Not Found",
          description: `No player found with Roblox ID: ${robloxId}`,
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
        playtime: `${player.playtime_hours || 0} hours`,
        lastSeen: player.last_seen 
          ? new Date(player.last_seen).toLocaleString() 
          : "Never",
        level: player.level,
        coins: player.coins,
        gems: player.gems,
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
        <p className="text-muted-foreground">Search for player information by Roblox ID</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Search Player</CardTitle>
          <CardDescription>Enter a Roblox ID to view player details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-roblox-id">Roblox ID</Label>
              <div className="flex gap-2">
                <Input
                  id="search-roblox-id"
                  placeholder="Enter Roblox ID"
                  value={robloxId}
                  onChange={(e) => setRobloxId(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
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
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-medium">{playerData.level}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Coins</p>
                  <p className="font-medium">{playerData.coins.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gems</p>
                  <p className="font-medium">{playerData.gems}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Playtime</p>
                  <p className="font-medium">{playerData.playtime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Seen</p>
                  <p className="font-medium">{playerData.lastSeen}</p>
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