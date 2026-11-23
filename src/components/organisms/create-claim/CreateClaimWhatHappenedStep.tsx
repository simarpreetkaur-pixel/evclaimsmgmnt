'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, CalendarIcon } from 'lucide-react';

import {
  CREATE_CLAIM_POLICY_SIDEBAR_CLASS,
  CreateClaimPolicySidebar,
} from '@/components/molecules/create-claim/CreateClaimPolicySidebar';
import { claimVehicleDetails } from '@/components/organisms/create-claim/CreateClaimFindVehicleStep';
import { CreateClaimStepActions } from '@/components/organisms/create-claim/CreateClaimStepActions';
import { useDmsIntegrated } from '@/lib/prototype/dmsSimulation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const FAILURE_MATCHES = [
  'Permanent fault flag',
  'Cell imbalance',
  'State of health degradation',
  'BMS fault',
  'Cell failure',
  'Thermal event',
  'Deep discharge',
  'Water ingress',
  'Charging fault',
  'Physical damage',
];

const fieldClassName =
  'border-policy-search-border h-10 w-full bg-white px-3 text-sm shadow-policy-search';

export type WhatHappenedDraft = {
  observation: string;
  failedOn: string;
  closestMatch: string;
};

type CreateClaimWhatHappenedStepProps = {
  onBack: () => void;
  onContinue: (draft: WhatHappenedDraft) => void;
};

function formatFailureDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-pagination-text">
        {label} <span aria-hidden>*</span>
      </label>
      {children}
    </div>
  );
}

export function CreateClaimWhatHappenedStep({
  onBack,
  onContinue,
}: CreateClaimWhatHappenedStepProps) {
  const dms = useDmsIntegrated();
  const [customerSaid, setCustomerSaid] = useState('');
  const [failedOn, setFailedOn] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [closestMatch, setClosestMatch] = useState('');

  const complete = useMemo(
    () => customerSaid.trim().length > 0 && failedOn != null && closestMatch.length > 0,
    [closestMatch, customerSaid, failedOn],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 lg:flex-row lg:items-start">
      <form
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (complete && failedOn) {
            onContinue({
              observation: customerSaid.trim(),
              failedOn: formatFailureDate(failedOn),
              closestMatch,
            });
          }
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-pagination-text">What happened?</h2>
          <p className="text-sm leading-5 text-pagination-text-muted">
            Filled in from your documents. Check each value, and choose the closest match yourself.
          </p>
        </div>

        <Field id="customer-said" label="What happened and when did you observe this?">
          <Textarea
            id="customer-said"
            required
            value={customerSaid}
            onChange={(event) => setCustomerSaid(event.target.value)}
            placeholder="In their own words — Hindi or Hinglish is fine"
            className="border-policy-search-border min-h-24 w-full bg-white px-3 py-2 text-sm shadow-policy-search"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="failed-on" label="When did it fail?">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  id="failed-on"
                  type="button"
                  className={cn(
                    fieldClassName,
                    'flex items-center justify-between text-left font-normal',
                    failedOn ? 'text-pagination-text' : 'text-muted-foreground',
                  )}
                >
                  {failedOn ? formatFailureDate(failedOn) : 'dd/mm/yyyy'}
                  <CalendarIcon className="size-4 text-pagination-text-muted" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={failedOn}
                  onSelect={(date) => {
                    setFailedOn(date);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </Field>

          <Field id="closest-match" label="Closest failure match">
            <Select value={closestMatch || undefined} onValueChange={setClosestMatch}>
              <SelectTrigger id="closest-match" className={cn(fieldClassName, 'font-normal')}>
                <SelectValue placeholder="Choose the closest match" />
              </SelectTrigger>
              <SelectContent align="start">
                {FAILURE_MATCHES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        </div>

        <CreateClaimStepActions>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="border-policy-search-border h-9 bg-white px-4 text-sm font-medium shadow-policy-search"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={!complete}
            className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover shadow-create-claim-button h-9 gap-2 px-4 text-sm font-medium"
          >
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </CreateClaimStepActions>
      </form>

      <CreateClaimPolicySidebar
        rows={claimVehicleDetails(dms)}
        rowDensity="comfortable"
        aria-label="Policy details"
        className={CREATE_CLAIM_POLICY_SIDEBAR_CLASS}
      />
    </div>
  );
}
