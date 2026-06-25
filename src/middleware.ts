import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|eot|otf)$).*)'],
};
