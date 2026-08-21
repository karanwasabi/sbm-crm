import { redirectMarketingFamilyToDatabase } from '@/lib/marketing-access';

export default async function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingFamilyToDatabase();
  return children;
}
