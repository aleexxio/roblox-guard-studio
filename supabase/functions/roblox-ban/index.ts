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
  duration?: string; // e.g. "1h", "24h", "7d", "30d", "permanent"
  notes?: string;
}

function durationToSeconds(duration: string): number | null {
  switch (duration) {
    case '1h': return 3600;
    case '24h': return 86400;
    case '7d': return 604800;
    case '30d': return 2592000;
    case 'permanent': return null; // permanent
    default: return null;
  }
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
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: BanRequest = await req.json();
    const { action, roblox_id, reason, duration, notes } = body;

    if (!action || !roblox_id) {
      return new Response(JSON.stringify({ error: 'Missing action or roblox_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/user-restrictions/${roblox_id}`;

    if (action === 'ban') {
      const durationSeconds = durationToSeconds(duration || 'permanent');
      
      const restrictionPayload: any = {
        gameJoinRestriction: {
          active: true,
          displayReason: reason || 'You have been banned.',
          privateReason: notes || reason || 'Banned via moderation panel.',
        },
      };

      // If not permanent, set duration
      if (durationSeconds !== null) {
        restrictionPayload.gameJoinRestriction.duration = `${durationSeconds}s`;
      }

      const updateMaskFields = ['gameJoinRestriction.active', 'gameJoinRestriction.displayReason', 'gameJoinRestriction.privateReason'];
      if (durationSeconds !== null) {
        updateMaskFields.push('gameJoinRestriction.duration');
      }
      const apiUrl = `${baseUrl}?updateMask=${updateMaskFields.join(',')}`;

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
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Roblox API error: ${response.status}`,
          details: errorText,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log('Roblox ban success:', JSON.stringify(data));

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unban') {
      const restrictionPayload = {
        gameJoinRestriction: {
          active: false,
        },
      };

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
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Roblox API error: ${response.status}`,
          details: errorText,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log('Roblox unban success:', JSON.stringify(data));

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in roblox-ban function:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
