export const MEAL_PLAN_WEIGHT_BRACKETS = [
  { id: '50_55', label: '50–55 kg' },
  { id: '55_60', label: '55–60 kg' },
  { id: '60_65', label: '60–65 kg' },
  { id: '65_70', label: '65–70 kg' },
  { id: '70_75', label: '70–75 kg' },
  { id: '75_80', label: '75–80 kg' },
  { id: '80_85', label: '80–85 kg' },
  { id: '85_90', label: '85–90 kg' },
  { id: '90_95', label: '90–95 kg' },
  { id: '95_100', label: '95–100 kg' },
  { id: '100_110', label: '100–110 kg' },
  { id: '110_120', label: '110–120 kg' },
  { id: 'above_120', label: 'Above 120 kg' },
] as const;

export function mealPlanWeightBracketLabel(id: string | null | undefined): string {
  if (!id) return '—';
  return MEAL_PLAN_WEIGHT_BRACKETS.find((b) => b.id === id)?.label ?? id;
}
