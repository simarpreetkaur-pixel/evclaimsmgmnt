'use client';

import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePortfolioSelectionStore } from '@/lib/prototype/customers';

const BRANDS = [
  { id: 'ather', name: 'Ather' },
  { id: 'hero-vida', name: 'Hero Vida' },
] as const;

export function BrandCheckboxSelect() {
  const brandIds = usePortfolioSelectionStore((state) => state.brandIds);
  const setBrandIds = usePortfolioSelectionStore((state) => state.setBrandIds);
  const [open, setOpen] = useState(false);
  const selected = brandIds.length > 0 ? brandIds : ['ather'];

  const toggleBrand = (id: string) => {
    const isSelected = selected.includes(id);
    if (isSelected && selected.length === 1) {
      return;
    }
    const next = isSelected ? selected.filter((brandId) => brandId !== id) : [...selected, id];
    setBrandIds(BRANDS.map((brand) => brand.id).filter((brandId) => next.includes(brandId)));
  };

  const label = BRANDS.filter((brand) => selected.includes(brand.id))
    .map((brand) => brand.name)
    .join(' + ');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-label="Brands"
        className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-labeled-select-border bg-white px-3 text-sm font-medium text-labeled-select-text shadow-labeled-select-trigger"
      >
        <span>{label}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        {BRANDS.map((brand) => {
          const checked = selected.includes(brand.id);
          return (
            <label
              key={brand.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={checked}
                aria-label={brand.name}
                onCheckedChange={() => toggleBrand(brand.id)}
              />
              <span className="font-medium text-pagination-text">{brand.name}</span>
            </label>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
