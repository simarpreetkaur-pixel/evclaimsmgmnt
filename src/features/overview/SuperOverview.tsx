'use client';

import { PersonaOverview } from '@/features/overview/PersonaOverview';
import { KamPortfolioOverview } from '@/features/overview/KamPortfolioOverview';
import { usePortfolioSelectionStore } from '@/lib/prototype/customers';
import { cn } from '@/lib/utils';

type SuperView = 'desk' | 'portfolio';

export function SuperOverview() {
  const view = usePortfolioSelectionStore((state) => state.superView);
  const setView = usePortfolioSelectionStore((state) => state.setSuperView);
  const toolbar = <CustomerScopeSwitch value={view} onChange={setView} />;

  if (view === 'portfolio') {
    return <KamPortfolioOverview toolbar={toolbar} />;
  }

  return <PersonaOverview variant="super" toolbar={toolbar} />;
}

function CustomerScopeSwitch({
  value,
  onChange,
}: {
  value: SuperView;
  onChange: (value: SuperView) => void;
}) {
  const options: Array<{ id: SuperView; label: string }> = [
    { id: 'desk', label: 'This dealership' },
    { id: 'portfolio', label: 'All customers' },
  ];

  return (
    <div className="flex w-fit rounded-full bg-zinc-100 p-1" role="tablist" aria-label="Overview scope">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            'h-8 rounded-full px-4 text-sm font-medium',
            value === option.id ? 'bg-create-claim-button text-white' : 'text-pagination-text',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
