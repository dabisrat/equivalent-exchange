"use client";

import { useState } from 'react';
import { useAuth } from "@eq-ex/auth";
import { useAuthRedirect } from "@eq-ex/auth/use-auth-redirect";
import { Auth } from "@supabase/auth-ui-react";
import { authUiConfig } from "@eq-ex/shared";
import { AuthCard } from "@eq-ex/ui/components/auth-card";

const getUrl = () => {
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ??
        process?.env?.NEXT_PUBLIC_VERCEL_URL ??
        "http://localhost:3000/";
    url = url.includes("http") ? url : `https://${url}`;
    url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
    return url;
};

export function LoginForm() {
    const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
    const { supabase } = useAuth();
    const { redirectTo } = useAuthRedirect();

    const getCallbackUrl = (mode: string) => {
        const baseCallback = `${getUrl()}callback`;

        if (mode === 'reset') {
            return `${baseCallback}?type=password-reset${redirectTo !== '/' ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
        }

        return `${baseCallback}${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
    };

    return (
        <AuthCard
            title="Equivalent Exchange"
            description="Sign in or create an account to continue"
        >
            {/* Custom tabs */}
            <div className="flex gap-4 mb-4 border-b">
                <button
                    onClick={() => setAuthMode('signin')}
                    className={`pb-2 px-1 ${authMode === 'signin' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                >
                    Sign In
                </button>
                <button
                    onClick={() => setAuthMode('signup')}
                    className={`pb-2 px-1 ${authMode === 'signup' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                >
                    Sign Up
                </button>
                <button
                    onClick={() => setAuthMode('reset')}
                    className={`pb-2 px-1 ${authMode === 'reset' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                >
                    Reset Password
                </button>
            </div>

            {authMode === 'signin' && (
                <Auth
                    view="sign_in"
                    redirectTo={getCallbackUrl('signin')}
                    supabaseClient={supabase}
                    appearance={authUiConfig}
                    socialLayout="horizontal"
                    magicLink
                    otpType="email"
                    providers={["google"]}
                    showLinks={false}
                    queryParams={{ access_type: "offline", prompt: "consent" }}
                />
            )}

            {authMode === 'signup' && (
                <Auth
                    view="sign_up"
                    redirectTo={getCallbackUrl('signup')}
                    supabaseClient={supabase}
                    appearance={authUiConfig}
                    socialLayout="horizontal"
                    magicLink
                    otpType="email"
                    providers={["google"]}
                    showLinks={false}
                    queryParams={{ access_type: "offline", prompt: "consent" }}
                />
            )}

            {authMode === 'reset' && (
                <Auth
                    view="forgotten_password"
                    redirectTo={getCallbackUrl('reset')}
                    supabaseClient={supabase}
                    appearance={authUiConfig}
                    socialLayout="horizontal"
                    magicLink
                    otpType="email"
                    providers={["google"]}
                    showLinks={false}
                    queryParams={{ access_type: "offline", prompt: "consent" }}
                />
            )}
        </AuthCard>
    );
}
