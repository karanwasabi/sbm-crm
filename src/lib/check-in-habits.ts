/** Daily check-in habit helpers — mirrors sbm-app format-habit-values + nutrition-checkin. */

export type RecommendedNutritionServings = {
  protein: number;
  fiber: number;
  starch: number;
  dairy: number;
  fun: number;
};

export type NutritionMcqQuestion = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function snapToStep(value: number, min: number, max: number, step: number): number {
  const snapped = min + Math.round((value - min) / step) * step;
  return +clamp(snapped, min, max).toFixed(10);
}

export function snapSteps(value: number): number {
  return snapToStep(value, 0, Number.MAX_SAFE_INTEGER, 50);
}

export function snapSleepHours(hours: number, minutes: number): number {
  const totalMinutes = hours * 60 + minutes;
  const snapped = snapToStep(totalMinutes, 0, 24 * 60, 15);
  return snapped / 60;
}

export function sleepHoursToHoursMinutes(sleepHours: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(sleepHours * 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export function hoursMinutesToSleepHours(hours: number, minutes: number): number {
  return +((hours * 60 + minutes) / 60).toFixed(4);
}

export function formatSleepDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (totalMinutes === 0) return '0 hours';
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hour${h === 1 ? '' : 's'}`;
  return `${h} hour${h === 1 ? '' : 's'} ${m} min`;
}

export function formatSteps(value: number): string {
  return `${value.toLocaleString()} steps`;
}

function formatServingCount(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

function servingWord(n: number): string {
  return n === 1 ? 'serving' : 'servings';
}

function formatServingsLabel(n: number): string {
  return `${formatServingCount(n)} ${servingWord(n)}`;
}

const LEGACY_WATER_IDS = new Set(['lt15', '15to2', '2to3', 'gt3']);

export const LEGACY_WATER_LABELS: Record<string, string> = {
  lt15: 'Under 1.5 litres (legacy)',
  '15to2': '1.5–2 litres (legacy)',
  '2to3': '2–3 litres (legacy)',
  gt3: 'Above 3 litres (legacy)',
};

export function isLegacyWaterId(id: string): boolean {
  return LEGACY_WATER_IDS.has(id);
}

export function buildDailyNutritionMcqQuestions(x: RecommendedNutritionServings): NutritionMcqQuestion[] {
  const proteinXm1 = x.protein - 1;
  const fiberXm1 = x.fiber - 1;
  const starchXm1 = x.starch - 1;

  return [
    {
      id: 'hunger',
      question: 'For how long did you experience hunger today?',
      options: [
        { id: 'none', label: 'Was not hungry at all' },
        { id: '1to2', label: '1-2 hours' },
        { id: '3to4', label: '3-4 hours' },
        { id: 'most', label: 'Hungry most of the time' },
      ],
    },
    {
      id: 'protein',
      question: 'How many protein servings did you have today?',
      options: [
        { id: 'lt', label: `Under ${formatServingsLabel(proteinXm1)}` },
        { id: 'xm1', label: formatServingsLabel(proteinXm1) },
        { id: 'x', label: formatServingsLabel(x.protein) },
        { id: 'gt', label: `More than ${formatServingCount(x.protein)} ${servingWord(x.protein)}` },
      ],
    },
    {
      id: 'fiber',
      question: 'How many fiber servings did you have today?',
      options: [
        { id: 'lt', label: `Under ${formatServingsLabel(fiberXm1)}` },
        { id: 'xm1', label: formatServingsLabel(fiberXm1) },
        { id: 'x', label: formatServingsLabel(x.fiber) },
        { id: 'gt', label: `More than ${formatServingCount(x.fiber)} ${servingWord(x.fiber)}` },
      ],
    },
    {
      id: 'starch',
      question: 'How many starch servings did you have today?',
      options: [
        { id: 'lt', label: `Under ${formatServingsLabel(starchXm1)}` },
        { id: 'xm1', label: formatServingsLabel(starchXm1) },
        { id: 'x', label: formatServingsLabel(x.starch) },
        { id: 'gt', label: `More than ${formatServingCount(x.starch)} ${servingWord(x.starch)}` },
      ],
    },
    {
      id: 'fun',
      question: 'How many fun food servings did you have today?',
      options: [
        { id: 'none', label: 'None' },
        { id: 'x', label: formatServingsLabel(x.fun) },
        { id: 'gt', label: `More than ${formatServingCount(x.fun)} ${servingWord(x.fun)}` },
      ],
    },
    {
      id: 'dairy',
      question: 'How many milk/yogurt servings did you have today?',
      options: [
        { id: 'none', label: 'None' },
        { id: 'x', label: formatServingsLabel(x.dairy) },
        { id: 'gt', label: `More than ${formatServingCount(x.dairy)} ${servingWord(x.dairy)}` },
      ],
    },
    {
      id: 'water',
      question: 'How much water did you drink today?',
      options: [
        { id: 'lt1', label: 'Under 1 litre' },
        { id: '1to2', label: '1-2 litres' },
        { id: 'gt2', label: 'Above 2 litres' },
      ],
    },
  ];
}

export function nutritionOptionsForQuestion(
  question: NutritionMcqQuestion,
  selectedId: string | undefined
): { id: string; label: string }[] {
  if (question.id === 'water' && selectedId && isLegacyWaterId(selectedId)) {
    const legacy = LEGACY_WATER_LABELS[selectedId];
    if (legacy && !question.options.some((o) => o.id === selectedId)) {
      return [{ id: selectedId, label: legacy }, ...question.options];
    }
  }
  return question.options;
}

export const EXERCISE_TYPE_OPTIONS = [
  { id: 'strength', label: 'Strength' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'hybrid', label: 'Hybrid' },
] as const;

export const EXERCISE_INTENSITY_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'high', label: 'High' },
] as const;

export function exerciseTypeLabel(id: string | undefined): string {
  return EXERCISE_TYPE_OPTIONS.find((o) => o.id === id)?.label ?? id ?? '—';
}

export function exerciseIntensityLabel(id: string | undefined): string {
  return EXERCISE_INTENSITY_OPTIONS.find((o) => o.id === id)?.label ?? id ?? '—';
}
