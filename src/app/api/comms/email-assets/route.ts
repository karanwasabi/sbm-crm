import { NextResponse } from 'next/server';
import { EMAIL_ASSETS_BUCKET, getEmailAssetPublicUrl } from '@/lib/email-storage';
import { requireCommsApiUser } from '@/lib/comms-api-auth';

export async function GET() {
  const { supabase, error } = await requireCommsApiUser();
  if (!supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data, error: listError } = await supabase.storage.from(EMAIL_ASSETS_BUCKET).list('uploads', {
    limit: 200,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const assets = (data ?? [])
    .filter((item) => item.name && !item.name.endsWith('/'))
    .map((item) => {
      const objectPath = `uploads/${item.name}`;
      return {
        src: getEmailAssetPublicUrl(objectPath),
        name: item.name,
        size: item.metadata?.size ?? null,
        updatedAt: item.updated_at ?? item.created_at ?? null,
      };
    });

  return NextResponse.json({ assets });
}
