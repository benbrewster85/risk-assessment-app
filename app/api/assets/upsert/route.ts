import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const { assets: records, teamId } = await request.json();

    // First, verify the user has permission for this team
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase.from('profiles').select('team_id, role').eq('id', user.id).single();
    if (profile?.team_id !== teamId || profile?.role !== 'team_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Now, create an admin client to perform the upsert
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Clean and transform the data from the CSV to match database columns
    const formattedRecords = records.map((record: any) => ({
        team_id: teamId,
        system_id: record['System ID'],
        manufacturer: record['Manufacturer'],
        model: record['Model'],
        serial_number: record['Serial Number'],
        status: record['Status'] || 'In Stores',
    }));

    try {
        const { data, error } = await supabaseAdmin
            .from('assets')
            .upsert(formattedRecords, {
                onConflict: 'system_id', // This is the unique key to match records on
            });

        if (error) throw error;

        return NextResponse.json({ success: true, message: `${records.length} assets processed.` });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}