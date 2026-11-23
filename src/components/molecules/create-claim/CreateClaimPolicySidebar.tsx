import type { ComponentPropsWithoutRef } from 'react';
import type { CreateClaimPolicySummaryRow } from '@/lib/utils/createClaim';
import { cn } from '@/lib/utils';

export const CREATE_CLAIM_POLICY_SIDEBAR_CLASS =
  'border-pagination-border bg-muted w-full shrink-0 rounded-[10px] border px-4 py-3 shadow-xs lg:sticky lg:top-4 lg:w-width-280 lg:max-h-[min(650px,calc(100vh-140px))] lg:overflow-y-auto';

export type CreateClaimPolicySidebarProps = {
  rows: CreateClaimPolicySummaryRow[];
  /** Used for stacking row padding (matches claim-details vs bank-verification comps). */
  rowDensity?: 'compact' | 'comfortable';
} & Omit<ComponentPropsWithoutRef<'aside'>, 'children'>;

export function CreateClaimPolicySidebar({
  rows,
  rowDensity = 'compact',
  className,
  ...asideProps
}: CreateClaimPolicySidebarProps) {
  const rowSpacing = rowDensity === 'comfortable' ? 'py-3' : 'py-2';

  return (
    <aside className={className} {...asideProps}>
      <dl className="flex flex-col gap-0 text-sm leading-5">
        {rows.map((row, i) => (
          <div
            key={`${row.label}-${i}`}
            className={cn(
              'flex flex-col gap-2',
              rowSpacing,
              i < rows.length - 1 && 'border-b border-pagination-border',
            )}
          >
            <dt className="font-normal text-pagination-text-muted">{row.label}</dt>
            <dd className="font-semibold break-words text-pagination-text">{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
