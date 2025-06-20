import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { assets: records, teamId } = await request.json();

        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

        const { data: profile } = await supabase.from('profiles').select('team_id, role').eq('id', user.id).single();
        if (profile?.team_id !== teamId || profile?.role !== 'team_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        const formattedRecords = records.map((record: Record<string, string>) => ({
            team_id: teamId,
            system_id: record['System ID'],
            manufacturer: record['Manufacturer'],
            model: record['Model'],
            serial_number: record['Serial Number'],
            status_id: null,
        }));

        const { error } = await supabaseAdmin.from('assets').upsert(formattedRecords, { onConflict: 'system_id' });
        if (error) throw error;

        return NextResponse.json({ success: true, message: `${records.length} assets processed.` });

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}