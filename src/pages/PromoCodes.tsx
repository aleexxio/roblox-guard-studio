import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

export default function PromoCodes() {
  const [code, setCode] = useState("");
  const [reward, setReward] = useState("");
  const [codes, setCodes] = useState([
    { id: 1, code: "WELCOME2024", reward: "1000 Coins", uses: 45, maxUses: 100 },
    { id: 2, code: "SUMMER50", reward: "500 Coins", uses: 23, maxUses: 50 },
  ]);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Replace with actual API call
    const newCode = {
      id: codes.length + 1,
      code,
      reward,
      uses: 0,
      maxUses: 100,
    };
    
    setCodes([...codes, newCode]);
    
    toast({
      title: "Promo Code Created",
      description: `Code "${code}" has been created.`,
    });
    
    setCode("");
    setReward("");
  };

  const handleDelete = (id: number) => {
    setCodes(codes.filter(c => c.id !== id));
    toast({
      title: "Promo Code Deleted",
      variant: "destructive",
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Promo Codes</h1>
        <p className="text-muted-foreground">Create and manage promotional codes</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Create New Code</CardTitle>
          <CardDescription>Add a new promotional code</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., SUMMER2024"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward">Reward</Label>
                <Input
                  id="reward"
                  placeholder="e.g., 500 Coins"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Active Codes</CardTitle>
          <CardDescription>Manage existing promotional codes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Code</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Max Uses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="font-mono font-bold text-primary">{item.code}</TableCell>
                  <TableCell>{item.reward}</TableCell>
                  <TableCell>{item.uses}</TableCell>
                  <TableCell>{item.maxUses}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
