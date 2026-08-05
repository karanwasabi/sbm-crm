'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  // Local scope only — do not revoke refresh tokens for the mobile app / other products.
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/login');
}
