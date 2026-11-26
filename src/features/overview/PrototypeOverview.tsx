'use client';

import { useEffect, useState } from 'react';

import { DealershipOpsOverview } from '@/features/overview/DealershipOpsOverview';
import { DealershipOwnerOverview } from '@/features/overview/DealershipOwnerOverview';
import { KamPortfolioOverview } from '@/features/overview/KamPortfolioOverview';
import { SuperOverview } from '@/features/overview/SuperOverview';
import { getPrototypeEmail, getPrototypePersona } from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';

export function PrototypeOverview() {
  const { userProfile } = useUserProfileStore();
  const [persona, setPersona] = useState<'super' | 'owner' | 'ops' | 'kam' | null>(null);

  useEffect(() => {
    const email = userProfile?.email || getPrototypeEmail();
    setPersona(getPrototypePersona(email));
  }, [userProfile?.email]);

  if (!persona) {
    return null;
  }

  if (persona === 'super') {
    return <SuperOverview />;
  }

  if (persona === 'kam') {
    return <KamPortfolioOverview />;
  }

  return persona === 'owner' ? <DealershipOwnerOverview /> : <DealershipOpsOverview />;
}
