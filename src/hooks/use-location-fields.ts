'use client';

import { useEffect, useState } from 'react';
import { loadCountryCities } from '@/app/(crm)/profile/actions';
import type { Country, CountryCity } from '@/types/reference';

type UseLocationFieldsOptions = {
  countries: Country[];
  countryCode: string;
  setCountryCode: (code: string) => void;
  setTimezoneId: (id: string) => void;
};

export function useLocationFields({ countries, countryCode, setCountryCode, setTimezoneId }: UseLocationFieldsOptions) {
  const [citySuggestions, setCitySuggestions] = useState<CountryCity[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (!countryCode) {
      setCitySuggestions([]);
      return;
    }

    let cancelled = false;
    setLoadingCities(true);
    loadCountryCities(countryCode)
      .then((rows) => {
        if (!cancelled) setCitySuggestions(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const country = countries.find((c) => c.iso_code === code);
    if (country?.default_timezone_id) {
      setTimezoneId(country.default_timezone_id);
    }
  };

  const handleCitySuggestion = (entry: CountryCity) => {
    if (entry.timezone_id) {
      setTimezoneId(entry.timezone_id);
      return;
    }
    const country = countries.find((c) => c.iso_code === countryCode);
    if (country?.default_timezone_id) {
      setTimezoneId(country.default_timezone_id);
    }
  };

  return {
    citySuggestions,
    loadingCities,
    handleCountryChange,
    handleCitySuggestion,
  };
}
