// 'use client';

// import { useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { useAuth } from './auth-provider';
// // TODO: do we need this?
// export function useAuthRedirect() {
//     const { user, loading } = useAuth();
//     const router = useRouter();
//     const searchParams = useSearchParams();

//     const redirectTo = searchParams.get('redirectTo') || '/';

//     useEffect(() => {
//         if (loading) return; // Wait for auth state to load

//         if (user) {
//             // User is authenticated, redirect to intended destination
//             router.replace(redirectTo);
//         }
//     }, [user, loading, redirectTo, router]);

//     return { user, loading, redirectTo };
// }
