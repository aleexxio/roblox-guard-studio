import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Save, Loader2, Plus, Trash2, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PlayerData() {
  const [usernameInput, setUsernameInput] = useState("");
  const [robloxIdInput, setRobloxIdInput] = useState("");
  const [player, setPlayer] = useState<any | null>(null);
  const [editedMoney, setEditedMoney] = useState<number>(0);
  const [ownedVehicles, setOwnedVehicles] = useState<string[]>([]);
  const [vehicleRegistry, setVehicleRegistry] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicleToAdd, setVehicleToAdd] = useState("");
  const { toast } = useToast();

  // Load vehicle registry from DB on mount
  useEffect(() => {
    const loadRegistry = async () => {
      const { data, error } = await supabase
        .from('vehicle_registry')
        .select('name')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setVehicleRegistry(data.map((v: any) => v.name));
      } else {
        // Fallback to hardcoded list if DB is empty (before first sync)
        setVehicleRegistry([
          "Car",
          "Ferrari F8 Tributo",
          "Lamborghini Huracan Performante",
          "Ford Bronco",
          "2020 Hongqi H9",
          "Lawn Mower",
          "2020 Lamborghini Aventador",
          "Police Tahoe",
          "Fire Engine",
        ]);
      }
    };
    loadRegistry();
  }, []);

  const fetchPlayerByField = async (field: 'username' | 'roblox_id', value: string) => {
    setLoading(true);
    setPlayer(null);
    setOwnedVehicles([]);

    try {
      const { data, error } = field === 'username'
        ? await supabase.from('players').select('*').ilike('username', value.trim()).limit(1).maybeSingle()
        : await supabase.from('players').select('*').eq('roblox_id', value.trim()).limit(1).maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({ title: "Not Found", description: "No player found.", variant: "destructive" });
        setLoading(false);
        return;
      }

      setPlayer(data);
      setEditedMoney(data.money || 0);
      setUsernameInput(data.username || "");
      setRobloxIdInput(data.roblox_id || "");

      const { data: vehicles, error: vErr } = await supabase
        .from('player_vehicles')
        .select('vehicle_name')
        .eq('player_id', data.id);

      if (vErr) throw vErr;
      setOwnedVehicles((vehicles || []).map((v: any) => v.vehicle_name));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch player", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMoney = async () => {
    if (!player) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ money: editedMoney })
        .eq('id', player.id);
      if (error) throw error;
      setPlayer({ ...player, money: editedMoney });
      toast({ title: "Saved", description: "Player money updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleGrantVehicle = async () => {
    if (!player || !vehicleToAdd) return;
    if (ownedVehicles.includes(vehicleToAdd)) {
      toast({ title: "Already Owned", description: "Player already has this vehicle.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase
        .from('player_vehicles')
        .insert({
          player_id: player.id,
          roblox_id: player.roblox_id,
          vehicle_name: vehicleToAdd,
          granted_by: session.session?.user?.id,
        });
      if (error) throw error;
      setOwnedVehicles([...ownedVehicles, vehicleToAdd]);
      setVehicleToAdd("");
      toast({ title: "Vehicle Granted", description: `${vehicleToAdd} added to player.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeVehicle = async (vehicleName: string) => {
    if (!player) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('player_vehicles')
        .delete()
        .eq('player_id', player.id)
        .eq('vehicle_name', vehicleName);
      if (error) throw error;
      setOwnedVehicles(ownedVehicles.filter(v => v !== vehicleName));
      toast({ title: "Vehicle Revoked", description: `${vehicleName} removed from player.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const availableToGrant = vehicleRegistry.filter(v => !ownedVehicles.includes(v));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Management</h1>
        <p className="text-muted-foreground">Search for a player to view and edit their data</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Search Player</CardTitle>
          <CardDescription>Enter a username or Roblox ID — the other field will populate automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Username</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Law_Tactics"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPlayerByField('username', usernameInput)}
                />
                <Button variant="secondary" onClick={() => fetchPlayerByField('username', usernameInput)} disabled={loading || !usernameInput.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Roblox ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 1590751364"
                  value={robloxIdInput}
                  onChange={(e) => setRobloxIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPlayerByField('roblox_id', robloxIdInput)}
                />
                <Button variant="secondary" onClick={() => fetchPlayerByField('roblox_id', robloxIdInput)} disabled={loading || !robloxIdInput.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {player && (
        <>
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Player Info — {player.username}</CardTitle>
              <CardDescription>Roblox ID: {player.roblox_id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Money</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editedMoney}
                      onChange={(e) => setEditedMoney(parseInt(e.target.value) || 0)}
                    />
                    <Button onClick={handleSaveMoney} disabled={saving} className="bg-success hover:bg-success/90">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>XP</Label>
                  <Input value={player.xp || 0} disabled />
                  <p className="text-xs text-muted-foreground">XP editing coming soon</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>Last Seen: {player.last_seen ? new Date(player.last_seen).toLocaleString() : 'Never'}</div>
                <div>Playtime: {player.playtime_seconds ? Math.floor(player.playtime_seconds / 3600) + 'h ' + Math.floor((player.playtime_seconds % 3600) / 60) + 'm' : '0h 0m'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Management
              </CardTitle>
              <CardDescription>
                Grant or revoke vehicles for this player. Vehicle list syncs automatically from your game server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={vehicleToAdd}
                  onChange={(e) => setVehicleToAdd(e.target.value)}
                >
                  <option value="">Select vehicle to grant...</option>
                  {availableToGrant.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <Button onClick={handleGrantVehicle} disabled={!vehicleToAdd || saving} variant="secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  Grant
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownedVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No vehicles owned
                      </TableCell>
                    </TableRow>
                  ) : (
                    ownedVehicles.map(v => (
                      <TableRow key={v} className="border-border">
                        <TableCell className="font-medium">{v}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="destructive" size="sm" onClick={() => handleRevokeVehicle(v)} disabled={saving}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
