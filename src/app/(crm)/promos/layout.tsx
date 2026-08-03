import { redirectMarketingToDatabase } from '@/lib/marketing-access';

export default async function PromosLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingToDatabase();
  return children;
}
