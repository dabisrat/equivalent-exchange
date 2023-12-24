"use client";
import { Auth } from "@supabase/auth-ui-react";
import { supabaseClient } from "@PNN/libs/supabaseClient";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function Authentication() {
  return (
    <Auth supabaseClient={supabaseClient} appearance={{ theme: ThemeSupa }} />
  );
}
