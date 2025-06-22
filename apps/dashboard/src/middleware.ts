import { createMiddlewareClient } from "@eq-ex/shared";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareClient(request);

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession();

    // Get the pathname of the request
    const { pathname } = request.nextUrl;

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/reset-password', '/callback'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // If user is not authenticated and trying to access protected route
    if (!session && !isPublicRoute) {
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (session && isPublicRoute) {
      const redirectUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    console.error('Middleware error:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}; 