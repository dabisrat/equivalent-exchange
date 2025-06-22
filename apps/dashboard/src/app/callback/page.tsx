'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@eq-ex/shared';

export default function CallbackPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_callback_failed');
          return;
        }

        if (data.session) {
          // Successful authentication, redirect to dashboard
          router.push('/dashboard');
        } else {
          // No session found, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=unknown_error');
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Completing authentication...
        </p>
      </div>
    </div>
  );
} 