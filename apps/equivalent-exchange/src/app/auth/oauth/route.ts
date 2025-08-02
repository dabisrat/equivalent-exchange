import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@eq-ex/shared/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    let redirectTo = searchParams.get('redirectTo') ?? '/'
    if (!redirectTo.startsWith('/')) {
        // if "next" is not a relative URL, use the default
        redirectTo = '/'
    }
    
    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const host = request.headers.get('host') // current host including subdomain
            const isLocalEnv = process.env.NODE_ENV === 'development'
            
            if (isLocalEnv) {
                // In development, preserve the subdomain from the host header
                if (host && host.includes('.localhost')) {
                    // Extract subdomain and preserve it
                    const protocol = origin.startsWith('https') ? 'https' : 'http'
                    return NextResponse.redirect(`${protocol}://${host}${redirectTo}`)
                } else {
                    // Fallback to origin if no subdomain
                    return NextResponse.redirect(`${origin}${redirectTo}`)
                }
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
            } else {
                // In production, use host header to preserve subdomain
                if (host) {
                    const protocol = origin.startsWith('https') ? 'https' : 'http'
                    return NextResponse.redirect(`${protocol}://${host}${redirectTo}`)
                } else {
                    return NextResponse.redirect(`${origin}${redirectTo}`)
                }
            }
        } else {
            return NextResponse.redirect(`${origin}/auth/error?error=${error.message}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/error?error=No token hash or type`)
}