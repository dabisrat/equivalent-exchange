'use server';
import { createServerClient } from '@eq-ex/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User> {
  const { data, error } = await createServerClient(cookies()).auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signOut(redirectTo = '') {
  const { error } = await createServerClient(cookies()).auth.signOut();

  if (error) {
    console.error(error);
  }

  if (redirectTo) {
    return redirect(redirectTo);
  }
}