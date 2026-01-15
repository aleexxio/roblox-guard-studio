import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISCORD_BAN_WEBHOOK = Deno.env.get('DISCORD_BAN_WEBHOOK');
const DISCORD_WARNING_WEBHOOK = Deno.env.get('DISCORD_WARNING_WEBHOOK');
const DISCORD_UNBAN_WEBHOOK = Deno.env.get('DISCORD_UNBAN_WEBHOOK');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Color in decimal (B17F37 = 11632439)
const EMBED_COLOR = 11632439;

interface WebhookPayload {
  type: 'ban' | 'warning' | 'unban';
  roblox_id: string;
  username: string;
  reason: string;
  notes?: string;
  duration?: string;
  moderator_username: string;
}

async function sendDiscordWebhook(webhookUrl: string, embed: any): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.error('Discord webhook error:', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authorization
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verify the user's session
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { type, roblox_id, username, reason, notes, duration, moderator_username } = payload;

    if (!type || !roblox_id || !username || !reason || !moderator_username) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateStr = formatDate();
    const profileUrl = `https://www.roblox.com/users/${roblox_id}/profile`;
    const notesText = notes || 'No additional notes';

    let webhookUrl: string | undefined;
    let embed: any;

    switch (type) {
      case 'ban':
        webhookUrl = DISCORD_BAN_WEBHOOK;
        embed = {
          title: 'Ban Log',
          description: `**Username:** [${username}:${roblox_id}](${profileUrl})\n**Date:** ${dateStr}\n**Notes:** ${notesText}\n\n**Reason:**\n\`\`\`${reason}\`\`\``,
          color: EMBED_COLOR,
          footer: {
            text: `Duration: ${duration || 'Permanent'} | Banned by ${moderator_username}`,
          },
        };
        break;

      case 'warning':
        webhookUrl = DISCORD_WARNING_WEBHOOK;
        embed = {
          title: 'Warning Log',
          description: `**Username:** [${username}:${roblox_id}](${profileUrl})\n**Date:** ${dateStr}\n**Notes:** ${notesText}\n\n**Reason:**\n\`\`\`${reason}\`\`\``,
          color: EMBED_COLOR,
          footer: {
            text: `Warning issued by ${moderator_username}`,
          },
        };
        break;

      case 'unban':
        webhookUrl = DISCORD_UNBAN_WEBHOOK;
        embed = {
          title: 'Unban Log',
          description: `**Username:** [${username}:${roblox_id}](${profileUrl})\n**Date:** ${dateStr}\n**Notes:** ${notesText}\n\n**Reason:**\n\`\`\`${reason}\`\`\``,
          color: EMBED_COLOR,
          footer: {
            text: `Unbanned by ${moderator_username}`,
          },
        };
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid webhook type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!webhookUrl) {
      console.warn(`No webhook URL configured for type: ${type}`);
      return new Response(JSON.stringify({ success: true, message: 'Webhook URL not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const success = await sendDiscordWebhook(webhookUrl, embed);

    return new Response(JSON.stringify({ success }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in discord-webhook function:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
