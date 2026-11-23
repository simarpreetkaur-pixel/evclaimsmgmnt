import type { ReactNode } from 'react';

export function CreateClaimStepActions({ children }: { children: ReactNode }) {
  return (
    <div className="border-claims-table-border bg-card z-10 flex shrink-0 flex-col gap-3 border-t px-1 py-4 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}
