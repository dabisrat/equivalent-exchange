import { createClient } from '@eq-ex/shared/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const redirectTo = requestUrl.searchParams.get('redirectTo')

    if (code) {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        try {
            const { error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('Auth callback error:', error)
                // Redirect to login with error
                return NextResponse.redirect(
                    new URL('/login?error=auth_callback_error', request.url)
                )
            }

            // Successful authentication - redirect to intended destination
            const destination = redirectTo && redirectTo.startsWith('/')
                ? redirectTo
                : '/'

            return NextResponse.redirect(new URL(destination, request.url))
        } catch (error) {
            console.error('Unexpected error during auth callback:', error)
            return NextResponse.redirect(
                new URL('/login?error=unexpected_error', request.url)
            )
        }
    }

    // No code parameter - redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
}
