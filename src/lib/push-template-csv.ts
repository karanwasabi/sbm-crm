import type { PushSlot, PushTemplateEntry } from '@/utils/api';

export const PUSH_TEMPLATE_CSV_HEADERS = ['week', 'day', 'slot', 'title', 'body'] as const;

const PUSH_SLOTS = new Set<string>(['am_9', 'noon', 'pm_3', 'pm_6', 'pm_8', 'pm_9']);

/** Cohort-relative day (1–7): days 5–6 use 6pm instead of 9pm; day 7 uses noon instead of 3pm. */
export function slotsForDay(day: number): PushSlot[] {
  if (day === 5 || day === 6) {
    return ['am_9', 'pm_3', 'pm_6', 'pm_8'];
  }
  if (day === 7) {
    return ['am_9', 'noon', 'pm_8', 'pm_9'];
  }
  return ['am_9', 'pm_3', 'pm_8', 'pm_9'];
}

export function pushEntryKey(week: number, day: number, slot: PushSlot): string {
  return `${week}:${day}:${slot}`;
}

export type ParsedPushCsvRow = {
  weekIndex: number;
  dayIndex: number;
  slot: PushSlot;
  title: string;
  body: string;
  line: number;
};

export type PushCsvParseError = {
  line: number;
  message: string;
};

export type PushCsvParseResult = {
  rows: ParsedPushCsvRow[];
  errors: PushCsvParseError[];
};

export type PushCsvEdit = {
  key: string;
  weekIndex: number;
  dayIndex: number;
  slot: PushSlot;
  currentTitle: string;
  currentBody: string;
  nextTitle: string;
  nextBody: string;
};

export type PushCsvAddition = {
  key: string;
  weekIndex: number;
  dayIndex: number;
  slot: PushSlot;
  title: string;
  body: string;
};

export type PushCsvDiff = {
  edits: PushCsvEdit[];
  additions: PushCsvAddition[];
  unchanged: number;
};

function isEmptyCopy(title: string, body: string): boolean {
  return !title.trim() && !body.trim();
}

function normalizeHeader(raw: string): string {
  const h = raw
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, '');
  if (h === 'day_index') return 'day';
  if (h === 'week_index') return 'week';
  return h;
}

/** Minimal RFC4180-ish CSV parser (handles quoted fields, commas, newlines). */
export function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    // Ignore trailing empty line
    if (row.length === 1 && row[0] === '' && records.length > 0) {
      row = [];
      return;
    }
    records.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      pushField();
      i += 1;
      continue;
    }
    if (ch === '\n') {
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    if (ch === '\r') {
      pushField();
      if (text[i + 1] === '\n') i += 1;
      pushRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  if (inQuotes) {
    throw new Error('Unclosed quoted field in CSV');
  }
  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }
  return records;
}

export function parsePushTemplateCsv(text: string): PushCsvParseResult {
  const errors: PushCsvParseError[] = [];
  const rows: ParsedPushCsvRow[] = [];

  let records: string[][];
  try {
    records = parseCsvRecords(text.replace(/^\ufeff/, ''));
  } catch (error) {
    return {
      rows: [],
      errors: [{ line: 1, message: error instanceof Error ? error.message : 'Invalid CSV' }],
    };
  }

  if (records.length === 0) {
    return { rows: [], errors: [{ line: 1, message: 'CSV is empty' }] };
  }

  const header = records[0]!.map(normalizeHeader);
  const required = [...PUSH_TEMPLATE_CSV_HEADERS];
  for (const col of required) {
    if (!header.includes(col)) {
      return {
        rows: [],
        errors: [
          {
            line: 1,
            message: `Missing required column "${col}". Expected headers: ${required.join(', ')}`,
          },
        ],
      };
    }
  }

  const idx = {
    week: header.indexOf('week'),
    day: header.indexOf('day'),
    slot: header.indexOf('slot'),
    title: header.indexOf('title'),
    body: header.indexOf('body'),
  };

  const seen = new Set<string>();

  for (let r = 1; r < records.length; r++) {
    const line = r + 1;
    const record = records[r]!;
    if (record.every((cell) => !cell.trim())) continue;

    const weekRaw = (record[idx.week] ?? '').trim();
    const dayRaw = (record[idx.day] ?? '').trim();
    const slotRaw = (record[idx.slot] ?? '').trim();
    const title = (record[idx.title] ?? '').trim();
    const body = (record[idx.body] ?? '').trim();

    const weekIndex = Number(weekRaw);
    const dayIndex = Number(dayRaw);
    if (!Number.isInteger(weekIndex) || weekIndex < 1) {
      errors.push({ line, message: `Invalid week "${weekRaw}" (must be integer >= 1)` });
      continue;
    }
    if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > 7) {
      errors.push({ line, message: `Invalid day "${dayRaw}" (must be 1–7)` });
      continue;
    }
    if (!PUSH_SLOTS.has(slotRaw)) {
      errors.push({
        line,
        message: `Invalid slot "${slotRaw}" (expected am_9, noon, pm_3, pm_6, pm_8, or pm_9)`,
      });
      continue;
    }
    const slot = slotRaw as PushSlot;
    if (!slotsForDay(dayIndex).includes(slot)) {
      errors.push({ line, message: `Slot "${slot}" is not allowed on day ${dayIndex}` });
      continue;
    }

    const key = pushEntryKey(weekIndex, dayIndex, slot);
    if (seen.has(key)) {
      errors.push({ line, message: `Duplicate row for week ${weekIndex} day ${dayIndex} slot ${slot}` });
      continue;
    }
    seen.add(key);

    rows.push({ weekIndex, dayIndex, slot, title, body, line });
  }

  return { rows, errors };
}

export function diffPushTemplateCsv(
  csvRows: ParsedPushCsvRow[],
  current: Map<string, { title: string; body: string }>
): PushCsvDiff {
  const edits: PushCsvEdit[] = [];
  const additions: PushCsvAddition[] = [];
  let unchanged = 0;

  for (const row of csvRows) {
    const key = pushEntryKey(row.weekIndex, row.dayIndex, row.slot);
    const existing = current.get(key) ?? { title: '', body: '' };
    const currentTitle = existing.title.trim();
    const currentBody = existing.body.trim();
    const nextTitle = row.title.trim();
    const nextBody = row.body.trim();

    if (currentTitle === nextTitle && currentBody === nextBody) {
      unchanged += 1;
      continue;
    }

    if (isEmptyCopy(currentTitle, currentBody)) {
      additions.push({
        key,
        weekIndex: row.weekIndex,
        dayIndex: row.dayIndex,
        slot: row.slot,
        title: nextTitle,
        body: nextBody,
      });
      continue;
    }

    edits.push({
      key,
      weekIndex: row.weekIndex,
      dayIndex: row.dayIndex,
      slot: row.slot,
      currentTitle,
      currentBody,
      nextTitle,
      nextBody,
    });
  }

  return { edits, additions, unchanged };
}

export function applyPushCsvSelection(params: {
  current: Map<string, { title: string; body: string }>;
  additions: PushCsvAddition[];
  edits: PushCsvEdit[];
  /** Keys of edits to apply (overwrite). Ignored edits keep current values. */
  keepEditKeys: Set<string>;
}): Map<string, { title: string; body: string }> {
  const next = new Map(params.current);
  for (const addition of params.additions) {
    next.set(addition.key, { title: addition.title, body: addition.body });
  }
  for (const edit of params.edits) {
    if (!params.keepEditKeys.has(edit.key)) continue;
    next.set(edit.key, { title: edit.nextTitle, body: edit.nextBody });
  }
  return next;
}

export function collectPushEntriesFromMap(
  map: Map<string, { title: string; body: string }>,
  maxWeek: number
): PushTemplateEntry[] {
  const entries: PushTemplateEntry[] = [];
  for (let w = 1; w <= maxWeek; w++) {
    for (let day = 1; day <= 7; day++) {
      for (const slot of slotsForDay(day)) {
        const cell = map.get(pushEntryKey(w, day, slot)) ?? { title: '', body: '' };
        entries.push({
          weekIndex: w,
          dayIndex: day,
          slot,
          title: cell.title.trim(),
          body: cell.body.trim(),
        });
      }
    }
  }
  return entries;
}

export function maxWeekFromMap(map: Map<string, { title: string; body: string }>, fallback = 1): number {
  let max = fallback;
  for (const key of map.keys()) {
    const w = Number(key.split(':')[0]);
    if (w > max) max = w;
  }
  return Math.max(max, 1);
}
