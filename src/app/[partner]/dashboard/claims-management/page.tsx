import { redirect } from 'next/navigation';

import ClaimsManagement from '@/features/claims-management';
import { PROTOTYPE_MODE } from '@/lib/prototype/session';

type ClaimsManagementPageProps = {
  params: Promise<{ partner: string }>;
};

export default async function ClaimsManagementPage({ params }: ClaimsManagementPageProps) {
  if (PROTOTYPE_MODE) {
    const { partner } = await params;
    redirect(`/${partner}/dashboard/create-claim`);
  }

  return <ClaimsManagement />;
}
