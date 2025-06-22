'use client';

import { Auth } from '@supabase/auth-ui-react';
import { createBrowserClient, authUiConfig } from '@eq-ex/shared';
import { AuthCard } from '@eq-ex/ui/components/auth-card';

export default function ResetPasswordPage() {
  const supabase = createBrowserClient();

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your email to receive a password reset link"
    >
      <Auth
        supabaseClient={supabase}
        appearance={authUiConfig}
        redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`}
        showLinks={true}
        view="forgotten_password"
        theme="dark"
      />
    </AuthCard>
  );
} 