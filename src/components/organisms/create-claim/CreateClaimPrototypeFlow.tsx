'use client';

import { useCallback, useEffect, useState } from 'react';

import { CreateClaimFindVehicleStep } from '@/components/organisms/create-claim/CreateClaimFindVehicleStep';
import {
  CreateClaimReadingsDocumentsStep,
  type ReadingsDraft,
} from '@/components/organisms/create-claim/CreateClaimReadingsDocumentsStep';
import { CreateClaimReviewSubmitStep } from '@/components/organisms/create-claim/CreateClaimReviewSubmitStep';
import { CreateClaimStepper } from '@/components/organisms/create-claim/CreateClaimStepper';
import {
  CreateClaimWhatHappenedStep,
  type WhatHappenedDraft,
} from '@/components/organisms/create-claim/CreateClaimWhatHappenedStep';
import { cn } from '@/lib/utils';

const PROTOTYPE_CLAIM_STEPS = [
  { id: 'find-vehicle', ordinal: 1, label: 'Find vehicle' },
  { id: 'what-happened', ordinal: 2, label: 'What happened' },
  { id: 'readings-and-documents', ordinal: 3, label: 'Readings and documents' },
  { id: 'review-and-submit', ordinal: 4, label: 'Review and submit claim' },
] as const;

type PrototypeClaimStepId = (typeof PROTOTYPE_CLAIM_STEPS)[number]['id'];

export function CreateClaimPrototypeFlow() {
  const [step, setStep] = useState<PrototypeClaimStepId>('find-vehicle');
  const [vehicleFound, setVehicleFound] = useState(false);
  const [whatHappened, setWhatHappened] = useState<WhatHappenedDraft | null>(null);
  const [readings, setReadings] = useState<ReadingsDraft | null>(null);
  const [claimSent, setClaimSent] = useState(false);
  const handleMatchedChange = useCallback((matched: boolean) => {
    setVehicleFound(matched);
  }, []);

  useEffect(() => {
    if (!vehicleFound && step !== 'find-vehicle') {
      setStep('find-vehicle');
    }
  }, [step, vehicleFound]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      {claimSent ? null : (
      <CreateClaimStepper
        currentStepIndex={PROTOTYPE_CLAIM_STEPS.findIndex((item) => item.id === step)}
        steps={PROTOTYPE_CLAIM_STEPS}
        onStepClick={(stepId) => {
          if (stepId === 'find-vehicle') {
            setStep('find-vehicle');
          }
          if (stepId === 'what-happened' && vehicleFound) {
            setStep('what-happened');
          }
          if (stepId === 'readings-and-documents' && vehicleFound) {
            setStep('readings-and-documents');
          }
          if (stepId === 'review-and-submit' && readings && whatHappened) {
            setStep('review-and-submit');
          }
        }}
      />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={cn(step === 'find-vehicle' ? 'min-h-0 flex-1 overflow-auto' : 'hidden')}>
          <CreateClaimFindVehicleStep
            onMatchedChange={handleMatchedChange}
            onContinue={() => setStep('what-happened')}
          />
        </div>
        <div className={cn(step === 'what-happened' ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'hidden')}>
          <CreateClaimWhatHappenedStep
            onBack={() => setStep('find-vehicle')}
            onContinue={(draft) => {
              setWhatHappened(draft);
              setStep('readings-and-documents');
            }}
          />
        </div>
        <div
          className={cn(
            step === 'readings-and-documents' ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'hidden',
          )}
        >
          <CreateClaimReadingsDocumentsStep
            onBack={() => setStep('what-happened')}
            onContinue={(draft) => {
              setReadings(draft);
              setStep('review-and-submit');
            }}
          />
        </div>
        {step === 'review-and-submit' && whatHappened && readings ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CreateClaimReviewSubmitStep
              whatHappened={whatHappened}
              readings={readings}
              onBack={() => setStep('readings-and-documents')}
              onSubmitted={() => setClaimSent(true)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
