'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CLOSED_CLAIMS, OPEN_CLAIMS, type ClaimBucket, type ClaimRow } from '@/features/overview/overviewContent';
import { useDataSource } from '@/lib/hooks/useDataSourceUrlState';
import { useRaisedClaimsStore } from '@/lib/prototype/raisedClaims';
import type { DataSource } from '@/lib/constants/global.constants';
import { appendSourceQueryParam } from '@/lib/utils/dataSource.utils';
import { cn } from '@/lib/utils';

const BADGE_CLASS: Record<string, string> = {
  'ACKO needs documents':
    'border-endorse-policy-badge-error-border bg-endorse-policy-badge-error-bg text-endorse-policy-badge-error-text',
  'Approved · invoice due':
    'border-endorse-policy-badge-warning-border bg-endorse-policy-badge-warning-bg text-endorse-policy-badge-warning-text',
  'Upload invoice':
    'border-endorse-policy-badge-warning-border bg-endorse-policy-badge-warning-bg text-endorse-policy-badge-warning-text',
  'Invoice approved': 'border-transparent bg-create-claim-button/10 text-create-claim-button',
  'Waiting for payment': 'border-transparent bg-create-claim-button/10 text-create-claim-button',
  'With ACKO': 'border-transparent bg-secondary text-pagination-text',
  'Not covered':
    'border-endorse-policy-badge-error-border bg-endorse-policy-badge-error-bg text-endorse-policy-badge-error-text',
  'Query raised': 'border-transparent bg-create-claim-button/10 text-create-claim-button',
  Paid: 'border-endorse-policy-badge-success-border bg-endorse-policy-badge-success-bg text-endorse-policy-badge-success-text',
  'Closed · reopenable':
    'border-endorse-policy-badge-success-border bg-endorse-policy-badge-success-bg text-endorse-policy-badge-success-text',
};

const CLAIM_TABS: { id: ClaimBucket | 'open'; label: string }[] = [
  { id: 'open', label: 'All open' },
  { id: 'waiting', label: 'Waiting on you' },
  { id: 'acko', label: 'With ACKO' },
  { id: 'payment', label: 'Payment' },
  { id: 'closed', label: 'Closed' },
];

export function OngoingClaimsSection() {
  const { partner } = useParams<{ partner: string }>();
  const currentSource = useDataSource();
  const raisedClaims = useRaisedClaimsStore((state) => state.claims);
  const hydrateRaisedClaims = useRaisedClaimsStore((state) => state.hydrate);
  const [claimFilter, setClaimFilter] = useState<ClaimBucket | 'open'>('open');

  useEffect(() => {
    hydrateRaisedClaims();
  }, [hydrateRaisedClaims]);

  const raisedRows: ClaimRow[] = raisedClaims
    .filter((claim) => !OPEN_CLAIMS.some((row) => row.id === claim.id))
    .map((claim) => ({
      id: claim.id,
      customer: claim.customer,
      vehicle: `${claim.vehicle} · ${claim.registration}`,
      raised: claim.raisedOn,
      status: 'With ACKO',
      actor: 'ACKO' as const,
      next: 'In review',
      bucket: 'acko' as const,
    }));
  const openClaims = [...raisedRows, ...OPEN_CLAIMS];
  const claims = [...openClaims, ...CLOSED_CLAIMS];
  const visibleClaims = claims.filter((claim) =>
    claimFilter === 'open' ? claim.bucket !== 'closed' : claim.bucket === claimFilter,
  );
  const claimCounts = useMemo(
    () => ({
      open: openClaims.length,
      waiting: openClaims.filter((claim) => claim.bucket === 'waiting').length,
      acko: openClaims.filter((claim) => claim.bucket === 'acko').length,
      payment: openClaims.filter((claim) => claim.bucket === 'payment').length,
      closed: CLOSED_CLAIMS.length,
    }),
    [openClaims],
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="border-claims-table-border flex gap-1 overflow-x-auto border-b">
        {CLAIM_TABS.map((tab) => {
          const selected = claimFilter === tab.id;
          const count = claimCounts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setClaimFilter(tab.id)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm',
                selected
                  ? 'border-create-claim-button text-create-claim-button'
                  : 'text-pagination-text-muted border-transparent',
              )}
            >
              {tab.label}
              {tab.id === 'closed' ? null : (
                <span
                  className={cn(
                    'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
                    selected ? 'bg-create-claim-button text-white' : 'bg-secondary text-pagination-text',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="border-claims-management-table-border rounded-claims-management-table overflow-hidden border bg-white">
        <Table>
          <TableHeader className="bg-claims-management-table-header-bg">
            <TableRow className="border-claims-table-border h-10 hover:bg-transparent">
              <TableHead className="pl-6">Claim</TableHead>
              <TableHead>Customer and vehicle</TableHead>
              <TableHead>Raised</TableHead>
              <TableHead className="pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleClaims.map((claim) => (
              <TableRow key={claim.id} className="border-claims-management-table-border h-14 hover:bg-transparent">
                <TableCell className="pl-6">
                  <Link
                    href={claimHref(partner, claim.id, currentSource)}
                    className="text-claims-management-table-link text-sm font-medium"
                  >
                    {claim.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium text-pagination-text">{claim.customer}</p>
                  <p className="text-sm text-pagination-text-muted">{claim.vehicle}</p>
                </TableCell>
                <TableCell className="text-sm text-pagination-text">{claim.raised}</TableCell>
                <TableCell className="pr-6">
                  <Badge className={cn('border px-2 py-0.5 text-xs font-medium', BADGE_CLASS[claim.status])}>
                    {claim.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function claimHref(partner: string, claimNumber: string, source: DataSource) {
  return appendSourceQueryParam(
    `/${partner}/dashboard/claim-details`,
    `claimNumber=${encodeURIComponent(claimNumber)}`,
    source,
  );
}
