import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const GAME_API_KEY = Deno.env.get('GAME_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify API key
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== GAME_API_KEY) {
    console.log('Invalid or missing API key');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const robloxId = url.searchParams.get('roblox_id');

    console.log(`Game API called - Action: ${action}, Roblox ID: ${robloxId}`);

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if player is banned
    if (action === 'check_ban') {
      if (!robloxId) {
        return new Response(JSON.stringify({ error: 'Missing roblox_id parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // First get the player
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('roblox_id', robloxId)
        .single();

      if (!player) {
        return new Response(JSON.stringify({ 
          banned: false, 
          message: 'Player not found in system' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check for active ban
      const { data: ban } = await supabase
        .from('bans')
        .select('*')
        .eq('player_id', player.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (ban) {
        // Check if ban has expired
        if (ban.expires_at && new Date(ban.expires_at) < new Date()) {
          // Deactivate expired ban
          await supabase
            .from('bans')
            .update({ is_active: false })
            .eq('id', ban.id);

          return new Response(JSON.stringify({ 
            banned: false, 
            message: 'Ban has expired' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          banned: true,
          reason: ban.reason,
          duration: ban.duration,
          expires_at: ban.expires_at,
          banned_at: ban.banned_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ banned: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get player warnings
    if (action === 'get_warnings') {
      if (!robloxId) {
        return new Response(JSON.stringify({ error: 'Missing roblox_id parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('roblox_id', robloxId)
        .single();

      if (!player) {
        return new Response(JSON.stringify({ warnings: [], count: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: warnings } = await supabase
        .from('warnings')
        .select('*')
        .eq('player_id', player.id)
        .order('issued_at', { ascending: false });

      return new Response(JSON.stringify({ 
        warnings: warnings || [], 
        count: warnings?.length || 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get player data
    if (action === 'get_player') {
      if (!robloxId) {
        return new Response(JSON.stringify({ error: 'Missing roblox_id parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('roblox_id', robloxId)
        .single();

      if (!player) {
        return new Response(JSON.stringify({ found: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ found: true, player }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update player data (for syncing from game)
    if (action === 'update_player' && req.method === 'POST') {
      const body = await req.json();
      const { roblox_id, username, level, coins, gems, playtime_hours } = body;

      if (!roblox_id || !username) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Upsert player
      const { data: player, error } = await supabase
        .from('players')
        .upsert({
          roblox_id,
          username,
          level: level || 1,
          coins: coins || 0,
          gems: gems || 0,
          playtime_hours: playtime_hours || 0,
          last_seen: new Date().toISOString(),
        }, {
          onConflict: 'roblox_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating player:', error);
        return new Response(JSON.stringify({ error: 'Failed to update player' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, player }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Redeem promo code
    if (action === 'redeem_code' && req.method === 'POST') {
      const body = await req.json();
      const { code, roblox_id } = body;

      if (!code || !roblox_id) {
        return new Response(JSON.stringify({ error: 'Missing code or roblox_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: promoCode } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!promoCode) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired code' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (promoCode.uses >= promoCode.max_uses) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Code has reached maximum uses' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Increment uses
      await supabase
        .from('promo_codes')
        .update({ uses: promoCode.uses + 1 })
        .eq('id', promoCode.id);

      return new Response(JSON.stringify({ 
        success: true, 
        reward: promoCode.reward 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in game-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
