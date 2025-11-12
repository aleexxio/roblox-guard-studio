import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Lookup() {
  const [username, setUsername] = useState("");
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
        .eq('username', username)
        .maybeSingle();

      if (playerError) throw playerError;

      if (!player) {
        toast({
          title: "Player Not Found",
          description: `No player found with username: ${username}`,
          variant: "destructive",
        });
        setPlayerData(null);
        return;
      }

      // Get warnings count
      const { count: warningsCount } = await supabase
        .from('warnings')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', player.id);

      // Get active bans count
      const { count: bansCount } = await supabase
        .from('bans')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', player.id)
        .eq('is_active', true);

      setPlayerData({
        username: player.username,
        userId: player.user_id || player.id,
        joinDate: new Date(player.join_date).toLocaleDateString(),
        warnings: warningsCount || 0,
        bans: bansCount || 0,
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
        <p className="text-muted-foreground">Search for player information</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Search Player</CardTitle>
          <CardDescription>Enter a username to view player details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-username">Username</Label>
              <div className="flex gap-2">
                <Input
                  id="search-username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
        <Card className="border-border shadow-glow-primary/20">
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
            <CardDescription>Details for {playerData.username}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-medium">{playerData.userId}</p>
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
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="font-medium text-yellow-500">{playerData.warnings}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active Bans</p>
                <p className="font-medium text-destructive">{playerData.bans}</p>
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
      )}
    </div>
  );
}