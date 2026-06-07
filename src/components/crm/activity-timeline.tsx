import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { TimelineEvent } from '@/types/crm';

type ActivityTimelineProps = {
  events: TimelineEvent[];
};

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <Card>
      <SectionHead title="Activity timeline" subtitle="Operations + communications" />
      <div className="flex flex-col gap-0">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-3.5 pb-5">
            {index < events.length - 1 && (
              <div className="absolute top-6 left-[11px] h-[calc(100%-12px)] w-px bg-slate-100" />
            )}
            <div
              className="relative z-1 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${event.color}20`, color: event.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: event.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-bold text-slate-800">{event.title}</span>
                <span className="shrink-0 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  {event.kind}
                </span>
              </div>
              {event.body && <p className="mt-0.5 text-[12.5px] text-slate-600">{event.body}</p>}
              <p className="mt-1 text-[11px] text-slate-400">{event.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
