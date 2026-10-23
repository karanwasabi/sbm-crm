export function formatStarRupees(available: number): string {
  return `₹${(available * 2).toLocaleString('en-IN')}`;
}

export function memberHasUnredeemedStars(
  available: number | null | undefined,
  spent: number | null | undefined
): boolean {
  return (available ?? 0) > 0 && (spent ?? 0) === 0;
}
