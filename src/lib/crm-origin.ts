import { headers } from 'next/headers';

export async function getCrmInviteRedirectURL(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  if (!host) {
    throw new Error('Could not determine CRM host for staff invite.');
  }

  const proto = headerList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}/reset-password`;
}
