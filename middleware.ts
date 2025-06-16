import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // CORRECTED: This line now correctly has only two arguments.
                    req.cookies.set(name, value)
                    res.cookies.set(name, value, options)
                },
                remove(name: string, options: CookieOptions) {
                    req.cookies.set(name, '')
                    res.cookies.set(name, '', options)
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user && req.nextUrl.pathname.startsWith('/dashboard')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', user.id)
            .single()
        
        if (!profile?.first_name && req.nextUrl.pathname !== '/dashboard/complete-profile') {
            return NextResponse.redirect(new URL('/dashboard/complete-profile', req.url))
        }

        if (profile?.first_name && req.nextUrl.pathname === '/dashboard/complete-profile') {
             return NextResponse.redirect(new URL('/dashboard', req.url))
        }
    }

    return res
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|login|auth).*)',
    ],
}