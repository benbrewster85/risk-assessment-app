
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// The default items we want to create for every new team.
const DEFAULT_ABSENCE_TYPES = [
  { name: 'Annual Leave', color: 'bg-cyan-500' },
  { name: 'Medical Appointment', color: 'bg-amber-500' },
  { name: 'Training Course', color: 'bg-sky-500' },
];

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const teamRecord = payload.record;
    const teamId = teamRecord.id;

    if (!teamId) {
      throw new Error("Team ID is missing in the payload.");
    }

    // Create a Supabase client using the securely stored environment variables
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Prepare the new rows, adding the new team_id to each
    const absenceTypesToInsert = DEFAULT_ABSENCE_TYPES.map(item => ({
      ...item,
      team_id: teamId,
    }));

    // Insert the new rows into the absence_types table
    const { error } = await supabaseAdmin
      .from('absence_types')
      .insert(absenceTypesToInsert);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: `Successfully seeded absence types for team ${teamId}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return new Response(errorMessage, { status: 500 });
  }
});