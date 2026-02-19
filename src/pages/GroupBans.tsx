import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

async function getGroupInfo(groupId: string): Promise<{ name: string; memberCount: number } | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roblox-proxy?action=group&value=${groupId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const result = await response.json();
    if (result.found && result.group) {
      return {
        name: result.group.name,
        memberCount: result.group.memberCount,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching group info:', error);
    return null;
  }
}

export default function GroupBans() {
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [reason, setReason] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingGroup, setFetchingGroup] = useState(false);
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

  const handleGroupIdBlur = async () => {
    if (groupId.trim().length > 0 && !groupName) {
      setFetchingGroup(true);
      try {
        const groupInfo = await getGroupInfo(groupId.trim());
        if (groupInfo) {
          setGroupName(groupInfo.name);
          toast({
            title: "Group Found",
            description: `Found "${groupInfo.name}" (${groupInfo.memberCount.toLocaleString()} members)`,
          });
        } else {
          toast({
            title: "Group Not Found",
            description: "No Roblox group found with that ID",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch group from Roblox",
          variant: "destructive",
        });
      } finally {
        setFetchingGroup(false);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the ban",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      let finalGroupName = groupName;
      if (!finalGroupName && groupId) {
        setFetchingGroup(true);
        const groupInfo = await getGroupInfo(groupId.trim());
        if (groupInfo) {
          finalGroupName = groupInfo.name;
          setGroupName(finalGroupName);
        }
        setFetchingGroup(false);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data: existingBan } = await supabase
        .from('group_bans')
        .select('id, is_active')
        .eq('group_id', groupId.trim())
        .single();

      if (existingBan) {
        if (existingBan.is_active) {
          toast({
            title: "Already Banned",
            description: `Group "${finalGroupName || groupId}" is already banned.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        const { error } = await supabase
          .from('group_bans')
          .update({
            is_active: true,
            group_name: finalGroupName || null,
            reason: reason,
            created_by: sessionData.session?.user?.id,
            created_at: new Date().toISOString(),
          })
          .eq('id', existingBan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('group_bans')
          .insert({
            group_id: groupId.trim(),
            group_name: finalGroupName || null,
            reason: reason,
            created_by: sessionData.session?.user?.id,
          });

        if (error) throw error;
      }

      toast({
        title: "Group Banned",
        description: `Group "${finalGroupName || groupId}" has been banned.`,
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

      toast({ title: "Group Unbanned" });
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="groupId">Group ID *</Label>
                <div className="relative">
                  <Input
                    id="groupId"
                    placeholder="e.g., 12345678"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    onBlur={handleGroupIdBlur}
                    disabled={fetchingGroup}
                    required
                  />
                  {fetchingGroup && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name (auto-filled)</Label>
                <Input
                  id="groupName"
                  placeholder="Auto-populated from Roblox"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={fetchingGroup}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Known exploiter group, Harassment group..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
              />
            </div>
            <Button type="submit" className="bg-secondary hover:bg-secondary/80" disabled={loading || fetchingGroup}>
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
