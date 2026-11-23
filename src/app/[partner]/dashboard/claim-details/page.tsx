import { redirect } from 'next/navigation';

import DealershipClaimDetail from '@/features/claim-details/DealershipClaimDetail';
import { PROTOTYPE_MODE } from '@/lib/prototype/session';

type ClaimDetailsPageProps = {
  params: Promise<{ partner: string }>;
};

export default async function PrototypeClaimDetailsPage({ params }: ClaimDetailsPageProps) {
  if (!PROTOTYPE_MODE) {
    const { partner } = await params;
    redirect(`/${partner}/dashboard/claims-management/claim-details`);
  }

  return <DealershipClaimDetail />;
}
