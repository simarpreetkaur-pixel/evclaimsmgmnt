'use client';

import { useId, type ReactNode } from 'react';
import { AlertCircle, Clock3, LockKeyhole, RefreshCw, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useFinancialWorkspace } from './provider';

const brandMenuContentStyles =
  'rounded-md border border-simple-select-border bg-white p-1 shadow-simple-select';

const brandMenuItemStyles =
  'cursor-pointer focus:bg-simple-select-accent-bg focus:text-simple-select-accent data-[state=checked]:bg-simple-select-accent-bg data-[state=checked]:text-simple-select-accent data-[state=checked]:font-medium [&_svg]:text-simple-select-accent rounded-simple-select-item py-1.5 pr-8 pl-2.5 text-sm text-simple-select-text';

export function Picker({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; description?: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const selected = options.find((o) => o.value === value);
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="text-xs font-medium text-pagination-text-muted">
          {label}
        </label>
      ) : null}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className="h-9 w-full min-w-36 justify-between gap-2 rounded-md border-simple-select-border bg-white px-3.5 py-2 text-sm font-medium text-simple-select-text shadow-simple-select-trigger hover:bg-simple-select-accent-bg/40 focus-visible:border-simple-select-accent focus-visible:ring-simple-select-accent/25 [&>svg]:opacity-50"
        >
          <SelectValue>{selected ? selected.label : ''}</SelectValue>
        </SelectTrigger>
        <SelectContent align="start" className={brandMenuContentStyles}>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className={brandMenuItemStyles}>
              {o.description ? (
                <div className="flex flex-col text-left">
                  <span className="font-medium leading-snug">{o.label}</span>
                  <span className="text-xs font-normal text-pagination-text-muted">
                    {o.description}
                  </span>
                </div>
              ) : (
                o.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function BrandInlineSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const selected = options.find((o) => o.value === value);
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          'flex h-9 min-w-fit cursor-pointer items-center justify-between gap-2 rounded-md border border-labeled-select-border bg-white px-4 py-2 text-sm font-medium text-labeled-select-text shadow-labeled-select-trigger hover:bg-labeled-select-accent-bg/40 focus-visible:border-labeled-select-accent focus-visible:ring-labeled-select-accent/25 [&>svg]:opacity-50',
          className,
        )}
      >
        <span className="truncate text-left">
          <span className="font-normal text-pagination-text-muted">{label}: </span>
          <span className="font-medium text-labeled-select-text">
            {selected ? selected.label : ''}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent align="end" className={brandMenuContentStyles}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className={brandMenuItemStyles}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function BrandSegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex items-center rounded-segmented-tabs border border-border bg-segmented-tabs-bg p-segmented-tabs-padding',
        className,
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'cursor-pointer rounded-segmented-tab px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-segmented-tab-active-bg text-segmented-tab-active-text font-semibold shadow-2xs'
                : 'text-pagination-text-muted hover:text-segmented-tab-text',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = ['healthy', 'paid', 'approved', 'resolved', 'matched'].includes(status)
    ? 'finance-success'
    : ['failed', 'blocked', 'recovery', 'rejected', 'error'].includes(status)
      ? 'finance-danger'
      : ['pending', 'awaiting-activation', 'open', 'grace', 'low', 'stale', 'mismatch'].includes(
            status,
          )
        ? 'finance-warning'
        : 'finance-neutral';
  return (
    <Badge variant="outline" className={cn('capitalize whitespace-nowrap font-normal', tone)}>
      {status.replaceAll('-', ' ')}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon = 'empty',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: 'empty' | 'error' | 'access';
}) {
  const Icon = icon === 'error' ? AlertCircle : icon === 'access' ? LockKeyhole : Inbox;
  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function DataGate({
  children,
  financial = true,
}: {
  children: ReactNode;
  financial?: boolean;
}) {
  const { snapshot, view, system, pending } = useFinancialWorkspace();
  if (snapshot.dataState === 'loading')
    return (
      <div role="status" aria-label="Loading financial data" className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <p className="text-sm text-muted-foreground">Loading the verified financial snapshot…</p>
      </div>
    );
  if (snapshot.dataState === 'error')
    return (
      <EmptyState
        icon="error"
        title="We couldn’t load financial data"
        description="No balance is being shown. Retry to retrieve a verified snapshot. Your workflow requests are preserved."
        action={
          <Button variant="outline" disabled={pending} onClick={() => system('refresh')}>
            <RefreshCw />
            Retry loading
          </Button>
        }
      />
    );
  if (
    snapshot.dataState === 'no-access' ||
    (financial && !view.actor.capabilities.includes('view'))
  )
    return (
      <EmptyState
        icon="access"
        title="Financial access is not included"
        description="Your partner and plan access does not grant access to VAN statements. Ask your access administrator for the specific wallet group and VAN grant you need."
      />
    );
  return children;
}

export function ApdBanner({ compact = false }: { compact?: boolean }) {
  const { snapshot } = useFinancialWorkspace();
  const uncertain = snapshot.dataState !== 'ready' || snapshot.reconciliation === 'mismatch';
  const mode = uncertain ? 'unknown' : !snapshot.apdEnabled ? 'disabled' : snapshot.apd;
  const content = {
    disabled: [
      'Automatic funding restrictions are not enabled',
      'Balances still require reconciliation. Automatic grace, blocking and recovery rules are not applied to this group.',
    ],
    healthy: ['Issuance is active', 'Funds are available for new policies.'],
    low: ['Balance is running low', 'Review funding now to reduce the risk of entering grace.'],
    grace: [
      'Funding needed before the deadline',
      'Issuance continues until 23 Oct, 6:00 PM IST. Arrange funding with your finance owner before the deadline.',
    ],
    blocked: [
      'New issuance is blocked',
      'Grace has ended for the whole wallet group. Recovery is due 27 Oct, 6:00 PM IST. Blocked attempts do not replay automatically.',
    ],
    recovery: [
      'Recovery expired · manual review required',
      'Finance and Business must review affected policies and claims exceptions. No automatic cancellation has occurred.',
    ],
    unknown: [
      'Current policy issuance status needs verification',
      'Source data is incomplete or delayed. The last verified snapshot cannot confirm the current issuance state.',
    ],
  }[mode];
  if (mode === 'healthy') return null;
  const Icon = mode === 'grace' || mode === 'low' ? Clock3 : AlertCircle;
  return (
    <section
      className={cn(
        'finance-banner',
        ['blocked', 'recovery'].includes(mode) ? 'finance-danger' : 'finance-warning',
      )}
      role="status"
    >
      <Icon className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{content[0]}</div>
        <p className="mt-1 text-sm leading-5 opacity-90">{content[1]}</p>
        {!compact && (
          <p className="mt-2 text-xs opacity-75">
            {snapshot.groupName} wallet group · {snapshot.memberVanIds.length} distinct VANs ·
            mapping v{snapshot.mappingVersion}
          </p>
        )}
      </div>
    </section>
  );
}

export function SourceLine() {
  const { snapshot } = useFinancialWorkspace();
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn(
          'size-1.5 rounded-full',
          snapshot.dataState === 'ready' && snapshot.reconciliation === 'matched'
            ? 'bg-balance-coverage-current'
            : 'bg-balance-coverage-recharge-primary',
        )}
      />
      Last fetched on{' '}
      {new Date(snapshot.cutoff).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}{' '}
      IST
      {(snapshot.dataState !== 'ready' || snapshot.reconciliation !== 'matched') && (
        <span>
          ·{' '}
          {snapshot.dataState === 'empty'
            ? 'Awaiting initial verified snapshot'
            : snapshot.dataState === 'stale'
              ? 'Current source confirmation pending'
              : snapshot.reconciliation === 'mismatch'
                ? 'Reconciliation mismatch · investigate before acting'
                : 'Verification pending'}
        </span>
      )}
    </p>
  );
}
