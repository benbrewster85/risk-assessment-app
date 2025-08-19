import { createClient } from "@/lib/supabase/client";


export async function getUserProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("No user is logged in.");
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, teams(*)') // Selects the user's profile and their related team info
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
}