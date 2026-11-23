'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { DealershipOwnerFinancials } from '@/features/financials/DealershipOwnerFinancials';
import { getPrototypeEmail, getPrototypePersona } from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';

type PrototypeFinancialsProps = {
  fallback: ReactNode;
};

export function PrototypeFinancials({ fallback }: PrototypeFinancialsProps) {
  const { userProfile } = useUserProfileStore();
  const [persona, setPersona] = useState<'super' | 'owner' | 'ops' | null>(null);

  useEffect(() => {
    const email = userProfile?.email || getPrototypeEmail();
    setPersona(getPrototypePersona(email));
  }, [userProfile?.email]);

  if (!persona) {
    return null;
  }

  return persona === 'ops' ? fallback : <DealershipOwnerFinancials />;
}
