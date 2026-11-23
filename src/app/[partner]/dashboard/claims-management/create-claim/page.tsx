import { redirect } from 'next/navigation';

import CreateClaimFlow from '@/features/create-claim';
import { PROTOTYPE_MODE } from '@/lib/prototype/session';

type CreateClaimPageProps = {
  params: Promise<{ partner: string }>;
};

export default async function CreateClaimPage({ params }: CreateClaimPageProps) {
  if (PROTOTYPE_MODE) {
    const { partner } = await params;
    redirect(`/${partner}/dashboard/create-claim`);
  }

  return <CreateClaimFlow />;
}
