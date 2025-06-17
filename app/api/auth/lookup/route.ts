import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Use our database function to safely check for an existing user
        const { data: userId, error: rpcError } = await supabaseAdmin
            .rpc('lookup_user_by_email', { p_email: email });
        
        if (rpcError) throw rpcError;

        if (userId) {
            // If the user exists, tell the frontend to show the login/password form
            return NextResponse.json({ status: 'USER_EXISTS' });
        }

        // If no user exists, check for a pending invitation
        const { data: inviteData, error: inviteError } = await supabaseAdmin
            .from('invites')
            .select('id')
            .eq('email', email)
            .eq('status', 'pending')
            .maybeSingle();
        
        if (inviteError) throw inviteError;

        if (inviteData) {
            // If an invite exists, tell the frontend to show the full sign-up form
            return NextResponse.json({ status: 'INVITE_PENDING' });
        }

        // If neither a user nor an invite is found
        return NextResponse.json({ status: 'NOT_FOUND' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}