"use client";

import { createClient } from "@eq-ex/shared/client";
import { Button } from "@eq-ex/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import { Input } from "@eq-ex/ui/components/input";
import { Label } from "@eq-ex/ui/components/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LuMail } from "react-icons/lu";

export default function MagicLinkForm() {
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMagicLinkLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = searchParams.get("redirectTo") || "/";
      const emailRedirectTo = `${window.location.origin}/auth/confirm?redirectTo=${encodeURIComponent(redirectTo)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
        options: {
          emailRedirectTo,
        },
      });

      if (error) throw error;
      setMagicLinkSent(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Magic link</CardTitle>
          <CardDescription>Sign in with an emailed magic link</CardDescription>
        </CardHeader>
        <CardContent>
          {magicLinkSent ? (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                Magic link sent! Check your email and click the link to sign in.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setMagicLinkSent(false);
                  setMagicLinkEmail("");
                }}
              >
                Send another link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkLogin}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={magicLinkEmail}
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500 p-2 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isMagicLinkLoading}
                >
                  {isMagicLinkLoading ? "Sending..." : "Send magic link"}
                  <LuMail className="mr-2 h-4 w-4" />
                </Button>
                <div className="mt-4 text-center text-sm">
                  Want to use a different sign in option?{" "}
                  <Link
                    href={{
                      pathname: "/auth/login",
                      query: {
                        redirectTo: searchParams.get("redirectTo") ?? "",
                      },
                    }}
                    className="underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
