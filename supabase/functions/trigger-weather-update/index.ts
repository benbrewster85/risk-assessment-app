import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is a protected function, so we need to check for a secret
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const vercelApiUrl = Deno.env.get('VERCEL_CRON_URL')!
    const cronSecret = Deno.env.get('CRON_SECRET')!
    
    // Call your Vercel API endpoint
    const vercelResponse = await fetch(vercelApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`
      }
    })

    const responseData = await vercelResponse.json()
    const responseStatus = vercelResponse.status

    // Log the result to your database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabaseAdmin.from('cron_job_logs').insert({
      job_name: 'edge-function-trigger',
      response_status_code: responseStatus,
      response_body: responseData,
    })

    return new Response(JSON.stringify({ message: 'Vercel function triggered and log recorded.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})