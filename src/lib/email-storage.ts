/** Staff-uploaded email images — one bucket per Supabase project (staging + prod). */
export const EMAIL_ASSETS_BUCKET = 'crm-email-assets';

export function getSupabasePublicStorageBase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }
  return url.replace(/\/$/, '');
}

export function getEmailAssetPublicUrl(objectPath: string): string {
  const normalized = objectPath.replace(/^\/+/, '');
  return `${getSupabasePublicStorageBase()}/storage/v1/object/public/${EMAIL_ASSETS_BUCKET}/${normalized}`;
}
