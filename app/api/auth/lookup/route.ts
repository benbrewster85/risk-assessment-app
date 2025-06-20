import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        if (!email) { return NextResponse.json({ error: 'Email is required' }, { status: 400 }); }

        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        const { data: userId, error: rpcError } = await supabaseAdmin.rpc('lookup_user_by_email', { p_email: email });
        if (rpcError) throw rpcError;
        if (userId) { return NextResponse.json({ status: 'USER_EXISTS' }); }

        const { data: inviteData, error: inviteError } = await supabaseAdmin.from('invites').select('id').eq('email', email).eq('status', 'pending').maybeSingle();
        if (inviteError) throw inviteError;
        if (inviteData) { return NextResponse.json({ status: 'INVITE_PENDING' }); }

        return NextResponse.json({ status: 'NOT_FOUND' });
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}