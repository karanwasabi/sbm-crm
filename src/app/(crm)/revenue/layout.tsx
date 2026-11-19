import { redirectMarketingFamilyToDatabase } from '@/lib/marketing-access';

export default async function RevenueLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingFamilyToDatabase();
  return children;
}
