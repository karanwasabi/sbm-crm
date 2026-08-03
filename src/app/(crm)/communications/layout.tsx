import { redirectMarketingToDatabase } from '@/lib/marketing-access';

export default async function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingToDatabase();
  return children;
}
