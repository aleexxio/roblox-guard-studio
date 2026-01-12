import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Infinity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PromoCodes() {
  const [code, setCode] = useState("");
  const [reward, setReward] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch promo codes",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      // If max_uses is empty or 0, set a very high number (effectively infinite)
      const maxUsesValue = maxUses.trim() ? parseInt(maxUses) : 999999999;
      
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code,
          reward,
          max_uses: maxUsesValue,
          created_by: sessionData.session?.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Promo Code Created",
        description: `Code "${code}" has been created.`,
      });
      
      setCode("");
      setReward("");
      setMaxUses("");
      fetchCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Promo Code Deleted",
      });
      fetchCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive",
      });
    }
  };

  const formatMaxUses = (value: number) => {
    // Display as infinity if >= 999999999
    if (value >= 999999999) {
      return <Infinity className="h-4 w-4 inline" />;
    }
    return value.toLocaleString();
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., SUMMER2024"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward">Reward *</Label>
                <Input
                  id="reward"
                  placeholder="e.g., 500 Money"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (leave empty for unlimited)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="bg-secondary hover:bg-secondary/80" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Code"}
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
              {codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No promo codes yet
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="font-mono font-bold text-primary">{item.code}</TableCell>
                    <TableCell>{item.reward}</TableCell>
                    <TableCell>{item.uses?.toLocaleString() || 0}</TableCell>
                    <TableCell>{formatMaxUses(item.max_uses)}</TableCell>
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
