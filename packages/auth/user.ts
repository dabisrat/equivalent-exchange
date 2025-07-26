'use server';
import { createClient as createServerClient } from '@eq-ex/shared/server';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User> {
  const client = await createServerClient()
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signOut(redirectTo = '') {
  const client = await createServerClient()
  const { error } = await client.auth.signOut();

  if (error) {
    console.error(error);
  }

  if (redirectTo) {
    return redirect(redirectTo);
  }
}