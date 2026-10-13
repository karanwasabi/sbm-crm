import { describe, expect, it } from 'vitest';
import {
  applyPushCsvSelection,
  collectPushEntriesFromMap,
  diffPushTemplateCsv,
  parsePushTemplateCsv,
  pushEntryKey,
} from './push-template-csv';

describe('parsePushTemplateCsv', () => {
  it('parses quoted bodies with commas', () => {
    const csv = ['week,day,slot,title,body', '1,1,am_9,Hello,"Hi, there"', '1,1,pm_3,Nudge,Walk'].join('\n');
    const result = parsePushTemplateCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      weekIndex: 1,
      dayIndex: 1,
      slot: 'am_9',
      title: 'Hello',
      body: 'Hi, there',
    });
  });

  it('rejects slots not allowed on the day', () => {
    const csv = ['week,day,slot,title,body', '1,5,pm_9,Bad,Night'].join('\n');
    const result = parsePushTemplateCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]?.message).toMatch(/not allowed on day 5/);
  });

  it('accepts day_index header alias', () => {
    const csv = ['week,day_index,slot,title,body', '2,7,noon,Goals,Set them'].join('\n');
    const result = parsePushTemplateCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows[0]?.slot).toBe('noon');
  });
});

describe('diffPushTemplateCsv', () => {
  it('classifies additions, edits, and unchanged', () => {
    const current = new Map([
      [pushEntryKey(1, 1, 'am_9'), { title: 'Old', body: 'Old body' }],
      [pushEntryKey(1, 1, 'pm_3'), { title: 'Same', body: 'Same body' }],
      [pushEntryKey(1, 1, 'pm_8'), { title: '', body: '' }],
    ]);
    const parsed = parsePushTemplateCsv(
      [
        'week,day,slot,title,body',
        '1,1,am_9,New,New body',
        '1,1,pm_3,Same,Same body',
        '1,1,pm_8,Check-in,Do it',
        '1,1,pm_9,Night,Sleep',
      ].join('\n')
    );
    const diff = diffPushTemplateCsv(parsed.rows, current);
    expect(diff.unchanged).toBe(1);
    expect(diff.edits).toHaveLength(1);
    expect(diff.edits[0]?.nextTitle).toBe('New');
    expect(diff.additions).toHaveLength(2);
  });
});

describe('applyPushCsvSelection', () => {
  it('keeps ignored edits and applies additions', () => {
    const current = new Map([[pushEntryKey(1, 1, 'am_9'), { title: 'Old', body: 'Old body' }]]);
    const edits = [
      {
        key: pushEntryKey(1, 1, 'am_9'),
        weekIndex: 1,
        dayIndex: 1,
        slot: 'am_9' as const,
        currentTitle: 'Old',
        currentBody: 'Old body',
        nextTitle: 'New',
        nextBody: 'New body',
      },
    ];
    const additions = [
      {
        key: pushEntryKey(1, 1, 'pm_3'),
        weekIndex: 1,
        dayIndex: 1,
        slot: 'pm_3' as const,
        title: 'Add',
        body: 'Added',
      },
    ];
    const ignored = applyPushCsvSelection({
      current,
      additions,
      edits,
      keepEditKeys: new Set(),
    });
    expect(ignored.get(pushEntryKey(1, 1, 'am_9'))).toEqual({ title: 'Old', body: 'Old body' });
    expect(ignored.get(pushEntryKey(1, 1, 'pm_3'))).toEqual({ title: 'Add', body: 'Added' });

    const kept = applyPushCsvSelection({
      current,
      additions,
      edits,
      keepEditKeys: new Set([pushEntryKey(1, 1, 'am_9')]),
    });
    expect(kept.get(pushEntryKey(1, 1, 'am_9'))).toEqual({ title: 'New', body: 'New body' });
  });
});

describe('collectPushEntriesFromMap', () => {
  it('fills all slots for each week', () => {
    const map = new Map([[pushEntryKey(1, 1, 'am_9'), { title: 'Hi', body: 'Body' }]]);
    const entries = collectPushEntriesFromMap(map, 1);
    expect(entries).toHaveLength(28);
    expect(entries.find((e) => e.slot === 'am_9' && e.dayIndex === 1)?.title).toBe('Hi');
  });
});
