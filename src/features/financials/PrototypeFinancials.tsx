'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { DealershipOwnerFinancials } from '@/features/financials/DealershipOwnerFinancials';
import { getPrototypeEmail, getPrototypePersona } from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';

type PrototypeFinancialsProps = {
  fallback: ReactNode;
};

export function PrototypeFinancials({ fallback }: PrototypeFinancialsProps) {
  const router = useRouter();
  const { partner } = useParams<{ partner: string }>();
  const { userProfile } = useUserProfileStore();
  const [persona, setPersona] = useState<'super' | 'owner' | 'ops' | 'kam' | null>(null);

  useEffect(() => {
    const email = userProfile?.email || getPrototypeEmail();
    const next = getPrototypePersona(email);
    setPersona(next);
    if (next === 'kam') {
      router.replace(`/${partner}/dashboard/overview`);
    }
  }, [partner, router, userProfile?.email]);

  if (!persona || persona === 'kam') {
    return null;
  }

  return persona === 'ops' ? fallback : <DealershipOwnerFinancials />;
}
