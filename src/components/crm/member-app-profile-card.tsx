'use client';

import { useEffect, useState } from 'react';
import { getLeadMemberProfileAction } from '@/app/(crm)/customers/actions';
import { HabitGoalAddonsDialog } from '@/components/crm/habit-goal-addons-dialog';
import { HabitGoalCapsDialog } from '@/components/crm/habit-goal-caps-dialog';
import { ServingAddonsDialog } from '@/components/crm/serving-addons-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MemberProfile } from '@/utils/api';

type MemberAppProfileCardProps = {
  leadId: string;
  refreshKey?: number;
  onProfileChanged?: () => void;
};

function formatKg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)} kg`;
}

function formatBmi(heightCm: number | null | undefined, weightKg: number | null | undefined): string {
  if (heightCm == null || weightKg == null || !(heightCm > 0) || !(weightKg > 0)) return '—';
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
}

function formatAddon(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function formatCapSummary(caps: MemberProfile['habitGoalCaps']): string {
  const parts: string[] = [];
  if (caps.stepsDailyMin != null) parts.push(`Steps min ${caps.stepsDailyMin}`);
  if (caps.stepsDailyMax != null) parts.push(`Steps max ${caps.stepsDailyMax}`);
  if (caps.exerciseDaysMin != null) parts.push(`Ex min ${caps.exerciseDaysMin}`);
  if (caps.exerciseDaysMax != null) parts.push(`Ex max ${caps.exerciseDaysMax}`);
  if (caps.sleepHoursDailyMin != null) parts.push(`Sleep min ${caps.sleepHoursDailyMin}h`);
  if (caps.sleepHoursDailyMax != null) parts.push(`Sleep max ${caps.sleepHoursDailyMax}h`);
  if (caps.nutritionPointsDailyMin != null) parts.push(`Nutr min ${caps.nutritionPointsDailyMin}`);
  if (caps.nutritionPointsDailyMax != null) parts.push(`Nutr max ${caps.nutritionPointsDailyMax}`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-50 py-1.5 last:border-b-0">
      <span className="shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function MemberAppProfileCard({ leadId, refreshKey = 0, onProfileChanged }: MemberAppProfileCardProps) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [habitAddonsOpen, setHabitAddonsOpen] = useState(false);
  const [habitCapsOpen, setHabitCapsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { result, error: loadError } = await getLeadMemberProfileAction(leadId);
      if (cancelled) return;
      if (loadError || !result) {
        setError(loadError ?? 'Failed to load member profile.');
        setProfile(null);
      } else {
        setError(null);
        setProfile(result);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

  const addons = profile?.servingAddons;
  const habitAddons = profile?.habitGoalAddons;
  const habitCaps = profile?.habitGoalCaps;
  const goals = profile?.activeWeekGoals;

  return (
    <>
      <Card padding="sm" className="overflow-visible border-slate-100/80 shadow-none">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Member app profile</p>
          {profile && !loading ? (
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAddonsOpen(true)}
              >
                Edit serving addons
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setHabitAddonsOpen(true)}
              >
                Edit habit modifiers
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setHabitCapsOpen(true)}
              >
                Edit habit caps
              </Button>
            </div>
          ) : null}
        </div>
        {loading ? <p className="text-sm font-medium text-slate-500">Loading…</p> : null}
        {error ? <p className="text-sm font-medium text-danger-press">{error}</p> : null}
        {profile && !loading ? (
          <div className="space-y-0.5">
            <Row label="Name" value={[profile.firstName, profile.lastName].filter(Boolean).join(' ') || '—'} />
            <Row label="Email" value={profile.email || '—'} />
            <Row label="DOB" value={profile.dateOfBirth ?? '—'} />
            <Row label="Sex" value={profile.sex ?? '—'} />
            <Row label="Timezone" value={profile.timezoneId ?? '—'} />
            <Row label="Location" value={[profile.city, profile.countryCode].filter(Boolean).join(', ') || '—'} />
            <Row label="Meal pref" value={profile.mealPreference ?? '—'} />
            <Row label="WhatsApp" value={profile.whatsapp ?? '—'} />
            <Row label="Height" value={profile.heightCm != null ? `${profile.heightCm.toFixed(1)} cm` : '—'} />
            <Row label="Initial weight" value={formatKg(profile.initialWeightKg)} />
            <Row label="Current weight" value={formatKg(profile.currentWeightKg)} />
            <Row label="BMI" value={formatBmi(profile.heightCm, profile.currentWeightKg ?? profile.initialWeightKg)} />
            <Row
              label="Latest log"
              value={
                profile.latestWeightLocalDate
                  ? `${profile.latestWeightLocalDate}${profile.latestWeightSource ? ` · ${profile.latestWeightSource}` : ''}`
                  : '—'
              }
            />
            <Row label="Onboarding" value={profile.onboardingCompletedAt ? 'Complete' : 'Incomplete'} />
            <Row
              label="Point A"
              value={profile.pointACompleted ? (profile.pointACompletedAt ?? 'Complete') : 'Incomplete'}
            />
            <Row
              label="Program"
              value={
                profile.awaitingStart
                  ? `Awaiting start${profile.programStartsOn ? ` · ${profile.programStartsOn}` : ''}`
                  : profile.programStartsOn
                    ? `Started · ${profile.programStartsOn}`
                    : '—'
              }
            />
            <Row label="Active week" value={profile.activeWeekStartDate ?? '—'} />
            <Row
              label="Habit goals"
              value={
                goals
                  ? `${goals.stepsDaily} steps · ${goals.exerciseDays} ex · ${goals.sleepHoursDaily}h · ${goals.nutritionPointsDaily} nutr`
                  : 'None yet'
              }
            />
            <Row
              label="Habit modifiers"
              value={
                habitAddons
                  ? `S${formatAddon(habitAddons.stepsDaily)}/E${formatAddon(habitAddons.exerciseDays)}/Sl${formatAddon(habitAddons.sleepHoursDaily)}/N${formatAddon(habitAddons.nutritionPointsDaily)}`
                  : '—'
              }
            />
            <Row label="Habit caps" value={habitCaps ? formatCapSummary(habitCaps) : '—'} />
            <Row
              label="Serving addons"
              value={
                addons
                  ? `P${formatAddon(addons.protein)}/F${formatAddon(addons.fiber)}/S${formatAddon(addons.starch)}/D${formatAddon(addons.dairy)}/Fun${formatAddon(addons.fun)}`
                  : '—'
              }
            />
            <Row
              label="Servings used"
              value={
                profile.activeWeekServings
                  ? `${formatKg(profile.activeWeekServings.weightKgUsed)} → P${profile.activeWeekServings.protein}/F${profile.activeWeekServings.fiber}/S${profile.activeWeekServings.starch}/D${profile.activeWeekServings.dairy}/Fun${profile.activeWeekServings.fun}`
                  : 'None yet'
              }
            />
          </div>
        ) : null}
      </Card>
      <ServingAddonsDialog leadId={leadId} open={addonsOpen} onOpenChange={setAddonsOpen} onDone={onProfileChanged} />
      <HabitGoalAddonsDialog
        leadId={leadId}
        open={habitAddonsOpen}
        onOpenChange={setHabitAddonsOpen}
        onDone={onProfileChanged}
      />
      <HabitGoalCapsDialog
        leadId={leadId}
        open={habitCapsOpen}
        onOpenChange={setHabitCapsOpen}
        onDone={onProfileChanged}
      />
    </>
  );
}
