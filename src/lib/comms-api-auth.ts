import { createClient } from '@/utils/supabase/server';

export async function requireCommsApiUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase: null, user: null, error: 'Not authenticated.' as const };
  }

  return { supabase, user, error: null };
}
