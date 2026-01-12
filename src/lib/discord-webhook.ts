import { supabase } from "@/integrations/supabase/client";

interface WebhookPayload {
  type: 'ban' | 'warning' | 'unban';
  roblox_id: string;
  username: string;
  reason: string;
  notes?: string;
  duration?: string;
  moderator_username: string;
}

export async function sendDiscordWebhook(payload: WebhookPayload): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.access_token) {
      console.error('No session token for webhook');
      return false;
    }

    const { data, error } = await supabase.functions.invoke('discord-webhook', {
      body: payload,
    });

    if (error) {
      console.error('Discord webhook error:', error);
      return false;
    }

    return data?.success ?? false;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
}
