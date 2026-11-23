import {
  CREATE_CLAIM_FLOW_STEPS,
  CREATE_CLAIM_TITLE,
  type CreateClaimFlowStepId,
} from '@/lib/constants/createClaim.constants';
import { PAGE_TITLE_CLASS } from '@/components/molecules/PageHeading';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type CreateClaimStepperStep = {
  id: string;
  ordinal: number;
  label: string;
};

export type CreateClaimStepperProps = {
  currentStepIndex: number;
  steps?: readonly CreateClaimStepperStep[];
  onStepClick?: (stepId: CreateClaimFlowStepId | string) => void;
};

export function CreateClaimStepper({
  currentStepIndex,
  steps = CREATE_CLAIM_FLOW_STEPS,
  onStepClick,
}: CreateClaimStepperProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE_CLASS}>{CREATE_CLAIM_TITLE}</h1>
      <div
        role="navigation"
        aria-label="Claim creation steps"
        className="flex w-full items-center rounded-lg border border-metric-card-border bg-slate-50 p-1.5"
      >
        {steps.map((step, idx) => {
          const complete = idx < currentStepIndex;
          const active = idx === currentStepIndex;
          const canNavigate = Boolean(onStepClick && complete);
          return (
            <button
              key={step.id}
              type="button"
              disabled={!canNavigate}
              onClick={() => {
                if (canNavigate) {
                  onStepClick?.(step.id);
                }
              }}
              className={cn(
                'flex flex-1 items-center justify-center rounded-md px-3 py-2 text-left transition-colors',
                active ? 'bg-white shadow-xs' : '',
                canNavigate ? 'cursor-pointer hover:bg-white/60' : 'cursor-default',
              )}
              aria-current={active ? 'step' : undefined}
            >
              <div className="flex items-center gap-2">
                {complete ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-labeled-select-accent text-white">
                    <Check
                      className="size-3 text-white"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  </span>
                ) : (
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      active
                        ? 'bg-labeled-select-accent text-white'
                        : 'bg-icon-default-bg text-pagination-text-muted',
                    )}
                  >
                    {step.ordinal}
                  </span>
                )}
                <span
                  className={cn(
                    'truncate text-sm font-medium leading-none',
                    active ? 'text-pagination-text' : 'text-pagination-text-muted',
                  )}
                >
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
