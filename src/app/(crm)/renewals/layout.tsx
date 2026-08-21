import { redirectMarketingFamilyToDatabase } from '@/lib/marketing-access';

export default async function RenewalsLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingFamilyToDatabase();
  return children;
}
