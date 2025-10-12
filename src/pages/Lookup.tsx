import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Lookup() {
  const [username, setUsername] = useState("");
  const [playerData, setPlayerData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Replace with actual API call
    setPlayerData({
      username: username,
      userId: "123456789",
      joinDate: "2024-01-15",
      warnings: 2,
      bans: 0,
      playtime: "47 hours",
      lastSeen: "2 hours ago",
    });
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
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
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
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="font-medium text-yellow-500">{playerData.warnings}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Bans</p>
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
