import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, old_email, new_username, new_password, username, password, role } = await req.json();

    if (action === 'update') {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;
      const user = users.find(u => u.email === old_email);
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: `${new_username}@modpanel.local`,
        password: new_password,
        email_confirm: true,
      });
      if (updateError) throw updateError;
      await supabaseAdmin.from('user_roles').update({ discord_username: new_username }).eq('user_id', user.id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create') {
      const email = `${username}@modpanel.local`;
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (createError) throw createError;
      await supabaseAdmin.from('user_roles').insert({
        user_id: newUser.user.id, role, discord_username: username,
      });
      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
