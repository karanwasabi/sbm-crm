import { redirectMarketingToDatabase } from '@/lib/marketing-access';

export default async function RenewalsLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingToDatabase();
  return children;
}
