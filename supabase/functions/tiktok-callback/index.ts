// Supabase Edge Function: TikTok OAuth Callback
// Deploy: supabase functions deploy tiktok-callback
// This handles the OAuth code exchange server-side (client_secret stays safe)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // user_id encoded here
  const error = url.searchParams.get('error')

  // App URL to redirect back to
  const APP_URL = Deno.env.get('APP_URL') || 'https://lsaha25.github.io/tikflow/'

  if (error) {
    return Response.redirect(`${APP_URL}?tiktok_error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return Response.redirect(`${APP_URL}?tiktok_error=missing_code`)
  }

  const userId = state // we pass user_id as state

  // Set up Supabase admin client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch user's TikTok developer credentials from their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('tiktok_client_key, tiktok_client_secret, tiktok_redirect_uri')
    .eq('id', userId)
    .single()

  if (!profile?.tiktok_client_key || !profile?.tiktok_client_secret) {
    return Response.redirect(`${APP_URL}?tiktok_error=no_credentials`)
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: profile.tiktok_client_key,
      client_secret: profile.tiktok_client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: profile.tiktok_redirect_uri,
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    const errMsg = tokenData.message || tokenData.error || 'token_exchange_failed'
    return Response.redirect(`${APP_URL}?tiktok_error=${encodeURIComponent(errMsg)}`)
  }

  // Fetch user info with the token
  const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username,avatar_url,follower_count', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  })
  const userData = await userRes.json()
  const tikUser = userData.data?.user || {}

  // Upsert into tiktok_accounts
  await supabase.from('tiktok_accounts').upsert({
    user_id: userId,
    tiktok_open_id: tikUser.open_id || tokenData.open_id,
    username: tikUser.username || tikUser.display_name || 'unknown',
    display_name: tikUser.display_name || '',
    avatar_url: tikUser.avatar_url || '',
    followers_count: tikUser.follower_count || 0,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || '',
    token_expires_at: new Date(Date.now() + (tokenData.expires_in || 86400) * 1000).toISOString(),
  }, { onConflict: 'user_id,tiktok_open_id' })

  return Response.redirect(`${APP_URL}?tiktok_connected=1`)
})
