import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Unlock } from "lucide-react";

export default function Unban() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bannedUsers, setBannedUsers] = useState([
    { id: 1, username: "BannedUser1", reason: "Cheating", bannedDate: "2024-10-01", duration: "Permanent" },
    { id: 2, username: "TempBanned", reason: "Toxic behavior", bannedDate: "2024-10-10", duration: "7 Days" },
  ]);
  const { toast } = useToast();

  const handleUnban = (id: number, username: string) => {
    // TODO: Replace with actual API call
    setBannedUsers(bannedUsers.filter(u => u.id !== id));
    
    toast({
      title: "Player Unbanned",
      description: `${username} has been unbanned.`,
    });
  };

  const filteredUsers = bannedUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
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
          <CardDescription>Find and unban players</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Search Username</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search banned players..."
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
                <TableHead>Username</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Banned Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.reason}</TableCell>
                  <TableCell>{user.bannedDate}</TableCell>
                  <TableCell>{user.duration}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleUnban(user.id, user.username)}
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
