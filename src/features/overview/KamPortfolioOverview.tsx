'use client';

import { useMemo, type ReactNode } from 'react';

import { PageHeading, PAGE_LAYOUT_CLASS } from '@/components/molecules/PageHeading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { portfolioDealerships, useCustomerConfigs, usePortfolioSelectionStore } from '@/lib/prototype/customers';
import { getPrototypeFirstName } from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';
import { cn } from '@/lib/utils';

const SURFACE_CLASS =
  'rounded-metric-card border border-metric-card-border bg-white shadow-endorse-policy-card';

function rateLabel(approved: number, decided: number) {
  if (decided <= 0) {
    return '—';
  }
  return `${Math.round((approved / decided) * 100)}%`;
}

function daysLabel(totalDays: number, decided: number) {
  if (decided <= 0) {
    return '—';
  }
  return `${Math.round(totalDays / decided)} days`;
}

export function KamPortfolioOverview({ toolbar }: { toolbar?: ReactNode }) {
  const customers = useCustomerConfigs();
  const { userProfile } = useUserProfileStore();
  const dealerships = useMemo(() => portfolioDealerships(customers), [customers]);
  const brandIds = usePortfolioSelectionStore((state) => state.brandIds);
  const pickedIds = usePortfolioSelectionStore((state) => state.pickedIds);
  const inBrand = useMemo(
    () => dealerships.filter((dealership) => brandIds.includes(dealership.customerId)),
    [brandIds, dealerships],
  );
  const selectedIds = (pickedIds ?? inBrand.map((dealership) => dealership.id)).filter((id) =>
    inBrand.some((dealership) => dealership.id === id),
  );
  const selected = inBrand.filter((dealership) => selectedIds.includes(dealership.id));
  const firstName = userProfile?.email
    ? getPrototypeFirstName(userProfile.email)
    : userProfile?.firstName?.trim();

  const totals = selected.reduce(
    (sum, dealership) => ({
      ongoing: sum.ongoing + dealership.ongoing,
      raised: sum.raised + dealership.raised,
      approved: sum.approved + dealership.approved,
      decided: sum.decided + dealership.decided,
      dayWeight: sum.dayWeight + dealership.avgDaysToPayment * dealership.decided,
    }),
    { ongoing: 0, raised: 0, approved: 0, decided: 0, dayWeight: 0 },
  );
  return (
    <div className={PAGE_LAYOUT_CLASS}>
      <PageHeading
        title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
        subtitle="Ongoing claims for the dealerships chosen in the header. This view stays high level."
      />
      {toolbar}

      {selected.length === 0 ? (
        <p className="text-sm text-pagination-text-muted">Choose at least one dealership to see the overview.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Ongoing claims" value={String(totals.ongoing)} detail="Open right now" />
            <Metric label="Approval rate" value={rateLabel(totals.approved, totals.decided)} detail="Of decided claims" />
            <Metric
              label="Avg. days to payment"
              value={daysLabel(totals.dayWeight, totals.decided)}
              detail="From claim to payment"
            />
            <Metric label="Claims raised" value={String(totals.raised)} detail="This month" />
          </div>
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold leading-none text-pagination-text">By dealership</h2>
              <p className="text-sm text-pagination-text-muted">
                {selected.length === 1 ? 'This dealership.' : `${selected.length} dealerships in this view.`}
              </p>
            </div>
            <div className="border-claims-management-table-border rounded-claims-management-table overflow-hidden border bg-white">
              <Table>
                <TableHeader className="bg-claims-management-table-header-bg">
                  <TableRow className="border-claims-table-border h-10 hover:bg-transparent">
                    <TableHead className="pl-6">Dealership</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Ongoing</TableHead>
                    <TableHead>Approval rate</TableHead>
                    <TableHead className="pr-6">Avg. days to payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.map((dealership) => (
                    <TableRow
                      key={dealership.id}
                      className="border-claims-management-table-border h-12 hover:bg-transparent"
                    >
                      <TableCell className="pl-6 text-sm font-medium text-pagination-text">{dealership.name}</TableCell>
                      <TableCell className="text-sm text-pagination-text">{dealership.customerName}</TableCell>
                      <TableCell className="text-sm text-pagination-text">{dealership.ongoing}</TableCell>
                      <TableCell className="text-sm text-pagination-text">
                        {rateLabel(dealership.approved, dealership.decided)}
                      </TableCell>
                      <TableCell className="pr-6 text-sm text-pagination-text">
                        {dealership.decided > 0 ? `${dealership.avgDaysToPayment} days` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className={cn(SURFACE_CLASS, 'flex flex-col gap-1 px-5 py-4')}>
      <p className="text-sm text-pagination-text-muted">{label}</p>
      <p className="text-3xl font-semibold tracking-tight text-pagination-text">{value}</p>
      <p className="text-sm text-pagination-text-muted">{detail}</p>
    </div>
  );
}
