/**
 * Capitalize the first letter of each word when typed lowercase. Preserves intentional
 * casing elsewhere (e.g. "sbm" → "Sbm" only if first char lower; "SBM" stays "SBM";
 * "mary-jane o'brien" → "Mary-Jane O'Brien").
 */
export function toTitleCase(value: string): string {
  let result = '';
  let capitalizeNext = true;

  for (const char of value) {
    if (/[\s\-']/.test(char)) {
      result += char;
      capitalizeNext = true;
    } else if (/[a-zA-Z\u00C0-\u024F]/.test(char)) {
      if (capitalizeNext && char === char.toLowerCase()) {
        result += char.toUpperCase();
      } else {
        result += char;
      }
      capitalizeNext = false;
    } else {
      result += char;
      capitalizeNext = false;
    }
  }

  return result;
}
