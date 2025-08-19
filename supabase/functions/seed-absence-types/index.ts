/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
// In supabase/functions/seed-absence-types/index.ts

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
    const teamRecord = payload.record; // The new row from the 'teams' table
    const teamId = teamRecord.id;

    if (!teamId) {
      throw new Error("Team ID is missing in the payload.");
    }

    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('https://plsypgvutyipmdqyphly.supabase.co') ?? '',
      Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsc3lwZ3Z1dHlpcG1kcXlwaGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkwMzYzMCwiZXhwIjoyMDY1NDc5NjMwfQ.-_dbm_psQf2Z34jqnPIGvLOcFPNeFyme11m8HFsvxXE') ?? ''
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
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});