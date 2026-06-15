import { LeadIntakeView } from '@/components/views/lead-intake-view';
import { fetchCountries } from '@/utils/api';
import type { Country } from '@/types/reference';

export default async function LeadsPage() {
  let countries: Country[] = [];
  try {
    countries = await fetchCountries();
  } catch {
    countries = [];
  }

  return <LeadIntakeView countries={countries} />;
}
