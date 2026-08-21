import { redirectMarketingFamilyToDatabase } from '@/lib/marketing-access';

export default async function PromosLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingFamilyToDatabase();
  return children;
}
