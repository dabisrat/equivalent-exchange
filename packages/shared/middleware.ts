import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const getSubdomain = (request: NextRequest): string => {
  const host = request.headers.get('x-forwarded-host') || 
               request.headers.get('host') || 
               request.nextUrl.host

  if (!host) return 'www'
  
  // Handle localhost development with .localhost domains
  if (host.includes('.localhost')) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      return parts[0]; // Extract subdomain from acme.localhost:3000
    }
  }
  
  // Handle localhost development with custom domains (.dev, .local etc)
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'www'
  }
  
  // Handle custom local domains like acme.mylocal.dev
  const parts = host.split('.');
  if (parts.length >= 2) {
    return parts[0];
  }
  
  return 'www'
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const subdomain = getSubdomain(request)
  // Add subdomain to headers for app-level access
  supabaseResponse.headers.set('x-subdomain', subdomain);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )


  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()


  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}