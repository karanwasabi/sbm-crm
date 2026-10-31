'use client';

import { useEffect, useState } from 'react';
import { mintAppPreviewAction, searchAppPreviewAction } from '@/app/(crm)/app-preview/actions';
import type { AppPreviewMember } from '@/utils/api';
import type { CohortSummary } from '@/types/crm';

const APP_WEB_ORIGIN = (process.env.NEXT_PUBLIC_APP_WEB_ORIGIN ?? 'https://web-demo.slowburnmethod.in').replace(
  /\/$/,
  ''
);

type AppPreviewViewProps = {
  cohorts: CohortSummary[];
};

export function AppPreviewView({ cohorts }: AppPreviewViewProps) {
  const [query, setQuery] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [members, setMembers] = useState<AppPreviewMember[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [preview, setPreview] = useState<{ name: string; email: string; token: string; expiresAt: string } | null>(
    null
  );
  const [previewError, setPreviewError] = useState('');
  const [opening, setOpening] = useState(false);

  const trimmedQuery = query.trim();
  const canSearch = Boolean(cohortId) || trimmedQuery.length >= 2;

  useEffect(() => {
    if (!canSearch) return;

    let cancelled = false;
    const handle = setTimeout(() => {
      setMembers([]);
      setSearching(true);
      setSearchError('');
      void searchAppPreviewAction(trimmedQuery, cohortId).then((result) => {
        if (cancelled) return;
        setSearching(false);
        if (!result.ok) {
          setMembers([]);
          setSearchError(result.error);
          return;
        }
        setMembers(result.members);
      });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [canSearch, trimmedQuery, cohortId]);

  async function openMember(member: AppPreviewMember) {
    setSelectedId(member.user_id);
    setOpening(true);
    setPreviewError('');
    const result = await mintAppPreviewAction(member.user_id);
    setOpening(false);
    if (!result.ok) {
      setPreviewError(result.error);
      return;
    }
    setPreview({
      name: member.name || member.email,
      email: member.email,
      token: result.token,
      expiresAt: result.expiresAt,
    });
  }

  async function refreshPreview() {
    if (!selectedId || !preview) return;
    setOpening(true);
    setPreviewError('');
    const result = await mintAppPreviewAction(selectedId);
    setOpening(false);
    if (!result.ok) {
      setPreviewError(result.error);
      return;
    }
    setPreview({ ...preview, token: result.token, expiresAt: result.expiresAt });
  }

  const frameSrc = preview ? `${APP_WEB_ORIGIN}/preview#token=${encodeURIComponent(preview.token)}` : '';

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <section className="w-full max-w-md shrink-0">
        <p className="mb-4 text-sm text-slate-600">
          This preview does not change the member&apos;s account. Check-ins, bookings, and dismissals stay on the screen
          only.
        </p>
        <label className="mb-3 block text-sm text-slate-700">
          Cohort
          <select
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-brand"
            value={cohortId}
            onChange={(event) => setCohortId(event.target.value)}
          >
            <option value="">All cohorts</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} · {cohort.status}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-3 block text-sm text-slate-700">
          Name or email
          <input
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-brand"
            value={query}
            placeholder={cohortId ? 'Search this cohort' : 'Search all cohorts'}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {!canSearch ? <p className="text-sm text-slate-500">Type at least 2 characters, or pick a cohort.</p> : null}
        {canSearch && searching ? <p className="text-sm text-slate-500">Searching…</p> : null}
        {searchError ? <p className="text-sm text-red-600">{searchError}</p> : null}
        <ul className="mt-3 flex max-h-[640px] flex-col gap-1 overflow-auto">
          {(canSearch ? members : []).map((member) => {
            const active = member.user_id === selectedId;
            return (
              <li key={`${member.user_id}-${member.cohort_id}`}>
                <button
                  type="button"
                  className={`w-full rounded-xl px-3 py-2 text-left ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 hover:bg-slate-50'}`}
                  onClick={() => void openMember(member)}
                >
                  <span className="block text-sm font-medium">{member.name || member.email}</span>
                  <span className={`block text-xs ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                    {member.email} · {member.cohort_name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {canSearch && !searching && members.length === 0 && !searchError ? (
          <p className="mt-3 text-sm text-slate-500">No members match.</p>
        ) : null}
      </section>

      <section className="flex flex-1 flex-col items-center gap-3">
        {preview ? (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-800">{preview.name}</p>
            <p className="text-xs text-slate-500">{preview.email}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Choose a member to load their home screen.</p>
        )}
        <div className="w-[390px] overflow-hidden rounded-[40px] border-[12px] border-slate-900 bg-white shadow-2xl">
          {frameSrc ? (
            <iframe
              key={preview?.token}
              title={preview ? `Home preview for ${preview.name}` : 'App home preview'}
              src={frameSrc}
              className="h-[844px] w-full bg-white"
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-[844px] items-center justify-center bg-slate-50 px-8 text-center text-sm text-slate-400">
              The phone frame fills in after you pick a member.
            </div>
          )}
        </div>
        {preview ? (
          <button
            type="button"
            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50"
            disabled={opening}
            onClick={() => void refreshPreview()}
          >
            {opening ? 'Refreshing…' : 'Refresh preview'}
          </button>
        ) : null}
        {previewError ? <p className="text-sm text-red-600">{previewError}</p> : null}
        {preview ? (
          <p className="max-w-sm text-center text-xs text-slate-400">
            Preview expires {new Date(preview.expiresAt).toLocaleTimeString()}. Refresh loads a new one. The hosted app
            must include the preview route.
          </p>
        ) : null}
      </section>
    </div>
  );
}
