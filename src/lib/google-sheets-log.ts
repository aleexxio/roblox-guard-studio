import { supabase } from "@/integrations/supabase/client";

interface BanLogPayload {
  username: string;
  roblox_id: string;
  duration: string;
  reason: string;
}

export async function logBanToSheets(payload: BanLogPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('google-sheets-log', {
      body: {
        action: 'log_ban',
        username: payload.username,
        roblox_id: payload.roblox_id,
        duration: payload.duration,
        reason: payload.reason,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }),
      },
    });

    if (error) {
      console.error('Sheets log error:', error);
      return false;
    }

    return data?.success ?? false;
  } catch (error) {
    console.error('Sheets log error:', error);
    return false;
  }
}

export async function logUnbanToSheets(roblox_id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('google-sheets-log', {
      body: {
        action: 'update_unban',
        roblox_id,
      },
    });

    if (error) {
      console.error('Sheets unban log error:', error);
      return false;
    }

    return data?.success ?? false;
  } catch (error) {
    console.error('Sheets unban log error:', error);
    return false;
  }
}
