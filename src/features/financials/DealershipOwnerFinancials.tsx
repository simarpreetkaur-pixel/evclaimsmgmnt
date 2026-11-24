'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';

import DateRangePicker from '@/components/molecules/DateRangePicker';
import { PageHeading, PAGE_LAYOUT_CLASS } from '@/components/molecules/PageHeading';
import SimpleSelect from '@/components/molecules/SimpleSelect';
import UnderlineTabs from '@/components/molecules/UnderlineTabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePartnersQuery } from '@/lib/query/partnerConfig.queries';
import { usePartnerStore } from '@/lib/store/partner.store';
import { getPrototypeFirstName } from '@/lib/prototype/session';
import {
  formatInr,
  formatInrCompact,
  OWNER_PENDING_AMOUNT,
  OWNER_PERIODS,
  OWNER_WALLET_BALANCE,
  snapshotForCustomRange,
  snapshotForPeriod,
  type OwnerPeriod,
  type WalletStatus,
} from '@/lib/prototype/ownerDashboard';
import { useUserProfileStore } from '@/lib/store/userProfile.store';
import { cn } from '@/lib/utils';

const SURFACE_CLASS =
  'rounded-metric-card border border-metric-card-border bg-white shadow-endorse-policy-card';

const STATUS_CLASS: Record<WalletStatus, string> = {
  Credited:
    'border-endorse-policy-badge-success-border bg-endorse-policy-badge-success-bg text-endorse-policy-badge-success-text',
  Pending:
    'border-endorse-policy-badge-warning-border bg-endorse-policy-badge-warning-bg text-endorse-policy-badge-warning-text',
  Debited: 'border-transparent bg-secondary text-pagination-text',
};

const MONEY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Credit' },
  { id: 'debit', label: 'Debit' },
] as const;

type MoneyFilter = (typeof MONEY_FILTERS)[number]['id'];

function isCredit(status: WalletStatus) {
  return status === 'Credited' || status === 'Pending';
}

export function DealershipOwnerFinancials() {
  const { partner } = useParams<{ partner: string }>();
  const { partnerId } = usePartnerStore();
  const { data: partnersData } = usePartnersQuery();
  const { userProfile } = useUserProfileStore();
  const firstName = userProfile?.email
    ? getPrototypeFirstName(userProfile.email)
    : userProfile?.firstName?.trim();
  const selectedPartner = partnersData?.partners.find((item) => item.id === (partner || partnerId));
  const dealershipName =
    selectedPartner?.display_name?.trim() ||
    selectedPartner?.displayName?.trim() ||
    'this dealership';
  const [period, setPeriod] = useState<OwnerPeriod>('this-month');
  const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [moneyFilter, setMoneyFilter] = useState<MoneyFilter>('all');

  const snapshot = useMemo(() => {
    if (period === 'custom' && range.from && range.to) {
      return snapshotForCustomRange(range.from, range.to);
    }
    if (period === 'custom') {
      return snapshotForPeriod('this-month');
    }
    return snapshotForPeriod(period);
  }, [period, range.from, range.to]);

  const counts = useMemo(
    () => ({
      all: snapshot.transactions.length,
      credit: snapshot.transactions.filter((item) => isCredit(item.status)).length,
      debit: snapshot.transactions.filter((item) => item.status === 'Debited').length,
    }),
    [snapshot.transactions],
  );
  const visibleTransactions = snapshot.transactions.filter((item) => {
    if (moneyFilter === 'credit') return isCredit(item.status);
    if (moneyFilter === 'debit') return item.status === 'Debited';
    return true;
  });

  return (
    <div className={PAGE_LAYOUT_CLASS}>
      <PageHeading
        title="Financials"
        subtitle={
          firstName
            ? `${firstName}, this is the wallet for ${dealershipName}. Balance and pending are current.`
            : `Wallet for ${dealershipName}. Balance and pending are current.`
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Wallet balance"
          value={formatInrCompact(OWNER_WALLET_BALANCE)}
          detail="Current balance"
        />
        <MetricCard
          label="Total amount credited"
          value={formatInrCompact(snapshotForPeriod('this-month').credited)}
          detail="Credited this month"
        />
        <MetricCard
          label="Pending amount"
          value={formatInrCompact(OWNER_PENDING_AMOUNT)}
          detail="Still waiting to be credited"
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold leading-none text-pagination-text">Wallet activity</h2>
            <p className="text-sm text-pagination-text-muted">
              Credits coming in, and the battery collection charge going out.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SimpleSelect
              value={period}
              onValueChange={(value) => setPeriod(value as OwnerPeriod)}
              options={OWNER_PERIODS.map((item) => ({ value: item.id, label: item.label }))}
              className="h-9 w-40"
            />
            {period === 'custom' ? (
              <DateRangePicker value={range} onChange={setRange} placeholder="Select dates" />
            ) : null}
          </div>
        </div>
        <div className="border-claims-management-table-border rounded-claims-management-table overflow-hidden border bg-white">
          <div className="border-claims-management-table-border border-b">
            <UnderlineTabs
              value={moneyFilter}
              onValueChange={(value) => setMoneyFilter(value as MoneyFilter)}
              tabs={MONEY_FILTERS.map((filter) => ({
                value: filter.id,
                label: `${filter.label} · ${counts[filter.id]}`,
              }))}
            />
          </div>
          <Table>
            <TableHeader className="bg-claims-management-table-header-bg">
              <TableRow className="border-claims-table-border border-b-claims-table-border h-10 hover:bg-transparent">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTransactions.length === 0 ? (
                <TableRow className="border-claims-table-border border-b-claims-table-border hover:bg-transparent">
                  <TableCell colSpan={4} className="text-pagination-text-muted py-8 text-center">
                    No transactions in this filter.
                  </TableCell>
                </TableRow>
              ) : (
                visibleTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="border-claims-management-table-border border-b-claims-management-table-border h-10 hover:bg-transparent"
                  >
                    <TableCell className="pl-6 text-sm">{transaction.date}</TableCell>
                    <TableCell className="text-sm">{transaction.reference}</TableCell>
                    <TableCell className="text-sm tabular-nums">{formatInr(transaction.amount)}</TableCell>
                    <TableCell className="pr-6">
                      <Badge
                        className={cn(
                          'border px-2 py-0.5 text-xs font-medium',
                          STATUS_CLASS[transaction.status],
                        )}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className={cn(SURFACE_CLASS, 'flex flex-col gap-1.5 px-6 py-4')}>
      <p className="text-sm leading-5 text-pagination-text-muted">{label}</p>
      <p className="text-metric-card-value font-semibold leading-9 text-metric-card-text">{value}</p>
      <p className="text-sm leading-5 text-pagination-text-muted">{detail}</p>
    </div>
  );
}
