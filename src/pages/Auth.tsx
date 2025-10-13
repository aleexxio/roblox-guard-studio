import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/mod-panel-logo.png";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Sync Discord roles
        setTimeout(async () => {
          try {
            const { data, error } = await supabase.functions.invoke('sync-discord-roles', {
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            });

            if (error) throw error;

            if (data?.role) {
              toast({
                title: "Welcome!",
                description: `Logged in as ${data.role}`,
              });
              navigate("/");
            } else {
              throw new Error('No role assigned');
            }
          } catch (error: any) {
            console.error('Error syncing Discord roles:', error);
            await supabase.auth.signOut();
            toast({
              title: "Access Denied",
              description: "You need moderator or admin role in the Discord server",
              variant: "destructive",
            });
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const signInWithDiscord = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'identify guilds guilds.members.read',
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Discord:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Discord",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex justify-center">
          <img 
            src={logo} 
            alt="PRC Admin Panel" 
            className="w-32 h-32 object-contain"
          />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Sign in with Discord to continue</p>
        </div>

        <Button
          onClick={signInWithDiscord}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? "Connecting..." : "Sign in with Discord"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          You must have moderator or admin role in the Discord server
        </p>
      </Card>
    </div>
  );
}
