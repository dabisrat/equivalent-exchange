'use server';
import { createServerClient } from '@eq-ex/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getUser() {
  const { data, error } = await createServerClient(cookies()).auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signOut() {
  const { error } = await createServerClient(cookies()).auth.signOut();

  if (error) {
    console.error(error);
  }
  return redirect('/login');
} 