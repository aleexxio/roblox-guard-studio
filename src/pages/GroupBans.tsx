import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function GroupBans() {
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [reason, setReason] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('group_bans')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch group bans",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await supabase
        .from('group_bans')
        .insert({
          group_id: groupId,
          group_name: groupName || null,
          reason: reason || null,
          created_by: sessionData.session?.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Group Banned",
        description: `Group ID "${groupId}" has been banned.`,
      });
      
      setGroupId("");
      setGroupName("");
      setReason("");
      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to ban group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('group_bans')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Group Unbanned",
      });
      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unban group",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Group Bans</h1>
        <p className="text-muted-foreground">Ban entire Roblox groups from your game</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Ban a Group</CardTitle>
          <CardDescription>Players in banned groups will be kicked from the game</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="groupId">Group ID</Label>
                <Input
                  id="groupId"
                  placeholder="e.g., 12345678"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name (optional)</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Exploiters United"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Known exploiter group"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Banning..." : "Ban Group"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Banned Groups</CardTitle>
          <CardDescription>Manage banned Roblox groups</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Group ID</TableHead>
                <TableHead>Group Name</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Banned At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No groups banned yet
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="font-mono font-bold text-primary">{item.group_id}</TableCell>
                    <TableCell>{item.group_name || "-"}</TableCell>
                    <TableCell>{item.reason || "-"}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
