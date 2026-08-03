import { redirectMarketingToDatabase } from '@/lib/marketing-access';

export default async function ProgramsLayout({ children }: { children: React.ReactNode }) {
  await redirectMarketingToDatabase();
  return children;
}
