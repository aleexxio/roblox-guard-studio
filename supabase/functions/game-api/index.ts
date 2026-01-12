import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const GAME_API_KEY = Deno.env.get('GAME_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Tester Roblox IDs that can skip appeal timer
const TESTER_ROBLOX_IDS = [
  '2487341672', // aleexxio
];

// In-memory rate limiting (resets on cold start)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = requestCounts.get(key) || { count: 0, resetAt: now + windowMs };
  
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  
  record.count++;
  requestCounts.set(key, record);
  
  return record.count <= maxRequests;
}

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute

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

    // Rate limit key based on action and roblox_id
    const rateLimitKey = `${action}:${robloxId || 'global'}`;

    // Check if player is banned
    if (action === 'check_ban') {
      // Rate limit: 30 requests per minute per roblox_id
      if (!checkRateLimit(rateLimitKey, 30, 60000)) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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

        // Calculate appeal timer (time until appealable_at)
        let appealTimer = null;
        let canAppeal = false;
        if (ban.appealable_at) {
          const appealableDate = new Date(ban.appealable_at);
          const now = new Date();
          if (now >= appealableDate) {
            canAppeal = true;
          } else {
            // Calculate remaining time in seconds
            appealTimer = Math.floor((appealableDate.getTime() - now.getTime()) / 1000);
          }
        }

        return new Response(JSON.stringify({ 
          banned: true,
          ban_id: ban.id,
          reason: ban.reason,
          duration: ban.duration,
          expires_at: ban.expires_at,
          banned_at: ban.banned_at,
          appealable_at: ban.appealable_at,
          appeal_timer_seconds: appealTimer,
          can_appeal: canAppeal
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
      // Rate limit: 20 requests per minute per roblox_id
      if (!checkRateLimit(rateLimitKey, 20, 60000)) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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
      // Rate limit: 30 requests per minute per roblox_id
      if (!checkRateLimit(rateLimitKey, 30, 60000)) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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
      // Rate limit: 10 requests per minute per roblox_id
      if (!checkRateLimit(rateLimitKey, 10, 60000)) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const { roblox_id, username, money, xp, playtime_hours, dev_products, gamepasses } = body;

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
          money: money ?? 20000,
          xp: xp || 0,
          playtime_hours: playtime_hours || 0,
          dev_products: dev_products || [],
          gamepasses: gamepasses || [],
          last_seen: new Date().toISOString(),
        }, {
          onConflict: 'roblox_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating player:', error);
        return new Response(JSON.stringify({ error: 'An error occurred. Please try again later.' }), {
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

      // Rate limit: 10 redemption attempts per minute per roblox_id
      const redeemKey = `redeem_code:${roblox_id}`;
      if (!checkRateLimit(redeemKey, 10, 60000)) {
        return new Response(JSON.stringify({ error: 'Too many redemption attempts. Please try again later.' }), {
          status: 429,
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

    // Submit ban appeal
    if (action === 'submit_appeal' && req.method === 'POST') {
      const body = await req.json();
      const { ban_id, roblox_id, username, question1, question2, question3 } = body;

      if (!ban_id || !roblox_id || !username || !question1 || !question2 || !question3) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Rate limit: 5 appeal submissions per hour per roblox_id
      const appealKey = `submit_appeal:${roblox_id}`;
      if (!checkRateLimit(appealKey, 5, 3600000)) {
        return new Response(JSON.stringify({ error: 'Too many appeal attempts. Please try again in an hour.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify the ban exists and player can appeal
      const { data: ban } = await supabase
        .from('bans')
        .select('*, players!inner(id)')
        .eq('id', ban_id)
        .eq('is_active', true)
        .single();

      if (!ban) {
        return new Response(JSON.stringify({ error: 'Ban not found or not active' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if appeal period has started
      if (ban.appealable_at && new Date(ban.appealable_at) > new Date()) {
        return new Response(JSON.stringify({ error: 'Appeal period has not started yet' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if already has a pending appeal
      const { data: existingAppeal } = await supabase
        .from('ban_appeals')
        .select('id')
        .eq('ban_id', ban_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingAppeal) {
        return new Response(JSON.stringify({ error: 'You already have a pending appeal' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create the appeal
      const { error: appealError } = await supabase
        .from('ban_appeals')
        .insert({
          ban_id,
          player_id: ban.players.id,
          roblox_id,
          username,
          question1,
          question2,
          question3,
        });

      if (appealError) {
        console.error('Error creating appeal:', appealError);
        return new Response(JSON.stringify({ error: 'An error occurred. Please try again later.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Appeal submitted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip appeal timer (testers only)
    if (action === 'skip_appeal_timer' && req.method === 'POST') {
      // Rate limit: 5 requests per minute per roblox_id
      if (!checkRateLimit(rateLimitKey, 5, 60000)) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const { roblox_id } = body;

      if (!roblox_id) {
        return new Response(JSON.stringify({ error: 'Missing roblox_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user is a tester
      if (!TESTER_ROBLOX_IDS.includes(roblox_id.toString())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get player and active ban
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('roblox_id', roblox_id)
        .single();

      if (!player) {
        return new Response(JSON.stringify({ error: 'Player not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: ban, error: banError } = await supabase
        .from('bans')
        .update({ appealable_at: new Date().toISOString() })
        .eq('player_id', player.id)
        .eq('is_active', true)
        .select()
        .single();

      if (banError || !ban) {
        return new Response(JSON.stringify({ error: 'No active ban found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Appeal timer skipped for tester: ${roblox_id}`);
      return new Response(JSON.stringify({ success: true, message: 'Appeal timer skipped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all banned group IDs
    if (action === 'get_banned_groups') {
      // Rate limit: 30 requests per minute globally
      if (!checkRateLimit('get_banned_groups:global', 30, 60000)) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: groups, error } = await supabase
        .from('group_bans')
        .select('group_id')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching banned groups:', error);
        return new Response(JSON.stringify({ error: 'An error occurred. Please try again later.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const groupIds = (groups || []).map(g => parseInt(g.group_id, 10)).filter(id => !isNaN(id));
      
      return new Response(JSON.stringify({ 
        success: true, 
        banned_groups: groupIds 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active promo codes
    if (action === 'get_promo_codes') {
      // Rate limit: 30 requests per minute globally
      if (!checkRateLimit('get_promo_codes:global', 30, 60000)) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: codes, error } = await supabase
        .from('promo_codes')
        .select('code, reward, uses, max_uses')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching promo codes:', error);
        return new Response(JSON.stringify({ error: 'An error occurred. Please try again later.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        promo_codes: codes || [] 
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
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again later.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
