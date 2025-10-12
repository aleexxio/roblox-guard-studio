import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus } from "lucide-react";

export default function ManageMods() {
  const [username, setUsername] = useState("");
  const [moderators, setModerators] = useState([
    { id: 1, username: "ModUser123", addedDate: "2024-10-01", permissions: "Full" },
    { id: 2, username: "HelperMod", addedDate: "2024-10-05", permissions: "Limited" },
  ]);
  const { toast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Replace with actual API call
    const newMod = {
      id: moderators.length + 1,
      username,
      addedDate: new Date().toISOString().split('T')[0],
      permissions: "Full",
    };
    
    setModerators([...moderators, newMod]);
    
    toast({
      title: "Moderator Added",
      description: `${username} has been granted moderator permissions.`,
    });
    
    setUsername("");
  };

  const handleRemove = (id: number, username: string) => {
    setModerators(moderators.filter(m => m.id !== id));
    toast({
      title: "Moderator Removed",
      description: `${username} has been removed from moderators.`,
      variant: "destructive",
    });
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
              <div className="flex gap-2">
                <Input
                  id="mod-username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
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
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moderators.map((mod) => (
                <TableRow key={mod.id} className="border-border">
                  <TableCell className="font-medium">{mod.username}</TableCell>
                  <TableCell>{mod.addedDate}</TableCell>
                  <TableCell>
                    <Badge variant={mod.permissions === "Full" ? "default" : "secondary"}>
                      {mod.permissions}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(mod.id, mod.username)}
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
