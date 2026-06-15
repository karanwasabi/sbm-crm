export type Sex = 'female' | 'male' | 'others';
export type MealPreference = 'vegan' | 'veg' | 'veg_egg' | 'non_veg';

export type NotificationPreferences = {
  notify_whatsapp: boolean;
  notify_email: boolean;
  notify_push: boolean;
};

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: Sex | null;
  timezone_id: string | null;
  country_code: string | null;
  city: string | null;
  meal_preference: MealPreference | null;
  whatsapp: string | null;
  parental_consent: boolean;
} & NotificationPreferences;

export type ProfilePatch = Partial<{
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: Sex;
  timezone_id: string;
  country_code: string;
  city: string;
  meal_preference: MealPreference;
  whatsapp: string;
  parental_consent: boolean;
  notify_whatsapp: boolean;
  notify_email: boolean;
  notify_push: boolean;
}>;

export type UpdateProfileState = {
  error: string | null;
  success: boolean;
};

export function getDisplayName(profile: Profile): string {
  if (profile.first_name) return profile.first_name;
  return profile.email;
}

export function getFullName(profile: Profile): string {
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return profile.email;
}

export function getInitials(profile: Profile): string {
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
  }
  if (profile.first_name) return profile.first_name.slice(0, 2).toUpperCase();
  return profile.email.slice(0, 2).toUpperCase();
}

export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';
}

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'others', label: 'Others' },
];

export const MEAL_OPTIONS: { value: MealPreference; label: string }[] = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'veg', label: 'Vegetarian' },
  { value: 'veg_egg', label: 'Vegetarian + Eggs' },
  { value: 'non_veg', label: 'Non-vegetarian' },
];
