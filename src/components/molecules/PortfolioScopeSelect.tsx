'use client';

import { useMemo, useState } from 'react';
import { ChevronDownIcon, Search } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { portfolioDealerships, useCustomerConfigs, usePortfolioSelectionStore } from '@/lib/prototype/customers';

export function PortfolioScopeSelect() {
  const customers = useCustomerConfigs();
  const dealerships = useMemo(() => portfolioDealerships(customers), [customers]);
  const brandIds = usePortfolioSelectionStore((state) => state.brandIds);
  const pickedIds = usePortfolioSelectionStore((state) => state.pickedIds);
  const setPickedIds = usePortfolioSelectionStore((state) => state.setPickedIds);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const scoped = useMemo(
    () => dealerships.filter((dealership) => brandIds.includes(dealership.customerId)),
    [brandIds, dealerships],
  );
  const scopedIds = scoped.map((dealership) => dealership.id);
  const selectedIds = (pickedIds ?? dealerships.map((dealership) => dealership.id)).filter((id) =>
    scopedIds.includes(id),
  );
  const selected = new Set(selectedIds);
  const allScopedSelected = scopedIds.length > 0 && scopedIds.every((id) => selected.has(id));
  const query = search.trim().toLowerCase();
  const visible = query
    ? scoped.filter((dealership) => dealership.name.toLowerCase().includes(query))
    : scoped;

  const commit = (next: Set<string>) => {
    if (next.size === dealerships.length) {
      setPickedIds(null);
      return;
    }
    setPickedIds([...next]);
  };

  const selectionWith = (mutate: (next: Set<string>) => void) => {
    const next = new Set(pickedIds ?? dealerships.map((dealership) => dealership.id));
    mutate(next);
    commit(next);
  };

  const toggleDealership = (id: string) => {
    selectionWith((next) => {
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
    });
  };

  const toggleAll = () => {
    selectionWith((next) => {
      scopedIds.forEach((id) => (allScopedSelected ? next.delete(id) : next.add(id)));
    });
  };

  const label = dealershipLabel(scoped, selectedIds);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch('');
        }
      }}
    >
      <PopoverTrigger
        type="button"
        className="flex h-9 min-w-fit max-w-72 cursor-pointer items-center justify-between gap-2 rounded-md border border-labeled-select-border bg-white px-4 py-2 text-sm font-medium text-labeled-select-text shadow-labeled-select-trigger"
      >
        <span className="truncate text-left">
          <span className="text-pagination-text-muted">Dealerships: </span>
          <span>{label}</span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-labeled-select-border px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dealerships"
            aria-label="Search dealerships"
            autoFocus
            className="h-9 border-0 bg-transparent px-0 shadow-none hover:bg-transparent focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {query.length === 0 ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
              <Checkbox
                checked={allScopedSelected}
                aria-label="All dealerships"
                onCheckedChange={toggleAll}
              />
              <span className="font-medium text-pagination-text">All dealerships</span>
            </label>
          ) : null}
          {visible.map((dealership) => (
            <label
              key={dealership.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={selected.has(dealership.id)}
                aria-label={dealership.name}
                onCheckedChange={() => toggleDealership(dealership.id)}
              />
              <span className="text-pagination-text">{dealership.name}</span>
            </label>
          ))}
          {visible.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">No dealerships found</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function dealershipLabel(
  dealerships: { id: string; name: string }[],
  selectedIds: string[],
) {
  if (selectedIds.length === 0) {
    return 'None';
  }
  if (selectedIds.length === dealerships.length) {
    return 'All';
  }
  if (selectedIds.length === 1) {
    return dealerships.find((dealership) => dealership.id === selectedIds[0])?.name ?? '1 dealership';
  }
  return `${selectedIds.length} dealerships`;
}
