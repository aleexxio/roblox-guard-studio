import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Appeal {
  id: string;
  roblox_id: string;
  username: string;
  question1: string;
  question2: string;
  question3: string;
  status: string;
  created_at: string;
  ban_id: string;
  bans?: {
    reason: string;
    duration: string;
    banned_at: string;
  };
}

export default function ManageAppeals() {
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appeals, isLoading } = useQuery({
    queryKey: ['ban-appeals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ban_appeals')
        .select(`
          *,
          bans (
            reason,
            duration,
            banned_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Appeal[];
    },
  });

  const updateAppealMutation = useMutation({
    mutationFn: async ({ id, status, unban }: { id: string; status: string; unban?: boolean }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('ban_appeals')
        .update({ 
          status, 
          reviewed_by: sessionData.session?.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // If approved, also unban the player
      if (unban && selectedAppeal) {
        const { error: unbanError } = await supabase
          .from('bans')
          .update({ is_active: false })
          .eq('id', selectedAppeal.ban_id);
        
        if (unbanError) throw unbanError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ban-appeals'] });
      toast({
        title: variables.status === 'approved' ? "Appeal Approved" : "Appeal Denied",
        description: variables.status === 'approved' 
          ? "The player has been unbanned." 
          : "The appeal has been denied.",
      });
      setSelectedAppeal(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appeal",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'denied':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500"><X className="h-3 w-3 mr-1" /> Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">Loading appeals...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manage Appeals</h1>
        <p className="text-muted-foreground">Review and manage player ban appeals</p>
      </div>

      {appeals?.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            No appeals to review at this time.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appeals?.map((appeal) => (
            <Card key={appeal.id} className="border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedAppeal(appeal)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{appeal.username}</CardTitle>
                      <CardDescription>ID: {appeal.roblox_id}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(appeal.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Ban Reason: {appeal.bans?.reason || 'Unknown'}</span>
                  <span>Submitted: {new Date(appeal.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedAppeal} onOpenChange={() => setSelectedAppeal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appeal from {selectedAppeal?.username}</DialogTitle>
            <DialogDescription>
              Roblox ID: {selectedAppeal?.roblox_id} | Submitted: {selectedAppeal && new Date(selectedAppeal.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Ban Details</h4>
              <p><strong>Reason:</strong> {selectedAppeal?.bans?.reason}</p>
              <p><strong>Duration:</strong> {selectedAppeal?.bans?.duration}</p>
              <p><strong>Banned At:</strong> {selectedAppeal?.bans?.banned_at && new Date(selectedAppeal.bans.banned_at).toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">What were you banned for?</h4>
                <p className="p-3 bg-muted/30 rounded-lg">{selectedAppeal?.question1}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">What would you do differently next time?</h4>
                <p className="p-3 bg-muted/30 rounded-lg">{selectedAppeal?.question2}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">What have you learned from this experience?</h4>
                <p className="p-3 bg-muted/30 rounded-lg">{selectedAppeal?.question3}</p>
              </div>
            </div>

            {selectedAppeal?.status === 'pending' && (
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => updateAppealMutation.mutate({ id: selectedAppeal.id, status: 'denied' })}
                  disabled={updateAppealMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" /> Deny Appeal
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateAppealMutation.mutate({ id: selectedAppeal.id, status: 'approved', unban: true })}
                  disabled={updateAppealMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" /> Approve & Unban
                </Button>
              </div>
            )}

            {selectedAppeal?.status !== 'pending' && (
              <div className="text-center py-4">
                {getStatusBadge(selectedAppeal?.status || '')}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}