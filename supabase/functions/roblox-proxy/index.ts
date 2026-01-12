import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const value = url.searchParams.get('value');

    console.log(`Roblox proxy called - Action: ${action}, Value: ${value}`);

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
