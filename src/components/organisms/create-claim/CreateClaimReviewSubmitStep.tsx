'use client';

import { useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircleCheck } from 'lucide-react';

import {
  CREATE_CLAIM_POLICY_SIDEBAR_CLASS,
  CreateClaimPolicySidebar,
} from '@/components/molecules/create-claim/CreateClaimPolicySidebar';
import { CreateClaimStepActions } from '@/components/organisms/create-claim/CreateClaimStepActions';
import {
  MATCHED_VEHICLE_DETAILS,
  claimVehicleDetails,
} from '@/components/organisms/create-claim/CreateClaimFindVehicleStep';
import { useDmsIntegrated } from '@/lib/prototype/dmsSimulation';
import { raisedClaimFromVehicle, useRaisedClaimsStore } from '@/lib/prototype/raisedClaims';
import {
  readingDocumentPreview,
  type ReadingsDraft,
} from '@/components/organisms/create-claim/CreateClaimReadingsDocumentsStep';
import type { WhatHappenedDraft } from '@/components/organisms/create-claim/CreateClaimWhatHappenedStep';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const CLAIM_REFERENCE = 'CLM-ATH-1233';

const NEXT_STEPS = [
  {
    title: 'Submitted',
    detail: 'The readings and documents from this visit are with Acko.',
    state: 'done',
  },
  {
    title: 'In review',
    detail: 'Acko checks them against the battery warranty on this policy.',
    state: 'current',
  },
  {
    title: 'Outcome',
    detail: 'The decision shows on Overview.',
    state: 'upcoming',
  },
] as const;

type CreateClaimReviewSubmitStepProps = {
  whatHappened: WhatHappenedDraft;
  readings: ReadingsDraft;
  onBack: () => void;
  onSubmitted: () => void;
};

function displayValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '—';
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-claims-management-table-border flex flex-col gap-4 rounded-lg border bg-white px-5 py-4">
      <h3 className="text-sm font-semibold text-pagination-text">{title}</h3>
      {children}
    </section>
  );
}

function ReviewList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-pagination-text-muted">{row.label}</dt>
          <dd className="text-sm text-pagination-text">{displayValue(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function detailValue(label: string) {
  return MATCHED_VEHICLE_DETAILS.find((row) => row.label === label)?.value ?? '';
}

function ClaimSent({ readings }: { readings: ReadingsDraft }) {
  const router = useRouter();
  const { partner } = useParams<{ partner: string }>();
  const customer = detailValue('Name');
  const vehicle = detailValue('Vehicle');

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-green-50 text-green-700">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-pagination-text">Acko has this claim</h2>
          <p className="text-sm leading-5 text-pagination-text-muted">
            {customer}&apos;s {vehicle} battery warranty claim is in review. Use the reference if you
            need to follow it up.
          </p>
        </div>
      </div>

      <section className="border-claims-management-table-border flex flex-col gap-4 rounded-lg border bg-white px-5 py-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-xs font-medium text-pagination-text-muted">Claim reference</dt>
            <dd className="text-lg font-semibold tracking-wide text-pagination-text">{CLAIM_REFERENCE}</dd>
          </div>
          {[
            { label: 'Customer', value: customer },
            { label: 'Vehicle', value: vehicle },
            { label: 'Job card', value: readings.jobCardNumber },
            { label: 'Battery identification number', value: readings.bin },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-pagination-text-muted">{row.label}</dt>
              <dd className="text-sm font-medium text-pagination-text">{displayValue(row.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-claims-management-table-border flex flex-col gap-4 rounded-lg border bg-white px-5 py-4">
        <h3 className="text-sm font-semibold text-pagination-text">What happens next</h3>
        <ol className="flex flex-col">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'mt-1 size-2.5 shrink-0 rounded-full',
                    step.state === 'done' && 'bg-green-600',
                    step.state === 'current' && 'bg-labeled-select-accent',
                    step.state === 'upcoming' && 'border-pagination-border border bg-white',
                  )}
                />
                {index < NEXT_STEPS.length - 1 ? (
                  <span className="bg-claims-management-table-border mt-1 w-px flex-1" />
                ) : null}
              </div>
              <div className={cn('flex flex-col gap-1', index < NEXT_STEPS.length - 1 && 'pb-4')}>
                <p className="text-sm font-semibold text-pagination-text">{step.title}</p>
                <p className="text-sm leading-5 text-pagination-text-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="border-claims-management-table-border rounded-lg border bg-slate-50 px-4 py-3 text-sm leading-5 text-pagination-text">
        Nothing else is needed from the dealership unless Acko asks. That request shows on Overview,
        under Needs attention.
      </p>

      <div className="flex justify-center">
        <Button
          type="button"
          onClick={() => router.push(`/${partner}/dashboard/overview`)}
          className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover shadow-create-claim-button h-9 px-4 text-sm font-medium"
        >
          Back to overview
        </Button>
      </div>
    </div>
  );
}

export function CreateClaimReviewSubmitStep({
  whatHappened,
  readings,
  onBack,
  onSubmitted,
}: CreateClaimReviewSubmitStepProps) {
  const dms = useDmsIntegrated();
  const addClaim = useRaisedClaimsStore((state) => state.addClaim);
  const vehicleDetails = claimVehicleDetails(dms);
  const [submitted, setSubmitted] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const preview = previewFile ? readingDocumentPreview(previewFile) : null;

  if (submitted) {
    return (
      <div className="h-full min-h-0 overflow-y-auto">
        <ClaimSent readings={readings} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-pagination-text">Review and submit claim</h2>
          <p className="text-sm leading-5 text-pagination-text-muted">
            Check the claim before you submit it. Nothing on this page can be edited.
          </p>
        </div>

        <ReviewSection title="Vehicle">
          <ReviewList rows={vehicleDetails} />
        </ReviewSection>

        <ReviewSection title="What happened">
          <ReviewList
            rows={[
              { label: 'What happened and when did you observe this?', value: whatHappened.observation },
              { label: 'When did it fail?', value: whatHappened.failedOn },
              { label: 'Closest failure match', value: whatHappened.closestMatch },
            ]}
          />
        </ReviewSection>

        <ReviewSection title="Odometer, job card and BIN">
          <ReviewList
            rows={[
              { label: 'Odometer (km)', value: readings.odometerKm },
              { label: 'Job card number', value: readings.jobCardNumber },
              { label: 'Battery identification number (BIN)', value: readings.bin },
            ]}
          />
        </ReviewSection>

        <ReviewSection title="Documents">
          {readings.documents.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {readings.documents.map((document) => (
                <li key={document.title}>
                  <button
                    type="button"
                    onClick={() => setPreviewFile(document.fileName)}
                    className="text-claims-management-table-link text-left text-sm font-medium"
                  >
                    {document.title}
                    <span className="text-pagination-text-muted font-normal"> · {document.fileName}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-pagination-text-muted">No documents attached.</p>
          )}
        </ReviewSection>

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
            type="button"
            onClick={() => {
              addClaim(raisedClaimFromVehicle(detailValue('Name'), detailValue('Vehicle')));
              setSubmitted(true);
              onSubmitted();
            }}
            className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover shadow-create-claim-button h-9 px-4 text-sm font-medium"
          >
            Submit claim
          </Button>
        </CreateClaimStepActions>
      </div>

      <CreateClaimPolicySidebar
        rows={vehicleDetails}
        rowDensity="comfortable"
        aria-label="Policy details"
        className={CREATE_CLAIM_POLICY_SIDEBAR_CLASS}
      />
      <Dialog open={preview != null} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>{previewFile}</DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="border-pagination-border mx-auto flex w-full max-w-sm flex-col gap-3 rounded-md border bg-slate-50 p-5 shadow-xs">
              <p className="text-xs text-pagination-text-muted">{preview.page}</p>
              <div className="rounded-md bg-violet-100 px-3 py-2 text-sm text-pagination-text ring-2 ring-violet-400">
                <p>{preview.highlight}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
