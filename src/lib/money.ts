export function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatCompactInrFromPaise(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return formatInrFromPaise(paise);
}
