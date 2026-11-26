'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PlusIcon } from 'lucide-react';

import { PageHeading, PAGE_LAYOUT_CLASS } from '@/components/molecules/PageHeading';
import { Button } from '@/components/ui/button';
import { OngoingClaimsSection } from '@/features/claims/OngoingClaimsSection';
import { useDataSource } from '@/lib/hooks/useDataSourceUrlState';
import { getPrototypeEmail, getPrototypePersona, type PrototypePersona } from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';
import { appendSourceQueryParam } from '@/lib/utils/dataSource.utils';

export function PrototypeClaimsManagement() {
  const { partner } = useParams<{ partner: string }>();
  const { userProfile } = useUserProfileStore();
  const currentSource = useDataSource();
  const [persona, setPersona] = useState<PrototypePersona | null>(null);

  useEffect(() => {
    setPersona(getPrototypePersona(userProfile?.email || getPrototypeEmail()));
  }, [userProfile?.email]);

  if (!persona) {
    return null;
  }

  const canRaise = persona === 'ops' || persona === 'super';
  const raiseClaimHref = appendSourceQueryParam(`/${partner}/dashboard/create-claim`, '', currentSource);

  return (
    <div className={PAGE_LAYOUT_CLASS}>
      <PageHeading
        title="Claims management"
        subtitle="Open claims for this dealership, and who has to move each one next."
        actions={
          canRaise ? (
            <Button
              asChild
              className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover shadow-create-claim-button h-9 rounded-full px-4 text-sm font-medium"
            >
              <Link href={raiseClaimHref}>
                <PlusIcon className="size-4" />
                Raise a claim
              </Link>
            </Button>
          ) : null
        }
      />
      <OngoingClaimsSection />
    </div>
  );
}
