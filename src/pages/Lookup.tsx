import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, LogIn, LogOut, MessageSquare, Sword, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserByUsername, getUserById } from "@/lib/roblox-api";
import { Switch } from "@/components/ui/switch";

const FLAGGED_WORDS = [
  "dick","sex","penis","cock","ass","balls","daddy","suck","dildo","porn",
  "nga","bed","leg","legs","push","harder","tit","tits","tounge","lick",
  "slap","butt","spread","squirt","feet","burst","hole","blow","fuh","fck",
  "fk","sht","nude","mommy","suicide","kill","spank","taste","pedophile",
  "nsfw","naked","masturbate","horny","gay","boob","test",
];

function containsFlaggedWord(message: string): boolean {
  const lower = message.toLowerCase();
  return FLAGGED_WORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
}

const formatPlaytime = (totalSeconds: number): string => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(' ');
};

export default function Lookup() {
  const [robloxId, setRobloxId] = useState("");
  const [username, setUsername] = useState("");
  const [playerData, setPlayerData] = useState<any>(null);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [killLogs, setKillLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
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
          toast({ title: "User Found", description: `Found ${user.name} (ID: ${user.id})` });
        } else {
          toast({ title: "User Not Found", description: "No Roblox user found with that username", variant: "destructive" });
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to fetch user from Roblox", variant: "destructive" });
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
          toast({ title: "User Found", description: `Found ${user.name} (ID: ${user.id})` });
        } else {
          toast({ title: "User Not Found", description: "No Roblox user found with that ID", variant: "destructive" });
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to fetch user from Roblox", variant: "destructive" });
      } finally {
        setFetchingUser(false);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!robloxId && !username) {
      toast({ title: "Error", description: "Please enter a username or Roblox ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      let searchRobloxId = robloxId;
      
      if (!robloxId && username) {
        const user = await getUserByUsername(username.trim());
        if (user) {
          searchRobloxId = user.id.toString();
          setRobloxId(searchRobloxId);
        } else {
          toast({ title: "User Not Found", description: "No Roblox user found with that username", variant: "destructive" });
          setPlayerData(null);
          setLoading(false);
          return;
        }
      }

      if (robloxId && !username) {
        const user = await getUserById(robloxId.trim());
        if (user) setUsername(user.name);
      }

      // Get player data
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('roblox_id', searchRobloxId)
        .maybeSingle();

      if (playerError) throw playerError;

      if (!player) {
        toast({ title: "Player Not Found", description: `No player found with Roblox ID: ${searchRobloxId}. They may not have joined the game yet.`, variant: "destructive" });
        setPlayerData(null);
        return;
      }

      // Fetch all related data in parallel
      const [warningsRes, bansRes, sessionsRes, chatsRes, killsKillerRes, killsVictimRes, vehiclesRes] = await Promise.all([
        supabase.from('warnings').select('*').eq('player_id', player.id).order('issued_at', { ascending: false }),
        supabase.from('bans').select('*').eq('player_id', player.id).order('banned_at', { ascending: false }),
        supabase.from('player_session_logs').select('*').eq('roblox_id', searchRobloxId).order('created_at', { ascending: false }).limit(100),
        supabase.from('player_chat_logs').select('*').eq('roblox_id', searchRobloxId).order('created_at', { ascending: false }).limit(200),
        supabase.from('player_kill_logs').select('*').eq('killer_roblox_id', searchRobloxId).order('created_at', { ascending: false }).limit(100),
        supabase.from('player_kill_logs').select('*').eq('victim_roblox_id', searchRobloxId).order('created_at', { ascending: false }).limit(100),
        supabase.from('player_vehicles').select('*').eq('roblox_id', searchRobloxId).order('granted_at', { ascending: false }),
      ]);

      const allKills = [...(killsKillerRes.data || []), ...(killsVictimRes.data || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSessionLogs(sessionsRes.data || []);
      setChatLogs(chatsRes.data || []);
      setKillLogs(allKills);
      setVehicles(vehiclesRes.data || []);

      setPlayerData({
        username: player.username,
        robloxId: player.roblox_id,
        joinDate: new Date(player.join_date).toLocaleDateString(),
        warnings: warningsRes.data || [],
        bans: bansRes.data || [],
        playtime: formatPlaytime((player as any).playtime_seconds || 0),
        lastSeen: player.last_seen ? new Date(player.last_seen).toLocaleString() : "Never",
        money: player.money || 0,
        xp: player.xp || 0,
        police_xp: (player as any).police_xp || 0,
        sheriff_xp: (player as any).sheriff_xp || 0,
        state_police_xp: (player as any).state_police_xp || 0,
        dot_xp: (player as any).dot_xp || 0,
        fire_xp: (player as any).fire_xp || 0,
        devProducts: player.dev_products || [],
        gamepasses: player.gamepasses || [],
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to lookup player", variant: "destructive" });
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
                <Input id="lookup-username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} onBlur={handleUsernameBlur} disabled={fetchingUser} />
                {fetchingUser && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">OR</div>
            <div className="space-y-2">
              <Label htmlFor="lookup-roblox-id">Roblox ID</Label>
              <div className="relative">
                <Input id="lookup-roblox-id" placeholder="Enter Roblox ID" value={robloxId} onChange={(e) => setRobloxId(e.target.value)} onBlur={handleRobloxIdBlur} disabled={fetchingUser} />
                {fetchingUser && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
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
          {/* Player Info Card */}
          <Card className="border-border shadow-glow-primary/20">
            <CardHeader>
              <CardTitle>Player Information</CardTitle>
              <CardDescription>Details for {playerData.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <p className="text-sm text-muted-foreground">Last Seen</p>
                  <p className="font-medium">{playerData.lastSeen}</p>
                </div>
              </div>

              {/* XP Section */}
              <div className="mt-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">Team XP</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Police', value: playerData.police_xp },
                    { label: 'Sheriff', value: playerData.sheriff_xp },
                    { label: 'State Police', value: playerData.state_police_xp },
                    { label: 'DOT', value: playerData.dot_xp },
                    { label: 'Fire', value: playerData.fire_xp },
                  ].map((team) => (
                    <div key={team.label} className="border border-border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{team.label}</p>
                      <p className="font-semibold text-lg">{team.value.toLocaleString()} XP</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assets Section */}
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

          {/* Owned Vehicles Card */}
          <Card className="border-border shadow-glow-primary/20">
            <CardHeader>
              <CardTitle>Owned Vehicles ({vehicles.length})</CardTitle>
              <CardDescription>Vehicles owned by this player</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No vehicles owned</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {vehicles.map((v: any) => (
                    <div key={v.id} className="border border-border rounded-lg p-3 space-y-1">
                      <p className="font-medium text-sm">{v.vehicle_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.granted_by ? 'Admin granted' : 'Purchased'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.granted_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="moderation" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="sessions">Join Logs</TabsTrigger>
              <TabsTrigger value="chat">Chat Logs</TabsTrigger>
              <TabsTrigger value="kills">Kill Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="moderation" className="space-y-6">
              <Card className="border-border shadow-glow-primary/20">
                <CardHeader><CardTitle>Warnings ({playerData.warnings.length})</CardTitle></CardHeader>
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
                          <p className="text-sm text-muted-foreground">Issued: {new Date(warning.issued_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border shadow-glow-primary/20">
                <CardHeader><CardTitle>Bans ({playerData.bans.length})</CardTitle></CardHeader>
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
                                <Badge variant="outline">{ban.duration === 'permanent' ? 'Permanent' : ban.duration}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Banned: {new Date(ban.banned_at).toLocaleString()}</p>
                            {ban.expires_at && <p>Expires: {new Date(ban.expires_at).toLocaleString()}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions">
              <Card className="border-border shadow-glow-primary/20">
                <CardHeader>
                  <CardTitle>Join Logs ({sessionLogs.length})</CardTitle>
                  <CardDescription>Recent session activity for this player</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No session logs found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead>Event</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionLogs.map((log: any) => (
                          <TableRow key={log.id} className="border-border">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {log.event_type === 'join' ? <LogIn className="h-4 w-4 text-green-500" /> : <LogOut className="h-4 w-4 text-red-500" />}
                                <span className={log.event_type === 'join' ? 'text-green-500' : 'text-red-500'}>
                                  {log.event_type === 'join' ? 'Joined' : 'Left'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <Card className="border-border shadow-glow-primary/20">
                <CardHeader>
                  <CardTitle>Chat Logs ({chatLogs.length})</CardTitle>
                  <CardDescription>Recent chat messages from this player</CardDescription>
                </CardHeader>
                <CardContent>
                  {chatLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No chat logs found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead>Message</TableHead>
                          <TableHead className="w-[200px]">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chatLogs.map((log: any) => (
                          <TableRow key={log.id} className="border-border">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>{log.message}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kills">
              <Card className="border-border shadow-glow-primary/20">
                <CardHeader>
                  <CardTitle>Kill Logs ({killLogs.length})</CardTitle>
                  <CardDescription>Players killed by and kills on this player</CardDescription>
                </CardHeader>
                <CardContent>
                  {killLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No kill logs found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead>Role</TableHead>
                          <TableHead>Killer</TableHead>
                          <TableHead>Victim</TableHead>
                          <TableHead>Weapon</TableHead>
                          <TableHead className="w-[200px]">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {killLogs.map((log: any) => {
                          const isKiller = log.killer_roblox_id === playerData.robloxId;
                          return (
                            <TableRow key={log.id} className="border-border">
                              <TableCell>
                                <Badge variant={isKiller ? "destructive" : "outline"} className={!isKiller ? "border-yellow-500 text-yellow-500" : ""}>
                                  <Sword className="h-3 w-3 mr-1" />
                                  {isKiller ? 'Killer' : 'Victim'}
                                </Badge>
                              </TableCell>
                              <TableCell>{log.killer_username || log.killer_roblox_id}</TableCell>
                              <TableCell>{log.victim_username || log.victim_roblox_id}</TableCell>
                              <TableCell>{log.weapon || '—'}</TableCell>
                              <TableCell className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
