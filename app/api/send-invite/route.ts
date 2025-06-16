import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
    try {
        const { inviteeEmail, role, teamId } = await request.json();

        // Environment variable checks
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
            throw new Error('Missing Supabase or Resend environment variables');
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Check if a user with this email already exists in the system
        const { data: existing_user_id, error: rpcError } = await supabaseAdmin
            .rpc('get_user_id_by_email', { p_email: inviteeEmail });

        if (rpcError) throw rpcError;

        if (existing_user_id) {
            // If they exist, check if they are already on this specific team
            const { data: existingProfile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('id', existing_user_id)
                .eq('team_id', teamId)
                .maybeSingle();

            if (profileError) throw profileError;

            if (existingProfile) {
                throw new Error('This user is already a member of your team.');
            }
        }
        
        // Create the invite record in our database
        const token = uuidv4();
        const { error: inviteError } = await supabaseAdmin
            .from('invites')
            .insert({ email: inviteeEmail, role, token, team_id: teamId });

        if (inviteError) {
            if (inviteError.code === '23505') { // Unique constraint violation
                throw new Error('This email address has already been invited.');
            }
            throw inviteError;
        }

        // Send the actual email via Resend
        const resend = new Resend(resendApiKey);
        const signupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?view=sign_up`;

        const { data, error: emailError } = await resend.emails.send({
            from: 'Onboarding <onboarding@resend.dev>',
            to: [inviteeEmail],
            subject: 'You have been invited to join the Risk Assessment Platform!',
            html: `
                <h1>You're Invited!</h1>
                <p>You have been invited to join a team.</p>
                <p>Please <a href="${signupUrl}" target="_blank">click here to sign up</a> using this email address to accept your invitation.</p>
            `
        });

        if (emailError) {
            console.error({ emailError });
            throw new Error('Invite was created, but failed to send the email.');
        }

        return NextResponse.json({ success: true, message: 'Invite email sent successfully.' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}