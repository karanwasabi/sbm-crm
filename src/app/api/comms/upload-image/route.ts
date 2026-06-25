import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { EMAIL_ASSETS_BUCKET, getEmailAssetPublicUrl } from '@/lib/email-storage';
import { requireCommsApiUser } from '@/lib/comms-api-auth';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'image';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.length > 0 ? cleaned : 'image';
}

export async function POST(request: Request) {
  const { supabase, error } = await requireCommsApiUser();
  if (!supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported image type.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5MB or smaller.' }, { status: 400 });
  }

  const objectPath = `uploads/${randomUUID()}-${sanitizeFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(EMAIL_ASSETS_BUCKET).upload(objectPath, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({
    url: getEmailAssetPublicUrl(objectPath),
    name: objectPath.split('/').pop() ?? objectPath,
  });
}
