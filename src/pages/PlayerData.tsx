import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PlayerData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('join_date', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch players",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = async (id: string) => {
    try {
      const player = players.find(p => p.id === id);
      if (!player) return;

      const { error } = await supabase
        .from('players')
        .update({
          level: player.level,
          coins: player.coins,
          gems: player.gems,
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      toast({
        title: "Player Data Updated",
        description: "Changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update player data",
        variant: "destructive",
      });
    }
  };

  const handleChange = (id: string, field: string, value: string) => {
    setPlayers(players.map(p =>
      p.id === id ? { ...p, [field]: parseInt(value) || 0 } : p
    ));
  };

  const filteredPlayers = players.filter(player =>
    player.roblox_id?.includes(searchTerm) ||
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manage Player Data</h1>
        <p className="text-muted-foreground">View and edit player statistics</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Search Players</CardTitle>
          <CardDescription>Find players by Roblox ID or username to manage their data</CardDescription>
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
          <CardTitle>Player Data</CardTitle>
          <CardDescription>Edit player statistics and currency</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Roblox ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Coins</TableHead>
                <TableHead>Gems</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id} className="border-border">
                  <TableCell className="font-medium">{player.roblox_id}</TableCell>
                  <TableCell>{player.username}</TableCell>
                  <TableCell>
                    {editingId === player.id ? (
                      <Input
                        type="number"
                        value={player.level}
                        onChange={(e) => handleChange(player.id, 'level', e.target.value)}
                        className="w-20"
                      />
                    ) : (
                      player.level
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === player.id ? (
                      <Input
                        type="number"
                        value={player.coins}
                        onChange={(e) => handleChange(player.id, 'coins', e.target.value)}
                        className="w-28"
                      />
                    ) : (
                      player.coins.toLocaleString()
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === player.id ? (
                      <Input
                        type="number"
                        value={player.gems}
                        onChange={(e) => handleChange(player.id, 'gems', e.target.value)}
                        className="w-20"
                      />
                    ) : (
                      player.gems
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === player.id ? (
                      <Button
                        onClick={() => handleSave(player.id)}
                        className="bg-success hover:bg-success/90"
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEdit(player.id)}
                        variant="secondary"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
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