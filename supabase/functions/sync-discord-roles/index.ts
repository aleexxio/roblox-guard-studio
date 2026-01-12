import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const MODERATOR_ROLE_ID = '1412136245324419152'
const ADMIN_ROLE_ID = '1412131096690430074'

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get Discord provider data from user metadata
    const discordData = user.user_metadata?.provider_id
    const rawUsername = user.user_metadata?.full_name || user.user_metadata?.user_name
    
    // Get Discord roles from the identities
    const discordIdentity = user.identities?.find(id => id.provider === 'discord')
    
    // Validate Discord identity data structure
    if (!discordIdentity?.identity_data?.guilds?.[0]) {
      console.error('Invalid Discord guild data structure')
      return new Response(JSON.stringify({ 
        error: 'Unable to verify Discord roles. Please try again.' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const discordRoles = discordIdentity.identity_data.guilds[0].roles || []

    // Validate roles array - must be array of strings
    if (!Array.isArray(discordRoles) || 
        !discordRoles.every(r => typeof r === 'string' && r.length < 50)) {
      console.error('Invalid Discord role data format')
      return new Response(JSON.stringify({ 
        error: 'Unable to verify Discord roles. Please try again.' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Sanitize and validate username (limit to 100 chars)
    const discordUsername = typeof rawUsername === 'string' 
      ? rawUsername.substring(0, 100).trim() || 'Unknown'
      : 'Unknown'

    // Validate discord_id format (must be numeric string, 10-20 digits)
    const validDiscordId = discordData && typeof discordData === 'string' && /^\d{10,20}$/.test(discordData)
      ? discordData
      : null

    // Determine role based on Discord roles
    let role: 'admin' | 'moderator' | null = null
    if (discordRoles.includes(ADMIN_ROLE_ID)) {
      role = 'admin'
    } else if (discordRoles.includes(MODERATOR_ROLE_ID)) {
      role = 'moderator'
    }

    if (!role) {
      return new Response(
        JSON.stringify({ error: 'User does not have moderator or admin role in Discord' }), 
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Upsert user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: role,
        discord_id: validDiscordId,
        discord_username: discordUsername,
      }, {
        onConflict: 'user_id,role'
      })

    if (roleError) {
      console.error('Error upserting role:', roleError)
      return new Response(JSON.stringify({ error: 'An error occurred. Please try again later.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        role,
        discord_username: discordUsername 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in sync-discord-roles:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again later.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
