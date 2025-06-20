import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
    try {
        const { inviteeEmail, role, teamId } = await request.json();
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const resend = new Resend(process.env.RESEND_API_KEY!);

        const { error: inviteError } = await supabaseAdmin.from('invites').insert({ email: inviteeEmail, role, token: uuidv4(), team_id: teamId });
        if (inviteError) {
            if (inviteError.code === '23505') { throw new Error('This email address has already been invited.'); }
            throw inviteError;
        }

        const signupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`;
        await resend.emails.send({
            from: 'Onboarding <onboarding@resend.dev>',
            to: [inviteeEmail],
            subject: 'You have been invited to join Zubete!',
            html: `<p>You have been invited to join a team on Zubete. <a href="${signupUrl}">Click here to sign up</a> and accept your invitation.</p>`
        });

        return NextResponse.json({ success: true, message: 'Invite email sent successfully.' });
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}