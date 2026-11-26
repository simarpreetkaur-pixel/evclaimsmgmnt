'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CircleHelp, PlusIcon } from 'lucide-react';

import { PageHeading, PAGE_LAYOUT_CLASS } from '@/components/molecules/PageHeading';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDataSource } from '@/lib/hooks/useDataSourceUrlState';
import type { DataSource } from '@/lib/constants/global.constants';
import { getPrototypeFirstName } from '@/lib/prototype/session';
import { usePartnersQuery } from '@/lib/query/partnerConfig.queries';
import { usePartnerStore } from '@/lib/store/partner.store';
import { useUserProfileStore } from '@/lib/store/userProfile.store';
import { appendSourceQueryParam } from '@/lib/utils/dataSource.utils';
import { cn } from '@/lib/utils';
import {
  APPROVAL_ROWS,
  CLAIM_BARS,
  MONEY_BARS,
  QUERY_ACTIONS,
  REJECTION_REASONS,
  TEAM_ROWS,
  UPLOAD_ACTIONS,
  type ActionGroup,
  type ActionItem,
  type OverviewVariant,
} from '@/features/overview/overviewContent';

const SURFACE_CLASS =
  'rounded-metric-card border border-metric-card-border bg-white shadow-endorse-policy-card';

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

export function PersonaOverview({ variant, toolbar }: { variant: OverviewVariant; toolbar?: ReactNode }) {
  const { partner } = useParams<{ partner: string }>();
  const { partnerId } = usePartnerStore();
  const { data: partnersData } = usePartnersQuery();
  const { userProfile } = useUserProfileStore();
  const currentSource = useDataSource();
  const [actionFilter, setActionFilter] = useState<ActionGroup | 'all'>('all');

  const firstName = userProfile?.email
    ? getPrototypeFirstName(userProfile.email)
    : userProfile?.firstName?.trim();
  const selectedPartner = partnersData?.partners.find((item) => item.id === (partner || partnerId));
  const dealershipName =
    selectedPartner?.display_name?.trim() ||
    selectedPartner?.displayName?.trim() ||
    'Ather Indiranagar';
  const raiseClaimHref = appendSourceQueryParam(`/${partner}/dashboard/create-claim`, '', currentSource);
  const financialsHref = appendSourceQueryParam(`/${partner}/dashboard/financials`, '', currentSource);
  const showRaise = variant !== 'owner';
  const showUploads = variant !== 'owner';
  const showPerformance = variant !== 'ops';
  const showQueries = variant !== 'ops';
  const actions = [
    ...(showUploads ? UPLOAD_ACTIONS : []),
    ...(showQueries ? QUERY_ACTIONS : []),
  ];
  const visibleActions = actions.filter((item) => actionFilter === 'all' || item.group === actionFilter);
  const actionCounts = {
    all: actions.length,
    documents: actions.filter((item) => item.group === 'documents').length,
    invoices: actions.filter((item) => item.group === 'invoices').length,
  };

  return (
    <div className={PAGE_LAYOUT_CLASS}>
      <PageHeading
        title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
        subtitle={`Here's how ${dealershipName} is doing this month.`}
        actions={
          showRaise ? (
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
      {toolbar}

      {variant === 'ops' ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Ongoing claims" value="14" detail="Open right now" />
          <MetricCard label="Uploads due" value="5" detail="3 documents · 2 invoices" tone="danger" />
          <MetricCard label="Waiting for payment" value="3" detail="ACKO to pay" />
        </div>
      ) : null}

      {variant === 'super' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Ongoing claims" value="14" detail="Open right now" />
            <MetricCard label="Uploads due" value="5" detail="3 documents · 2 invoices" tone="danger" />
            <MetricCard label="Waiting for payment" value="3" detail="ACKO to pay" />
            <MetricCard
              label="Claims raised"
              value="38"
              detail={
                <>
                  This month · on track to beat Oct <span className="text-emerald-600">(12)</span>
                </>
              }
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <MetricCard label="Approval rate" value="87%" detail="↑ 2 pts vs last month" tone="good" />
            <MetricCard label="Avg. days to payment" value="9 days" detail="↓ 1 day vs last month" tone="good" />
            <WalletCard href={financialsHref} />
          </div>
        </>
      ) : null}

      {variant === 'owner' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Ongoing claims" value="14" detail="Open right now" />
            <MetricCard
              label="Claims raised"
              value="38"
              detail={
                <>
                  This month · on track to beat Oct <span className="text-emerald-600">(12)</span>
                </>
              }
            />
            <MetricCard label="Approval rate" value="87%" detail="↑ 2 pts vs last month" tone="good" />
            <MetricCard label="Avg. days to payment" value="9 days" detail="↓ 1 day vs last month" tone="good" />
          </div>
          <WalletCard href={financialsHref} hug />
        </>
      ) : null}

      {showPerformance ? <PerformanceSection /> : null}

      {variant !== 'owner' ? (
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold leading-none text-pagination-text">Needs your action</h2>
          <p className="text-sm text-pagination-text-muted">Claims waiting on you. Oldest first.</p>
        </div>
        {showUploads ? (
          <div className="flex w-full rounded-full bg-zinc-100 p-1">
            {(
              [
                ['all', 'All', actionCounts.all],
                ['documents', 'Documents', actionCounts.documents],
                ['invoices', 'Invoices', actionCounts.invoices],
              ] as const
            ).map(([id, label, count]) => {
              const selected = actionFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActionFilter(id)}
                  className={cn(
                    'flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-sm',
                    selected
                      ? 'bg-create-claim-button text-white'
                      : 'text-pagination-text hover:bg-white/70',
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
                      selected ? 'bg-white/20 text-white' : 'bg-create-claim-button/15 text-create-claim-button',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        <ul className="flex flex-col gap-3">
          {visibleActions.map((item) => (
            <ActionCard key={item.id} item={item} partner={partner} source={currentSource} />
          ))}
        </ul>
      </section>
      ) : null}

      {showPerformance ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold leading-none text-pagination-text">Team</h2>
            <p className="text-sm text-pagination-text-muted">How each advisor is doing this month.</p>
          </div>
          <div className="border-claims-management-table-border rounded-claims-management-table overflow-hidden border bg-white">
            <Table>
              <TableHeader className="bg-claims-management-table-header-bg">
                <TableRow className="border-claims-table-border h-10 hover:bg-transparent">
                  <TableHead className="pl-6">Advisor</TableHead>
                  <TableHead>Claims raised</TableHead>
                  <TableHead>Approval rate</TableHead>
                  <TableHead>Time to reply to ACKO</TableHead>
                  <TableHead className="pr-6">Waiting on them</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEAM_ROWS.map((person) => (
                  <TableRow
                    key={person.name}
                    className="border-claims-management-table-border h-12 hover:bg-transparent"
                  >
                    <TableCell className="pl-6 text-sm font-medium">{person.name}</TableCell>
                    <TableCell className="text-sm">{person.raised}</TableCell>
                    <TableCell className="text-sm">{person.rate}</TableCell>
                    <TableCell className="text-sm">{person.reply}</TableCell>
                    <TableCell className="pr-6 text-sm">{person.waiting}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: ReactNode;
  tone?: 'danger' | 'good';
}) {
  return (
    <div className={cn(SURFACE_CLASS, 'flex flex-col gap-1 px-5 py-4')}>
      <p className="text-sm text-pagination-text-muted">{label}</p>
      <p className="text-3xl font-semibold tracking-tight text-pagination-text">{value}</p>
      <p
        className={cn(
          'text-sm',
          tone === 'danger' && 'text-red-600',
          tone === 'good' && 'text-emerald-600',
          !tone && 'text-pagination-text-muted',
        )}
      >
        {detail}
      </p>
    </div>
  );
}

function WalletCard({ href, hug = false }: { href: string; hug?: boolean }) {
  return (
    <div className={cn(SURFACE_CLASS, 'flex flex-col gap-1 px-5 py-4', hug && 'w-max max-w-full shrink-0')}>
      <p className="text-sm text-pagination-text-muted">Wallet balance</p>
      <p className="text-3xl font-semibold tracking-tight text-pagination-text">₹2.4L</p>
      <p className="text-sm text-pagination-text-muted">
        Current balance ·{' '}
        <Link href={href} className="text-claims-management-table-link">
          details in Financials
        </Link>
      </p>
    </div>
  );
}

function PerformanceSection() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold leading-none text-pagination-text">Trends</h2>
        <p className="text-sm text-pagination-text-muted">Last four months. November is up to 22 Nov.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={cn(SURFACE_CLASS, 'flex flex-col gap-4 px-5 py-4')}>
          <div>
            <p className="text-sm font-semibold text-pagination-text">Claims raised</p>
            <p className="text-sm text-pagination-text-muted">Per month</p>
          </div>
          <BarChart points={CLAIM_BARS} />
        </div>
        <div className={cn(SURFACE_CLASS, 'flex flex-col gap-4 px-5 py-4')}>
          <div>
            <p className="text-sm font-semibold text-pagination-text">Money received</p>
            <p className="text-sm text-pagination-text-muted">Paid by ACKO per month</p>
          </div>
          <BarChart points={MONEY_BARS} />
        </div>
        <div className={cn(SURFACE_CLASS, 'flex flex-col gap-3 px-5 py-4')}>
          <div>
            <p className="text-sm font-semibold text-pagination-text">Approval rate and speed</p>
            <p className="text-sm text-pagination-text-muted">Approved ÷ decided, and days from raising to payment</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-claims-table-border hover:bg-transparent">
                <TableHead className="h-8 px-0">Month</TableHead>
                <TableHead className="h-8 px-0">Approval rate</TableHead>
                <TableHead className="h-8 px-0 text-right">Days to payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {APPROVAL_ROWS.map((row) => (
                <TableRow key={row.month} className="border-claims-table-border hover:bg-transparent">
                  <TableCell className="px-0 py-2 text-sm">{row.month}</TableCell>
                  <TableCell className="px-0 py-2 text-sm">{row.rate}</TableCell>
                  <TableCell className="px-0 py-2 text-right text-sm">{row.days}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className={cn(SURFACE_CLASS, 'flex w-max max-w-full shrink-0 flex-col gap-3 px-5 py-4')}>
        <div>
          <p className="text-sm font-semibold text-pagination-text">Why claims were rejected</p>
          <p className="text-sm text-pagination-text-muted">4 rejections in November</p>
        </div>
        <ul className="flex flex-col gap-3">
          {REJECTION_REASONS.map((reason) => (
            <li key={reason.label} className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm whitespace-nowrap text-pagination-text">{reason.label}</p>
                <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${(reason.count / 2) * 100}%` }} />
                </div>
              </div>
              <p className="text-sm font-medium text-pagination-text">{reason.count}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BarChart({
  points,
}: {
  points: { label: string; value: number; display: string; partial?: boolean }[];
}) {
  const max = Math.max(...points.map((point) => point.value));
  return (
    <div className="flex h-44 items-end gap-4">
      {points.map((point) => (
        <div key={point.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-center text-xs text-pagination-text-muted">{point.display}</span>
          <div
            className={cn('w-full max-w-10 rounded-t-md', point.partial ? 'bg-create-claim-button/35' : 'bg-create-claim-button')}
            style={{ height: `${Math.max(12, (point.value / max) * 112)}px` }}
          />
          <span className="text-xs text-pagination-text-muted">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function ActionCard({
  item,
  partner,
  source,
}: {
  item: ActionItem;
  partner: string;
  source: DataSource;
}) {
  return (
    <li>
      <article className={cn(SURFACE_CLASS, 'flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between')}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-pagination-text">{item.customer}</h3>
            <Badge className={cn('border px-2 py-0.5 text-xs font-medium', BADGE_CLASS[item.badge])}>{item.badge}</Badge>
          </div>
          <p className="mt-1 text-sm text-pagination-text-muted">{item.vehicle}</p>
          <p className="mt-2 text-sm leading-5 text-pagination-text">{item.detail}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {item.daysLeft != null && item.daysLeft <= 3 ? (
            <p className="flex items-center gap-1 text-sm font-medium text-red-600">
              {item.daysLeft === 1 ? '1 day left' : `${item.daysLeft} days left`}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-pagination-text-muted inline-flex size-4 items-center justify-center"
                    aria-label="What happens if this is not done in time"
                  >
                    <CircleHelp className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56">
                  {`If you don't respond in ${item.daysLeft === 1 ? '1 day' : `${item.daysLeft} days`}, the claim will auto-close.`}
                </TooltipContent>
              </Tooltip>
            </p>
          ) : null}
          <Button
            asChild
            variant="outline"
            className="border-create-claim-button/20 bg-create-claim-button/10 text-create-claim-button hover:bg-create-claim-button/15 h-9 rounded-full px-4 text-sm font-medium"
          >
            <Link href={claimHref(partner, item.id, item.documentsTab, source)}>{item.action}</Link>
          </Button>
        </div>
      </article>
    </li>
  );
}

function claimHref(partner: string, claimNumber: string, documentsTab: boolean, source: DataSource) {
  const query = documentsTab
    ? `claimNumber=${encodeURIComponent(claimNumber)}&tab=documents`
    : `claimNumber=${encodeURIComponent(claimNumber)}`;
  return appendSourceQueryParam(`/${partner}/dashboard/claim-details`, query, source);
}
