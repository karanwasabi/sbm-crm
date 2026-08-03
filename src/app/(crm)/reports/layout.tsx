import { redirectMarketingToDatabase } from '@/lib/marketing-access';

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingToDatabase();
  return children;
}
