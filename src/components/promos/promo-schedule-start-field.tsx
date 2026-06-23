'use client';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { splitISTInputDefaults } from '@/lib/ist-datetime';

type PromoScheduleStartFieldProps = {
  startDate: string;
  startTime: string;
  onStartDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  dateMin: string;
};

export function PromoScheduleStartField({
  startDate,
  startTime,
  onStartDateChange,
  onStartTimeChange,
  dateMin,
}: PromoScheduleStartFieldProps) {
  const handleSetNow = () => {
    const now = splitISTInputDefaults();
    onStartDateChange(now.date);
    onStartTimeChange(now.time);
  };

  return (
    <Field label="Start" hint="Required">
      <div className="space-y-2">
        <TextInput type="date" value={startDate} min={dateMin} onChange={onStartDateChange} className="w-full" />
        <div className="flex flex-wrap items-center gap-2">
          <TextInput type="time" value={startTime} onChange={onStartTimeChange} className="w-full max-w-40" />
          <Button type="button" variant="light" size="sm" onClick={handleSetNow}>
            Now
          </Button>
        </div>
      </div>
    </Field>
  );
}
