// /app/auth/actions.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = createClient()

  // This will invalidate the user's session and clear the cookie
  await supabase.auth.signOut()

  // Redirect to the login page after signing out
  return redirect('/login')
}