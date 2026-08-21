import { redirectMarketingFamilyToDatabase } from '@/lib/marketing-access';

export default async function ProgramsLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingFamilyToDatabase();
  return children;
}
