import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ManageMods() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [moderators, setModerators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchModerators();
  }, []);

  const fetchModerators = async () => {
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, created_at, id, discord_username')
      .eq('role', 'moderator');
    
    if (!rolesData) {
      setModerators([]);
      return;
    }
    
    setModerators(rolesData);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-moderator', {
        body: { username, password, role: 'moderator' }
      });

      if (error) throw error;

      toast({
        title: "Moderator Created",
        description: `Account created for ${username}`,
      });
      
      setUsername("");
      setPassword("");
      fetchModerators();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create moderator",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string, username: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to remove moderators",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-moderator', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;

      toast({
        title: "Moderator Removed",
        description: `${username} has been removed`,
        variant: "destructive",
      });
      
      fetchModerators();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove moderator",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manage Moderators</h1>
        <p className="text-muted-foreground">Add or remove moderator permissions</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Add Moderator</CardTitle>
          <CardDescription>Grant moderator permissions to a user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mod-username">Username</Label>
              <Input
                id="mod-username"
                type="text"
                placeholder="moderator_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mod-password">Password</Label>
              <Input
                id="mod-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="secondary" disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Moderator"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Current Moderators</CardTitle>
          <CardDescription>Manage moderator permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Username</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moderators.map((mod) => (
                <TableRow key={mod.id} className="border-border">
                  <TableCell className="font-medium">
                    {mod.discord_username || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {new Date(mod.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(mod.user_id, mod.discord_username || 'moderator')}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove
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
