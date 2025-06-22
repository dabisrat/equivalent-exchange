'use client';

import { Auth } from '@supabase/auth-ui-react';
import { createBrowserClient, authUiConfig } from '@eq-ex/shared';
import { AuthCard } from '@eq-ex/ui/components/auth-card';

export default function LoginPage() {
  const supabase = createBrowserClient();

  return (
    <AuthCard
      title="Dashboard"
      description="Sign in or create an account to access your dashboard"
    >
      <Auth
        supabaseClient={supabase}
        appearance={authUiConfig}
        providers={['google']}
        redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`}
        showLinks={true}
        view="sign_in"
        theme="dark"
      />
    </AuthCard>
  );
} 