import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ROBLOX_API_KEY = Deno.env.get('ROBLOX_OPEN_CLOUD_API_KEY')!;
const UNIVERSE_ID = '8619092221';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BanRequest {
  action: 'ban' | 'unban';
  roblox_id: string;
  reason?: string;
  duration?: string;
  notes?: string;
}

function durationToSeconds(duration: string): number | null {
  switch (duration) {
    case '1h': return 3600;
    case '24h': return 86400;
    case '7d': return 604800;
    case '30d': return 2592000;
    case 'permanent': return null;
    default: return null;
  }
}

function respond(success: boolean, payload: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ success, ...payload }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return respond(false, { error: 'Unauthorized' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return respond(false, { error: 'Unauthorized' });
  }

  try {
    const body: BanRequest = await req.json();
    const { action, roblox_id, reason, duration, notes } = body;

    if (!action || !roblox_id) {
      return respond(false, { error: 'Missing action or roblox_id' });
    }

    const baseUrl = `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/user-restrictions/${roblox_id}`;

    if (action === 'ban') {
      const durationSeconds = durationToSeconds(duration || 'permanent');
      
      // Roblox v2 API uses snake_case in both body and updateMask
      const restrictionPayload: any = {
        game_join_restriction: {
          active: true,
          display_reason: `Reason: ${reason || 'You have been banned.'}`,
          private_reason: notes || reason || 'Banned via moderation panel.',
        },
      };

      if (durationSeconds !== null) {
        restrictionPayload.game_join_restriction.duration = `${durationSeconds}s`;
      }

      const updateMaskFields = [
        'game_join_restriction.active',
        'game_join_restriction.display_reason',
        'game_join_restriction.private_reason',
      ];
      if (durationSeconds !== null) {
        updateMaskFields.push('game_join_restriction.duration');
      }
      const apiUrl = `${baseUrl}?updateMask=${updateMaskFields.join(',')}`;

      console.log('Calling Roblox ban API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'x-api-key': ROBLOX_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restrictionPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Roblox ban API error:', response.status, errorText);
        return respond(false, { 
          error: `Roblox API error: ${response.status}`,
          details: errorText,
        });
      }

      const data = await response.json();
      console.log('Roblox ban success:', JSON.stringify(data));
      return respond(true, { data });
    }

    if (action === 'unban') {
      const restrictionPayload = {
        game_join_restriction: {
          active: false,
        },
      };

      const apiUrl = `${baseUrl}?updateMask=game_join_restriction.active`;

      console.log('Calling Roblox unban API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'x-api-key': ROBLOX_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restrictionPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Roblox unban API error:', response.status, errorText);
        return respond(false, { 
          error: `Roblox API error: ${response.status}`,
          details: errorText,
        });
      }

      const data = await response.json();
      console.log('Roblox unban success:', JSON.stringify(data));
      return respond(true, { data });
    }

    return respond(false, { error: 'Invalid action' });

  } catch (error) {
    console.error('Error in roblox-ban function:', error);
    return respond(false, { error: `Internal error: ${error.message}` });
  }
});
