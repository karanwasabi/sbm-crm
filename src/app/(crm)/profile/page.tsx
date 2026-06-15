import { ProfileView } from '@/components/profile/profile-view';
import { fetchCountries } from '@/utils/api';

import type { Country } from '@/types/reference';

export default async function ProfilePage() {
  let countries: Country[] = [];
  try {
    countries = await fetchCountries();
  } catch {
    countries = [];
  }

  return <ProfileView countries={countries} />;
}
