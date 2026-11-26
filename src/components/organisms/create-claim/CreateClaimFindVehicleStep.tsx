'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useDmsIntegrated } from '@/lib/prototype/dmsSimulation';

import { AppImage } from '@/components/atoms/AppImage';
import ErrorCard from '@/components/molecules/ErrorCard';
import PolicySearchBar from '@/components/molecules/PolicySearchBar';

const VEHICLE_SEARCH_OPTIONS = [
  { value: 'registration_number', label: 'Registration number' },
  { value: 'vin', label: 'VIN' },
  { value: 'policy_number', label: 'Policy number' },
  { value: 'customer_mobile', label: 'Customer mobile number' },
];

const MATCHED_VEHICLE_QUERY = '1233';
const OUT_OF_WARRANTY_QUERY = '1234';
const FIND_VEHICLE_DELAY_MS = 2500;

export const MATCHED_VEHICLE_DETAILS = [
  { label: 'Name', value: 'Rahul Menon' },
  { label: 'Vehicle', value: 'Ather 450X' },
  { label: 'VIN', value: 'MD626AM12R1A1233' },
  { label: 'Policy', value: 'ATH-BAT-1233' },
  { label: 'Plan', value: 'Battery extended warranty' },
  { label: 'Cover start date', value: '14 Mar 2025' },
  { label: 'Coverage', value: 'Battery' },
];

const OUT_OF_WARRANTY_DETAILS = [
  { label: 'Name', value: 'Meera Iyer' },
  { label: 'Vehicle', value: 'Ather 450X' },
  { label: 'VIN', value: 'MD626AM12R1A1234' },
  { label: 'Policy', value: 'ATH-BAT-1234' },
  { label: 'Plan', value: 'Battery extended warranty' },
  { label: 'Cover start date', value: '18 Feb 2022' },
  { label: 'Cover end date', value: '17 Feb 2024' },
  { label: 'Coverage', value: 'Battery' },
];

export const DMS_VEHICLE_DETAILS = [
  { label: 'Vehicle sale date', value: '02 Jan 2025' },
  { label: 'Battery identification number (BIN)', value: 'ATH-BIN-450X-1233' },
  { label: 'Battery fitment date', value: '02 Jan 2025' },
  { label: 'Battery generation', value: 'Gen 2' },
  { label: 'Service history', value: '11 visits' },
];

export function claimVehicleDetails(includeDms: boolean) {
  return includeDms ? [...MATCHED_VEHICLE_DETAILS, ...DMS_VEHICLE_DETAILS] : MATCHED_VEHICLE_DETAILS;
}

type CreateClaimFindVehicleStepProps = {
  onContinue?: () => void;
  onMatchedChange?: (matched: boolean) => void;
};

export function CreateClaimFindVehicleStep({
  onContinue,
  onMatchedChange,
}: CreateClaimFindVehicleStepProps) {
  const dms = useDmsIntegrated();
  const [filterValue, setFilterValue] = useState(VEHICLE_SEARCH_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matched, setMatched] = useState(false);
  const [outOfWarranty, setOutOfWarranty] = useState(false);
  const searchTimer = useRef<number | null>(null);
  const selectedLabel = VEHICLE_SEARCH_OPTIONS.find((option) => option.value === filterValue)?.label;

  useEffect(() => {
    return () => {
      if (searchTimer.current != null) {
        window.clearTimeout(searchTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    onMatchedChange?.(matched);
  }, [matched, onMatchedChange]);

  const clearSearchTimer = () => {
    if (searchTimer.current != null) {
      window.clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }
  };

  const runSearch = (query: string) => {
    const value = query.trim();
    clearSearchTimer();
    if (!value) {
      setSearching(false);
      setSearchAttempted(false);
      setMatched(false);
      setOutOfWarranty(false);
      return;
    }
    setSearching(true);
    setSearchAttempted(false);
    setMatched(false);
    setOutOfWarranty(false);
    searchTimer.current = window.setTimeout(() => {
      setSearching(false);
      setSearchAttempted(true);
      setMatched(value === MATCHED_VEHICLE_QUERY);
      setOutOfWarranty(value === OUT_OF_WARRANTY_QUERY);
    }, FIND_VEHICLE_DELAY_MS);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-12 shrink-0 items-center gap-4">
        <PolicySearchBar
          filterValue={filterValue}
          filterOptions={VEHICLE_SEARCH_OPTIONS}
          onFilterChange={setFilterValue}
          query={searchQuery}
          onQueryChange={(value) => {
            setSearchQuery(value);
            if (!value.trim()) {
              clearSearchTimer();
              setSearching(false);
              setSearchAttempted(false);
              setMatched(false);
              setOutOfWarranty(false);
            }
          }}
          onSearch={() => runSearch(searchQuery)}
          className="h-12 min-w-0 flex-1"
          inputPlaceholder={selectedLabel ? `Search for ${selectedLabel.toLowerCase()}` : 'Search'}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={!searchQuery.trim() || searching}
          onClick={() => runSearch(searchQuery)}
          className="h-12 shrink-0 px-4 text-sm font-medium shadow-xs"
        >
          Find my vehicle
        </Button>
      </div>
      <div className="border-claims-management-table-border rounded-claims-management-table bg-card overflow-hidden border">
        {searching ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-3 text-sm text-pagination-text-muted" role="status">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {dms ? 'Fetching vehicle and service data…' : 'Finding your vehicle…'}
          </div>
        ) : null}

        {outOfWarranty ? (
          <div className="flex flex-col">
            <div
              className="border-claims-management-table-border border-b bg-amber-50 px-6 py-4"
              role="status"
            >
              <p className="text-sm font-semibold text-pagination-text">Out of warranty</p>
              <p className="mt-1 text-sm text-pagination-text-muted">
                Cover ended on 17 Feb 2024. A claim cannot be raised for this vehicle.
              </p>
            </div>
            <dl className="grid gap-x-10 gap-y-5 px-6 py-6 sm:grid-cols-2">
              {OUT_OF_WARRANTY_DETAILS.map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <dt className="text-sm text-pagination-text-muted">{field.label}</dt>
                  <dd className="text-sm font-medium text-pagination-text">{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        {matched ? (
          <div className="flex flex-col">
            <dl className="grid gap-x-10 gap-y-5 px-6 py-6 sm:grid-cols-2">
              {MATCHED_VEHICLE_DETAILS.map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <dt className="text-sm text-pagination-text-muted">{field.label}</dt>
                  <dd className="text-sm font-medium text-pagination-text">{field.value}</dd>
                </div>
              ))}
            </dl>
            {dms ? (
              <div className="border-claims-management-table-border border-t px-6 py-4">
                <div className="flex items-start gap-3 rounded-md bg-secondary/50 px-4 py-3">
                  <div className="text-sm">
                    <p className="font-medium text-pagination-text">DMS connected</p>
                    <p className="text-pagination-text-muted">
                      Job card and battery identification number are filled from the documents. Enter the odometer yourself.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!searching && !searchAttempted && !matched && !outOfWarranty ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-sm text-pagination-text-muted">
            <AppImage src="/images/table-icon.svg" alt="Table" width={64} height={64} />
            {'Policy details will appear here '}
          </div>
        ) : null}

        {searchAttempted && !matched && !outOfWarranty ? (
          <div className="flex h-[40vh] justify-center">
            <ErrorCard
              title={`No results found for ${selectedLabel?.toLowerCase()} "${searchQuery.trim()}"`}
              className="border-none shadow-none"
            />
          </div>
        ) : null}
      </div>
      {matched ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onContinue}
            className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover shadow-create-claim-button h-9 gap-2 px-4 text-sm font-medium"
          >
            Raise claim
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
