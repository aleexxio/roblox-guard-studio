import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Unban() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBannedUsers();
  }, []);

  const fetchBannedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('bans')
        .select(`
          id,
          reason,
          duration,
          banned_at,
          players (username, roblox_id)
        `)
        .eq('is_active', true)
        .order('banned_at', { ascending: false });

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch banned users",
        variant: "destructive",
      });
    }
  };

  const handleUnban = async (id: string, robloxId: string) => {
    try {
      const { error } = await supabase
        .from('bans')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Player Unbanned",
        description: `Player ${robloxId} has been unbanned.`,
      });
      
      fetchBannedUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unban player",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = bannedUsers.filter(ban =>
    ban.players?.roblox_id?.includes(searchTerm) ||
    ban.players?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Unban Player</h1>
        <p className="text-muted-foreground">Remove bans from players</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Search Banned Players</CardTitle>
          <CardDescription>Find and unban players by Roblox ID or username</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Search Roblox ID or Username</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search by Roblox ID or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Banned Players</CardTitle>
          <CardDescription>List of currently banned players</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Roblox ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Banned Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((ban) => (
                <TableRow key={ban.id} className="border-border">
                  <TableCell className="font-medium">{ban.players?.roblox_id}</TableCell>
                  <TableCell>{ban.players?.username}</TableCell>
                  <TableCell>{ban.reason}</TableCell>
                  <TableCell>{new Date(ban.banned_at).toLocaleDateString()}</TableCell>
                  <TableCell>{ban.duration}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleUnban(ban.id, ban.players?.roblox_id)}
                      className="bg-success hover:bg-success/90"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Unban
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}