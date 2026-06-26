import { redirect } from 'next/navigation';
import { SETTINGS_PROFILE_HREF } from '@/lib/navigation';

export default function ProfilePage() {
  redirect(SETTINGS_PROFILE_HREF);
}
