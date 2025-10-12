import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Save } from "lucide-react";

export default function PlayerData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [players, setPlayers] = useState([
    { id: 1, username: "Player1", level: 45, coins: 12500, gems: 150 },
    { id: 2, username: "Player2", level: 32, coins: 8300, gems: 75 },
    { id: 3, username: "Player3", level: 68, coins: 25000, gems: 320 },
  ]);
  const { toast } = useToast();

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = (id: number) => {
    // TODO: Replace with actual API call
    setEditingId(null);
    toast({
      title: "Player Data Updated",
      description: "Changes have been saved successfully.",
    });
  };

  const handleChange = (id: number, field: string, value: string) => {
    setPlayers(players.map(p =>
      p.id === id ? { ...p, [field]: parseInt(value) || 0 } : p
    ));
  };

  const filteredPlayers = players.filter(player =>
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
          <CardDescription>Find players to manage their data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Search Username</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search players..."
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
                  <TableCell className="font-medium">{player.username}</TableCell>
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
