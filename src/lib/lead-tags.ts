export type TagSuggestion = {
  slug: string;
  label: string;
};

export type TagNormalizeResult = { ok: true; slugs: string[] } | { ok: false; error: string };

export function toTagSlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let slug = '';
  let lastDash = false;
  for (const char of trimmed.toLowerCase()) {
    if (/[a-z0-9]/.test(char)) {
      slug += char;
      lastDash = false;
      continue;
    }
    if (!lastDash) {
      slug += '-';
      lastDash = true;
    }
  }

  slug = slug.replace(/^-+|-+$/g, '');
  return slug || null;
}

export function tagSlugToLabel(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function normalizeManualTagInputs(inputs: string[]): TagNormalizeResult {
  const seen = new Set<string>();
  const slugs: string[] = [];

  for (const raw of inputs) {
    const slug = toTagSlug(raw);
    if (!slug) continue;
    if (seen.has(slug)) {
      return { ok: false, error: 'Tag already exists.' };
    }
    seen.add(slug);
    slugs.push(slug);
  }

  return { ok: true, slugs };
}

export function leadHasTag(tags: string[], slug: string): boolean {
  return tags.includes(slug);
}

export function parseTagSlugsParam(value: string | undefined): string[] {
  if (!value?.trim()) return [];

  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const part of value.split(',')) {
    const slug = toTagSlug(part);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }
  return slugs;
}

export function formatTagSlugsParam(slugs: string[]): string {
  return slugs.join(',');
}
