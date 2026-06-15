/**
 * Onboarding timezones: [Zoho Deluge supported names](https://www.zoho.com/deluge/help/limitations/time-zones.html).
 * Robotic / duplicate ids (`Etc/GMT+5`, `US/Eastern`, `GB`, Java `ACT`, …) redirect to one canonical zone; see
 * `TIMEZONE_UI_REDIRECT` and `resolveOnboardingTimezoneId`. List is sorted by current UTC offset, grouped by
 * region + offset; search merges redirect tokens onto targets.
 */

import zohoDelugeTimezoneIds from '@/domain/data/zoho-deluge-timezone-ids.json';
import timezoneOffsetSnapshot from '@/domain/data/zoho-deluge-timezone-offset-minutes.snapshot.json';

export type OnboardingTimezoneEntry = {
  id: string;
  /** Display title: last path segment, underscores → spaces. */
  title: string;
  /** Path segments joined with ` • `, underscores → spaces. */
  subtitle: string;
  /** Wall offset from UTC at catalog build time e.g. `UTC+06:30`. */
  offsetStr: string;
  /** Lowercased haystack for search. */
  searchString: string;
  /** East-of-UTC minutes at catalog build time (sort key). */
  offsetMinutes: number;
};

/** One card: all Zoho ids with the same IANA region prefix (e.g. `Africa`) and same current UTC offset. */
export type OnboardingTimezoneGroup = {
  /** Stable list key `${region}\0${offsetMinutes}`. */
  key: string;
  /** Region prefix for display (e.g. `Africa`, `America`). */
  regionLabel: string;
  /** IANA ids in this group, sorted. */
  ids: string[];
  offsetStr: string;
  offsetMinutes: number;
  /** Combined place names (middle dot–separated). */
  title: string;
  /** Region + zone count (and hint when many). */
  subtitle: string;
  searchString: string;
};

/** Extra tokens per canonical id for city/country friendly search. */
const SEARCH_ALIASES_BY_ID: Record<string, string> = {
  // India-first coverage: major metros and tier-2 cities
  'Asia/Kolkata':
    'india indian bharat hindustan delhi new delhi mumbai bombay bengaluru bangalore hyderabad chennai kolkata calcutta pune ahmedabad surat jaipur lucknow kanpur nagpur indore bhopal patna vadodara rajkot nashik faridabad meerut varanasi amritsar visakhapatnam kochi cochin coimbatore madurai trivandrum thiruvananthapuram',
  'Asia/Kathmandu': 'nepal nepali kathmandu kathmandu valley lalitpur pokhara biratnagar',
  'Asia/Colombo': 'sri lanka lankan colombo kandy galle jaffna',
  'Asia/Karachi': 'pakistan pakistani karachi lahore islamabad rawalpindi peshawar',
  'Asia/Dhaka': 'bangladesh bangladeshi dhaka chittagong sylhet khulna',
  'Asia/Kabul': 'afghanistan afghan kabul kandahar herat',
  'Asia/Dubai': 'uae united arab emirates dubai abu dhabi sharjah',

  // APAC
  'Asia/Bangkok': 'thailand thai bangkok chiang mai hanoi vietnam vietnamese jakarta indonesia indonesian',
  'Asia/Shanghai': 'china chinese beijing shanghai shenzhen guangzhou hong kong chongqing',
  'Asia/Tokyo': 'japan japanese tokyo osaka sapporo kyoto',
  'Asia/Seoul': 'korea south korea seoul busan',
  'Asia/Singapore': 'singapore sg',
  'Asia/Kuala_Lumpur': 'malaysia malaysian kuala lumpur',
  'Asia/Manila': 'philippines philippine manila cebu',
  'Australia/Sydney': 'australia australian sydney melbourne canberra',
  'Australia/Perth': 'western australia perth',
  'Pacific/Auckland': 'new zealand nz auckland wellington',

  // Europe / Middle East / Africa
  'Europe/London': 'uk united kingdom britain england london',
  'Europe/Dublin': 'ireland irish dublin',
  'Europe/Paris': 'france french paris',
  'Europe/Berlin': 'germany german berlin munich',
  'Europe/Rome': 'italy italian rome milan',
  'Europe/Madrid': 'spain spanish madrid barcelona',
  'Europe/Warsaw': 'poland polish warsaw',
  'Europe/Lisbon': 'portugal portuguese lisbon',
  'Europe/Athens': 'greece greek athens',
  'Europe/Istanbul': 'turkey turkish istanbul',
  'Europe/Helsinki': 'finland finnish helsinki',
  'Europe/Moscow': 'russia russian moscow',
  'Asia/Jerusalem': 'israel israeli jerusalem tel aviv',
  'Asia/Tehran': 'iran tehran',
  'Africa/Johannesburg': 'south africa cape town pretoria durban',
  'Africa/Cairo': 'egypt cairo',
  'Africa/Lagos': 'nigeria lagos abuja',
  'Africa/Nairobi': 'kenya nairobi',

  // Americas
  'America/New_York': 'usa united states us new york boston miami atlanta washington',
  'America/Chicago': 'usa united states us chicago houston dallas central',
  'America/Denver': 'usa united states us denver salt lake city mountain',
  'America/Los_Angeles': 'usa united states us los angeles san francisco seattle pacific la',
  'America/Toronto': 'canada canadian toronto ottawa montreal',
  'America/Vancouver': 'canada canadian vancouver',
  'America/Mexico_City': 'mexico mexican mexico city guadalajara monterrey',
  'America/Sao_Paulo': 'brazil brazilian sao paulo rio de janeiro',
  'America/Argentina/Buenos_Aires': 'argentina argentinian buenos aires',
  'America/Santiago': 'chile chilean santiago',
  'America/Bogota': 'colombia colombian bogota medellin',
  'America/Lima': 'peru peruvian lima',

  // Misc
  'Asia/Rangoon': 'yangon myanmar burma',
  'Indian/Mauritius': 'mauritius port louis indian ocean',
  'Indian/Maldives': 'maldives male indian ocean',
  'Indian/Reunion': 'reunion saint denis indian ocean',
  'Arctic/Longyearbyen': 'svalbard spitsbergen',
  UTC: 'greenwich gmt gmt0 zulu universal coordinated civil time',
};

/**
 * Zoho ids that should not appear as their own rows — aliased to a single canonical, human-meaningful id.
 * Search tokens from every key are merged onto the target’s `searchString`.
 */
const TIMEZONE_UI_REDIRECT: Record<string, string> = {
  GMT: 'UTC',
  GMT0: 'UTC',
  Greenwich: 'UTC',
  UCT: 'UTC',
  Universal: 'UTC',
  Zulu: 'UTC',
  'Etc/GMT': 'UTC',
  'Etc/GMT0': 'UTC',
  'Etc/GMT+0': 'UTC',
  'Etc/GMT-0': 'UTC',
  'Etc/Greenwich': 'UTC',
  'Etc/UCT': 'UTC',
  'Etc/UTC': 'UTC',
  'Etc/Universal': 'UTC',
  'Etc/Zulu': 'UTC',

  'Etc/GMT+12': 'Pacific/Midway',
  'Etc/GMT+11': 'Pacific/Midway',
  'Etc/GMT+10': 'Pacific/Honolulu',
  'Etc/GMT+9': 'America/Anchorage',
  'Etc/GMT+8': 'America/Los_Angeles',
  'Etc/GMT+7': 'America/Denver',
  'Etc/GMT+6': 'America/Chicago',
  'Etc/GMT+5': 'America/New_York',
  'Etc/GMT+4': 'America/Caracas',
  'Etc/GMT+3': 'America/Sao_Paulo',
  'Etc/GMT+2': 'America/Noronha',
  'Etc/GMT+1': 'Atlantic/Azores',
  'Etc/GMT-1': 'Europe/Paris',
  'Etc/GMT-2': 'Europe/Athens',
  'Etc/GMT-3': 'Europe/Moscow',
  'Etc/GMT-4': 'Asia/Baku',
  'Etc/GMT-5': 'Asia/Karachi',
  'Etc/GMT-6': 'Asia/Dhaka',
  'Etc/GMT-7': 'Asia/Bangkok',
  'Etc/GMT-8': 'Asia/Shanghai',
  'Etc/GMT-9': 'Asia/Tokyo',
  'Etc/GMT-10': 'Australia/Brisbane',
  'Etc/GMT-11': 'Australia/Sydney',
  'Etc/GMT-12': 'Pacific/Fiji',
  'Etc/GMT-13': 'Pacific/Tongatapu',
  'Etc/GMT-14': 'Pacific/Kiritimati',

  'SystemV/HST10': 'Pacific/Honolulu',
  'SystemV/AST4': 'America/Puerto_Rico',
  'SystemV/AST4ADT': 'America/Halifax',
  'SystemV/EST5': 'America/New_York',
  'SystemV/EST5EDT': 'America/New_York',
  'SystemV/CST6': 'America/Chicago',
  'SystemV/CST6CDT': 'America/Chicago',
  'SystemV/MST7': 'America/Denver',
  'SystemV/MST7MDT': 'America/Denver',
  'SystemV/PST8': 'America/Los_Angeles',
  'SystemV/PST8PDT': 'America/Los_Angeles',
  'SystemV/YST9': 'America/Anchorage',
  'SystemV/YST9YDT': 'America/Anchorage',
  CST6CDT: 'America/Chicago',
  EST5EDT: 'America/New_York',
  MST7MDT: 'America/Denver',
  PST8PDT: 'America/Los_Angeles',
  CST: 'America/Chicago',
  EST: 'America/New_York',
  MST: 'America/Denver',
  PST: 'America/Los_Angeles',
  HST: 'Pacific/Honolulu',
  ACT: 'Australia/Darwin',
  AET: 'Australia/Sydney',
  AGT: 'America/Argentina/Buenos_Aires',
  ART: 'Africa/Cairo',
  AST: 'America/Puerto_Rico',
  BET: 'America/Sao_Paulo',
  BST: 'Asia/Dhaka',
  CAT: 'Africa/Harare',
  CNT: 'America/St_Johns',
  CTT: 'Asia/Shanghai',
  EAT: 'Africa/Nairobi',
  ECT: 'America/Guayaquil',
  IET: 'America/Indiana/Indianapolis',
  IST: 'Asia/Kolkata',
  MIT: 'Pacific/Midway',
  NET: 'Asia/Yerevan',
  NST: 'America/St_Johns',
  PLT: 'Asia/Karachi',
  PNT: 'America/Phoenix',
  PRT: 'America/Puerto_Rico',
  SST: 'Pacific/Pago_Pago',
  VST: 'Asia/Ho_Chi_Minh',

  GB: 'Europe/London',
  'GB-Eire': 'Europe/London',
  Eire: 'Europe/Dublin',
  Japan: 'Asia/Tokyo',
  CET: 'Europe/Paris',
  EET: 'Europe/Helsinki',
  MET: 'Europe/Berlin',
  WET: 'Europe/Lisbon',
  Poland: 'Europe/Warsaw',
  Portugal: 'Europe/Lisbon',
  Singapore: 'Asia/Singapore',
  Turkey: 'Europe/Istanbul',
  Israel: 'Asia/Jerusalem',
  Iran: 'Asia/Tehran',
  Iceland: 'Atlantic/Reykjavik',
  Jamaica: 'America/Jamaica',
  Cuba: 'America/Havana',
  Egypt: 'Africa/Cairo',
  Libya: 'Africa/Tripoli',
  Hongkong: 'Asia/Hong_Kong',
  PRC: 'Asia/Shanghai',
  ROC: 'Asia/Taipei',
  NZ: 'Pacific/Auckland',
  'NZ-CHAT': 'Pacific/Chatham',
  Kwajalein: 'Pacific/Kwajalein',
  Navajo: 'America/Denver',
  'W-SU': 'Europe/Moscow',

  'US/Alaska': 'America/Anchorage',
  'US/Aleutian': 'America/Adak',
  'US/Arizona': 'America/Phoenix',
  'US/Central': 'America/Chicago',
  'US/East-Indiana': 'America/Indiana/Indianapolis',
  'US/Eastern': 'America/New_York',
  'US/Hawaii': 'Pacific/Honolulu',
  'US/Indiana-Starke': 'America/Indiana/Knox',
  'US/Michigan': 'America/Detroit',
  'US/Mountain': 'America/Denver',
  'US/Pacific': 'America/Los_Angeles',
  'US/Pacific-New': 'America/Los_Angeles',
  'US/Samoa': 'Pacific/Pago_Pago',

  'Canada/Atlantic': 'America/Halifax',
  'Canada/Central': 'America/Winnipeg',
  'Canada/Eastern': 'America/Toronto',
  'Canada/Mountain': 'America/Edmonton',
  'Canada/Newfoundland': 'America/St_Johns',
  'Canada/Pacific': 'America/Vancouver',
  'Canada/Saskatchewan': 'America/Regina',
  'Canada/Yukon': 'America/Whitehorse',
  'Canada/East-Saskatchewan': 'America/Regina',

  'Mexico/General': 'America/Mexico_City',
  'Mexico/BajaNorte': 'America/Tijuana',
  'Mexico/BajaSur': 'America/Mazatlan',

  'Brazil/East': 'America/Sao_Paulo',
  'Brazil/West': 'America/Manaus',
  'Brazil/Acre': 'America/Rio_Branco',

  'Chile/Continental': 'America/Santiago',
  'Chile/EasterIsland': 'Pacific/Easter',

  'Australia/ACT': 'Australia/Sydney',
  'Australia/Canberra': 'Australia/Sydney',
  'Australia/NSW': 'Australia/Sydney',
  'Australia/Victoria': 'Australia/Melbourne',
  'Australia/Queensland': 'Australia/Brisbane',
  'Australia/South': 'Australia/Adelaide',
  'Australia/Tasmania': 'Australia/Hobart',
  'Australia/West': 'Australia/Perth',
  'Australia/North': 'Australia/Darwin',
  'Australia/LHI': 'Australia/Lord_Howe',
  'Australia/Currie': 'Australia/Hobart',
  'Australia/Yancowinna': 'Australia/Broken_Hill',

  'Africa/Asmera': 'Africa/Asmara',
  'Africa/Timbuktu': 'Africa/Abidjan',
  'Atlantic/Faeroe': 'Atlantic/Faroe',

  'America/Indianapolis': 'America/Indiana/Indianapolis',
  'America/Fort_Wayne': 'America/Indiana/Indianapolis',
  'America/Knox_IN': 'America/Indiana/Knox',
  'America/Louisville': 'America/Kentucky/Louisville',
  'America/Montreal': 'America/Toronto',
  'America/Nipigon': 'America/Toronto',
  'America/Virgin': 'America/St_Thomas',
  'America/Coral_Harbour': 'America/Atikokan',
  'America/Atka': 'America/Adak',
  'America/Ensenada': 'America/Tijuana',
  'America/Santa_Isabel': 'America/Tijuana',
  'America/Shiprock': 'America/Denver',
  'America/Porto_Acre': 'America/Rio_Branco',
  'America/Rosario': 'America/Argentina/Cordoba',

  'Asia/Ashkhabad': 'Asia/Ashgabat',
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Chongqing': 'Asia/Shanghai',
  'Asia/Chungking': 'Asia/Shanghai',
  'Asia/Dacca': 'Asia/Dhaka',
  'Asia/Harbin': 'Asia/Shanghai',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Macao': 'Asia/Macau',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Tel_Aviv': 'Asia/Jerusalem',
  'Asia/Thimbu': 'Asia/Thimphu',
  'Asia/Ulan_Bator': 'Asia/Ulaanbaatar',
  'Asia/Ujung_Pandang': 'Asia/Makassar',

  'Pacific/Truk': 'Pacific/Chuuk',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Pacific/Yap': 'Pacific/Chuuk',

  'Atlantic/Jan_Mayen': 'Arctic/Longyearbyen',
};

function buildRedirectSearchAliasesByTarget(): Record<string, string> {
  const byTarget = new Map<string, Set<string>>();
  for (const [from, to] of Object.entries(TIMEZONE_UI_REDIRECT)) {
    let set = byTarget.get(to);
    if (!set) {
      set = new Set<string>();
      byTarget.set(to, set);
    }
    const lower = from.toLowerCase();
    set.add(lower);
    set.add(lower.replace(/\//g, ' '));
    const tail = from.includes('/') ? from.split('/').pop() : from;
    if (tail) set.add(tail.toLowerCase());
  }
  const out: Record<string, string> = {};
  for (const [target, set] of byTarget) {
    out[target] = [...set].join(' ');
  }
  return out;
}

const REDIRECT_SEARCH_ALIASES_BY_TARGET_ID = buildRedirectSearchAliasesByTarget();

/** Follow UI redirects (possibly chained) for matching selection & normalizing stored ids. */
export function resolveOnboardingTimezoneId(id: string): string {
  const seen = new Set<string>();
  let cur = id;
  while (TIMEZONE_UI_REDIRECT[cur]) {
    if (seen.has(cur)) break;
    seen.add(cur);
    cur = TIMEZONE_UI_REDIRECT[cur];
  }
  return cur;
}

const instantForCatalog = (): Date => new Date();

/**
 * Minutes east of UTC for `timeZone` at `instant` (same convention as `Date.getTimezoneOffset` inverted).
 */
function getTimeZoneOffsetMinutes(timeZone: string, instant: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const raw = dtf.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value;
    const parsed = raw ? parseUtcOffsetLabel(raw) : null;
    if (parsed !== null) return parsed;
  } catch {
    /* fall through */
  }

  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    });
    const raw = dtf.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value;
    const parsed = raw ? parseUtcOffsetLabel(raw) : null;
    if (parsed !== null) return parsed;
  } catch {
    /* fall through */
  }

  const viaLocaleString = offsetViaLocaleStringDiff(timeZone, instant);
  if (viaLocaleString !== null) return viaLocaleString;

  return offsetViaCalendarPartsDiff(timeZone, instant);
}

function getSnapshotOffsetMinutes(timeZone: string): number | null {
  const value = (timezoneOffsetSnapshot as Record<string, unknown>)[timeZone];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseUtcOffsetLabel(raw: string): number | null {
  const s = raw
    .replace(/\u2212/g, '-')
    .replace(/\u2013/g, '-')
    .trim();
  if (/^(?:gmt|utc)$/i.test(s)) return 0;
  const m = s.match(/^(?:gmt|utc)?([+-])(\d{1,2})(?::(\d{2}))?$/i);
  if (m) {
    const sign = m[1] === '-' ? -1 : 1;
    const h = parseInt(m[2]!, 10);
    const min = m[3] ? parseInt(m[3]!, 10) : 0;
    return sign * (h * 60 + min);
  }
  const compact = s.match(/^([+-])(\d{2})(\d{2})$/);
  if (compact) {
    const sign = compact[1] === '-' ? -1 : 1;
    return sign * (parseInt(compact[2]!, 10) * 60 + parseInt(compact[3]!, 10));
  }
  return null;
}

/** Same-instant wall-clock parts interpreted as UTC timestamps; difference is offset ms. */
function offsetViaLocaleStringDiff(timeZone: string, instant: Date): number | null {
  try {
    // Some iOS Intl builds fail `timeZoneName` parsing but still honor `timeZone` in `toLocaleString`.
    const utc = instant.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const local = instant.toLocaleString('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const utcMs = Date.parse(utc);
    const localMs = Date.parse(local);
    if (Number.isNaN(utcMs) || Number.isNaN(localMs)) return null;
    return Math.round((localMs - utcMs) / 60000);
  } catch {
    return null;
  }
}

/** Same-instant wall-clock parts interpreted as UTC timestamps; difference is offset ms. */
function offsetViaCalendarPartsDiff(timeZone: string, instant: Date): number {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  const pick = (parts: Intl.DateTimeFormatPart[]) => {
    const o: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== 'literal') o[p.type] = p.value;
    }
    return o;
  };

  const utcP = pick(fmt('UTC').formatToParts(instant));
  const locP = pick(fmt(timeZone).formatToParts(instant));

  const utcMs = Date.UTC(+utcP.year, +utcP.month - 1, +utcP.day, +utcP.hour, +utcP.minute, +utcP.second);
  const locMs = Date.UTC(+locP.year, +locP.month - 1, +locP.day, +locP.hour, +locP.minute, +locP.second);
  return Math.round((locMs - utcMs) / 60000);
}

function formatUtcOffsetFromMinutes(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildTitleAndSubtitle(id: string): { title: string; subtitle: string } {
  const segments = id.split('/');
  const last = segments[segments.length - 1] ?? id;
  const title = last.replace(/_/g, ' ');
  const subtitle = segments.map((s) => s.replace(/_/g, ' ')).join(' • ');
  return { title, subtitle };
}

function offsetSearchTokens(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const hh = String(h);
  const paddedH = String(h).padStart(2, '0');
  return [
    `${minutes}`,
    `${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`,
    `${sign}${paddedH}:${String(m).padStart(2, '0')}`,
    `${sign}${h}${m ? `:${m}` : ''}`,
    m ? `${h}:${m}` : hh,
  ].join(' ');
}

function extraGeoTerms(id: string, region: string): string {
  if (id.startsWith('Indian/')) return 'indian ocean';
  if (region === 'atlantic') return 'atlantic ocean';
  if (region === 'pacific') return 'pacific ocean';
  return '';
}

function buildSearchString(
  id: string,
  title: string,
  subtitle: string,
  offsetStr: string,
  offsetMinutes: number
): string {
  const lowerId = id.toLowerCase();
  const region = id.includes('/') ? id.split('/')[0]!.toLowerCase() : '';
  const geo = extraGeoTerms(id, region);
  const alias = SEARCH_ALIASES_BY_ID[id] ?? '';
  const extras = offsetSearchTokens(offsetMinutes);
  return [lowerId, title.toLowerCase(), subtitle.toLowerCase(), region, geo, offsetStr.toLowerCase(), alias, extras]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tryBuildEntry(id: string, at: Date, useSnapshotOffsets: boolean): OnboardingTimezoneEntry | null {
  try {
    const offsetMinutes =
      (useSnapshotOffsets ? getSnapshotOffsetMinutes(id) : null) ?? getTimeZoneOffsetMinutes(id, at);
    const offsetStr = formatUtcOffsetFromMinutes(offsetMinutes);
    const { title, subtitle } = buildTitleAndSubtitle(id);
    let searchString = buildSearchString(id, title, subtitle, offsetStr, offsetMinutes);
    const redirectAliases = REDIRECT_SEARCH_ALIASES_BY_TARGET_ID[id];
    if (redirectAliases) {
      searchString = `${searchString} ${redirectAliases}`.replace(/\s+/g, ' ').trim();
    }
    return {
      id,
      title,
      subtitle,
      offsetStr,
      offsetMinutes,
      searchString,
    };
  } catch {
    return null;
  }
}

function buildCatalog(at: Date, useSnapshotOffsets: boolean): OnboardingTimezoneEntry[] {
  const ids = zohoDelugeTimezoneIds as string[];
  const entries: OnboardingTimezoneEntry[] = [];
  for (const id of ids) {
    if (id in TIMEZONE_UI_REDIRECT) continue;
    const e = tryBuildEntry(id, at, useSnapshotOffsets);
    if (e) entries.push(e);
  }
  entries.sort((a, b) =>
    a.offsetMinutes !== b.offsetMinutes ? a.offsetMinutes - b.offsetMinutes : a.id.localeCompare(b.id)
  );
  return entries;
}

/** First path segment, or whole id if there is no `/` (e.g. `CET`, `UTC`). */
function ianaRegionPrefix(id: string): string {
  const i = id.indexOf('/');
  return i === -1 ? id : id.slice(0, i);
}

function formatRegionLabel(region: string): string {
  return region.replace(/_/g, ' ');
}

function groupEntries(entries: OnboardingTimezoneEntry[]): OnboardingTimezoneGroup[] {
  const buckets = new Map<string, OnboardingTimezoneEntry[]>();
  for (const e of entries) {
    const region = ianaRegionPrefix(e.id);
    const bucketKey = `${region}\0${e.offsetMinutes}`;
    const arr = buckets.get(bucketKey);
    if (arr) arr.push(e);
    else buckets.set(bucketKey, [e]);
  }

  const groups: OnboardingTimezoneGroup[] = [];
  for (const [bucketKey, members] of buckets) {
    members.sort((a, b) => a.id.localeCompare(b.id));
    const region = ianaRegionPrefix(members[0]!.id);
    const offsetMinutes = members[0]!.offsetMinutes;
    const offsetStr = members[0]!.offsetStr;
    const regionLabel = formatRegionLabel(region);

    const placeTitles = [...new Set(members.map((m) => m.title))].sort((a, b) => a.localeCompare(b));
    const title =
      region === 'Asia' && offsetMinutes === 330
        ? 'Bengaluru · Chennai · Colombo · Kolkata · Mumbai · New Delhi'
        : placeTitles.join(' · ');

    const n = members.length;
    const subtitle = n === 1 ? `${regionLabel} · ${members[0]!.id}` : `${regionLabel} · ${n} time zones`;

    const searchString = members
      .map((m) => m.searchString)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    groups.push({
      key: bucketKey,
      regionLabel,
      ids: members.map((m) => m.id),
      offsetStr,
      offsetMinutes,
      title,
      subtitle,
      searchString,
    });
  }

  groups.sort((a, b) =>
    a.offsetMinutes !== b.offsetMinutes ? a.offsetMinutes - b.offsetMinutes : a.key.localeCompare(b.key)
  );
  return groups;
}

/** Built once per JS context on first read; offsets use a single `Date` at build time (no periodic refresh). */
let cachedCatalog: OnboardingTimezoneEntry[] | null = null;
let cachedGroups: OnboardingTimezoneGroup[] | null = null;

function shouldUseSnapshotOffsets(at: Date): boolean {
  // iOS Intl can ignore timeZone options and return UTC-like offsets for all zones.
  const probes = ['UTC', 'America/New_York', 'Asia/Kolkata'];
  const offsets = probes.map((id) => getTimeZoneOffsetMinutes(id, at));
  return new Set(offsets).size <= 1;
}

function ensureCatalogBuilt(): void {
  if (cachedCatalog && cachedGroups) return;
  const at = instantForCatalog();
  const useSnapshotOffsets = shouldUseSnapshotOffsets(at);
  cachedCatalog = buildCatalog(at, useSnapshotOffsets);
  cachedGroups = groupEntries(cachedCatalog);
}

export function getOnboardingTimezoneCatalog(): OnboardingTimezoneEntry[] {
  ensureCatalogBuilt();
  return cachedCatalog!;
}

/** Flat list grouped by IANA region + current offset (one row per group, sorted by offset). */
export function getOnboardingTimezoneGroups(): OnboardingTimezoneGroup[] {
  ensureCatalogBuilt();
  return cachedGroups!;
}

function matchesTimezoneQuery(searchString: string, offsetStr: string, q: string, qCompact: string): boolean {
  if (searchString.includes(q)) return true;
  if (offsetStr.toLowerCase().includes(q)) return true;
  const offCompact = offsetStr.replace(/^utc/i, '').toLowerCase().replace(/\s/g, '');
  if (qCompact.length >= 3 && offCompact.includes(qCompact)) return true;
  return false;
}

export function filterOnboardingTimezones(
  catalog: OnboardingTimezoneEntry[],
  query: string
): OnboardingTimezoneEntry[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return catalog;
  const qCompact = q.replace(/\s/g, '');
  return catalog.filter((t) => matchesTimezoneQuery(t.searchString, t.offsetStr, q, qCompact));
}

export function filterOnboardingTimezoneGroups(
  groups: OnboardingTimezoneGroup[],
  query: string
): OnboardingTimezoneGroup[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return groups;
  const qCompact = q.replace(/\s/g, '');
  return groups.filter((g) => matchesTimezoneQuery(g.searchString, g.offsetStr, q, qCompact));
}
