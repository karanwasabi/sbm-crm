'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { getCohortPushBroadcastPreviewAction, sendCohortPushBroadcastAction } from '@/app/(crm)/programs/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import type { CohortPushBroadcastPreview } from '@/utils/api';

type CohortPushBroadcastButtonProps = {
  cohortId: string;
  cohortName: string;
};

const TITLE_MAX = 100;
const BODY_MAX = 500;

export function CohortPushBroadcastButton({ cohortId, cohortName }: CohortPushBroadcastButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState<CohortPushBroadcastPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setBody('');
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);
    void getCohortPushBroadcastPreviewAction(cohortId).then(({ preview: nextPreview, error }) => {
      setPreviewLoading(false);
      if (error) {
        setPreviewError(error);
        return;
      }
      setPreview(nextPreview);
    });
  }, [cohortId, open]);

  const canSend =
    !pending &&
    !previewLoading &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (preview?.reachableMembers ?? 0) > 0;

  const handleSend = () => {
    if (!canSend) return;
    const confirmed = window.confirm(
      `Send this push notification to ${preview?.reachableMembers ?? 0} member${
        (preview?.reachableMembers ?? 0) === 1 ? '' : 's'
      } in ${cohortName}?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const { result, error } = await sendCohortPushBroadcastAction(cohortId, {
        title: title.trim(),
        body: body.trim(),
      });
      if (error || !result) {
        toast({ message: error ?? 'Failed to send push broadcast.', variant: 'error' });
        return;
      }
      toast({
        message: `Push sent to ${result.membersReached} member${result.membersReached === 1 ? '' : 's'} (${result.devicesSent} device${result.devicesSent === 1 ? '' : 's'}).`,
        variant: 'success',
      });
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="light"
        size="sm"
        leftIcon={<Bell className="h-3.5 w-3.5" />}
        onClick={() => setOpen(true)}
      >
        Send push
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send push to cohort</DialogTitle>
            <DialogDescription>
              Broadcast a one-off notification to active members in <strong>{cohortName}</strong> who have push enabled
              and the app installed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-canvas-cool px-4 py-3 text-sm text-slate-600">
              {previewLoading ? (
                'Loading reach preview…'
              ) : previewError ? (
                <span className="text-rose-600">{previewError}</span>
              ) : preview ? (
                <>
                  Will reach <strong>{preview.reachableMembers}</strong> of <strong>{preview.activeMembers}</strong>{' '}
                  active member
                  {preview.activeMembers === 1 ? '' : 's'}.
                  {preview.skippedOptOut > 0 || preview.skippedNoToken > 0 ? (
                    <span className="mt-1 block text-xs text-slate-500">
                      {preview.skippedOptOut > 0 ? `${preview.skippedOptOut} opted out of push` : null}
                      {preview.skippedOptOut > 0 && preview.skippedNoToken > 0 ? ' · ' : null}
                      {preview.skippedNoToken > 0 ? `${preview.skippedNoToken} without a registered device` : null}
                    </span>
                  ) : null}
                </>
              ) : (
                'No preview available.'
              )}
            </div>
            <Field label="Title">
              <TextInput
                id="cohort-push-title"
                value={title}
                onChange={(value) => setTitle(value.slice(0, TITLE_MAX))}
                placeholder="Notification title"
                disabled={pending}
              />
            </Field>
            <Field label="Message">
              <textarea
                id="cohort-push-body"
                value={body}
                onChange={(event) => setBody(event.target.value.slice(0, BODY_MAX))}
                placeholder="Notification message"
                disabled={pending}
                rows={4}
                className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-colors outline-none placeholder:text-slate-400 focus:border-brand"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSend} disabled={!canSend}>
              {pending ? 'Sending…' : 'Send push'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
