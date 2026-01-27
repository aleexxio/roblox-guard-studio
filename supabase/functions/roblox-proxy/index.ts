import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request - require moderator or admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    // Check if user has moderator or admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['moderator', 'admin'])
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check failed:', roleError);
      return new Response(JSON.stringify({ error: 'Access denied. Moderator or admin role required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const value = url.searchParams.get('value');

    console.log(`Roblox proxy called - Action: ${action}, Value: ${value}, User: ${userId}`);

    if (!action || !value) {
      return new Response(JSON.stringify({ error: 'Missing action or value parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user by username
    if (action === 'username') {
      const response = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernames: [value],
          excludeBannedUsers: false,
        }),
      });

      if (!response.ok) {
        console.error('Roblox API error:', response.status);
        return new Response(JSON.stringify({ error: 'Unable to fetch user data. Please try again later.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        return new Response(JSON.stringify({
          found: true,
          user: {
            id: data.data[0].id,
            name: data.data[0].name,
            displayName: data.data[0].displayName,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user by ID
    if (action === 'id') {
      const response = await fetch(`https://users.roblox.com/v1/users/${value}`);

      if (!response.ok) {
        if (response.status === 404) {
          return new Response(JSON.stringify({ found: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('Roblox API error:', response.status);
        return new Response(JSON.stringify({ error: 'Unable to fetch user data. Please try again later.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      
      return new Response(JSON.stringify({
        found: true,
        user: {
          id: data.id,
          name: data.name,
          displayName: data.displayName,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get group info by ID
    if (action === 'group') {
      const response = await fetch(`https://groups.roblox.com/v1/groups/${value}`);

      if (!response.ok) {
        if (response.status === 404) {
          return new Response(JSON.stringify({ found: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('Roblox Groups API error:', response.status);
        return new Response(JSON.stringify({ error: 'Unable to fetch group data. Please try again later.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      
      return new Response(JSON.stringify({
        found: true,
        group: {
          id: data.id,
          name: data.name,
          description: data.description,
          memberCount: data.memberCount,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in roblox-proxy function:', error);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again later.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
