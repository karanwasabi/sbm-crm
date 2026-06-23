'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/loading/skeleton';
import type { ComponentProps } from 'react';

function FieldSkeleton() {
  return <Skeleton className="h-10 w-full rounded-xl" />;
}

export const LazyCountryCombobox = dynamic(
  () => import('@/components/profile/country-combobox').then((module) => ({ default: module.CountryCombobox })),
  { loading: () => <FieldSkeleton /> }
);

export const LazyCityCombobox = dynamic(
  () => import('@/components/profile/city-combobox').then((module) => ({ default: module.CityCombobox })),
  { loading: () => <FieldSkeleton /> }
);

export const LazyPhoneInput = dynamic(
  () => import('@/components/profile/phone-input').then((module) => ({ default: module.PhoneInput })),
  { loading: () => <FieldSkeleton /> }
);

export const LazyTimezonePicker = dynamic(
  () => import('@/components/profile/timezone-picker').then((module) => ({ default: module.TimezonePicker })),
  { loading: () => <FieldSkeleton /> }
);

export type LazyCountryComboboxProps = ComponentProps<typeof LazyCountryCombobox>;
export type LazyCityComboboxProps = ComponentProps<typeof LazyCityCombobox>;
export type LazyPhoneInputProps = ComponentProps<typeof LazyPhoneInput>;
export type LazyTimezonePickerProps = ComponentProps<typeof LazyTimezonePicker>;
