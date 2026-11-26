'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, FileSearch, FileText, Loader2, Upload } from 'lucide-react';

import {
  CREATE_CLAIM_POLICY_SIDEBAR_CLASS,
  CreateClaimPolicySidebar,
} from '@/components/molecules/create-claim/CreateClaimPolicySidebar';
import { CreateClaimStepActions } from '@/components/organisms/create-claim/CreateClaimStepActions';
import { claimVehicleDetails } from '@/components/organisms/create-claim/CreateClaimFindVehicleStep';
import { useDmsIntegrated } from '@/lib/prototype/dmsSimulation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const UPLOAD_SLOTS = [
  { id: 'battery-images', title: 'Battery images', required: true, fileName: 'battery-image.jpg' },
  { id: 'service-history', title: 'Service history', required: false, fileName: 'service-history.png' },
  { id: 'ather-claim', title: 'Ather claim document', required: true, fileName: 'ather-claim-document.pdf' },
  { id: 'purchase-invoice', title: 'Purchase invoice', required: true, fileName: 'purchase-invoice.pdf' },
] as const;

type UploadSlotId = (typeof UPLOAD_SLOTS)[number]['id'];

const DMS_UPLOAD_ORDER: UploadSlotId[] = ['purchase-invoice', 'ather-claim'];

const SECTION_IDS = ['documents', 'visit'] as const;

const FILLED_READINGS = {
  jobCardNumber: 'RJC4B07542502466077',
  bin: 'ATH-BIN-450X-1233',
};

const fieldClassName =
  'border-policy-search-border h-10 w-full bg-white px-3 text-sm shadow-policy-search transition-[background-color,box-shadow] duration-500';

export type ReadingsDraft = {
  odometerKm: string;
  jobCardNumber: string;
  bin: string;
  stateOfHealth: string;
  cellImbalance: string;
  serviceHistory: string[][];
  documents: { title: string; fileName: string }[];
};

type CreateClaimReadingsDocumentsStepProps = {
  onBack: () => void;
  onContinue: (draft: ReadingsDraft) => void;
};

type DocumentSourceId =
  | 'odometer'
  | 'job-card'
  | 'bin'
  | 'service-history'
  | 'state-of-health'
  | 'cell-imbalance';

const DOCUMENT_SOURCES: Record<
  DocumentSourceId,
  { title: string; page: string; fileName: string }
> = {
  odometer: {
    title: 'Odometer',
    page: 'Service history · odometer column',
    fileName: 'service-history.png',
  },
  'job-card': {
    title: 'Job card number',
    page: 'Job card · page 1',
    fileName: 'ather-claim-document.pdf',
  },
  bin: {
    title: 'Battery identification number',
    page: 'Battery image',
    fileName: 'battery-image.jpg',
  },
  'service-history': {
    title: 'Service history',
    page: 'Service history · page 1',
    fileName: 'service-history.png',
  },
  'state-of-health': {
    title: 'State of health',
    page: 'Battery report · page 2',
    fileName: 'battery-image.jpg',
  },
  'cell-imbalance': {
    title: 'Cell imbalance',
    page: 'Battery report · page 2',
    fileName: 'battery-image.jpg',
  },
};

const DOCUMENT_PREVIEWS: Record<UploadSlotId, { page: string; highlight: string }> = {
  'battery-images': {
    page: 'Battery images',
    highlight: 'Battery pack · front and cell close-up',
  },
  'service-history': {
    page: 'Service history',
    highlight: '14 Oct 2025 · 40K service, check battery health',
  },
  'ather-claim': {
    page: 'Ather claim document',
    highlight: 'Job card · RJC4B07542502466077 · battery warranty',
  },
  'purchase-invoice': {
    page: 'Purchase invoice',
    highlight: 'Ather 450X · invoice total ₹1,48,000',
  },
};

export function readingDocumentPreview(fileName: string) {
  const slot = UPLOAD_SLOTS.find((item) => item.fileName === fileName);
  return slot ? { title: slot.title, ...DOCUMENT_PREVIEWS[slot.id] } : null;
}

function DocumentPreview({ page, highlight }: { page: string; highlight: string }) {
  return (
    <div className="border-pagination-border mx-auto flex w-full max-w-sm flex-col gap-3 rounded-md border bg-slate-50 p-5 shadow-xs">
      <p className="text-xs text-pagination-text-muted">{page}</p>
      <div className="flex flex-col gap-2">
        <span className="bg-pagination-border/70 h-2 w-2/3 rounded-full" />
        <span className="bg-pagination-border/70 h-2 w-1/2 rounded-full" />
      </div>
      <div className="rounded-md bg-violet-100 px-3 py-2 text-sm text-pagination-text ring-2 ring-violet-400">
        <p>{highlight}</p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="bg-pagination-border/70 h-2 w-5/6 rounded-full" />
        <span className="bg-pagination-border/70 h-2 w-1/3 rounded-full" />
      </div>
    </div>
  );
}

function DocumentSourceDialog({
  source,
  open,
  onOpenChange,
}: {
  source: DocumentSourceId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const details = DOCUMENT_SOURCES[source];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{details.title}</DialogTitle>
          <DialogDescription>
            Read from {details.fileName}. The highlighted part is where this value was taken.
          </DialogDescription>
        </DialogHeader>
        <div className="border-pagination-border mx-auto flex w-full max-w-sm flex-col gap-3 rounded-md border bg-slate-50 p-5 shadow-xs">
          <p className="text-xs text-pagination-text-muted">{details.page}</p>
          <div className="flex flex-col gap-2">
            <span className="bg-pagination-border/70 h-2 w-2/3 rounded-full" />
            <span className="bg-pagination-border/70 h-2 w-1/2 rounded-full" />
          </div>
          <DocumentHighlight source={source} />
          <div className="flex flex-col gap-2">
            <span className="bg-pagination-border/70 h-2 w-5/6 rounded-full" />
            <span className="bg-pagination-border/70 h-2 w-1/3 rounded-full" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentHighlight({ source }: { source: DocumentSourceId }) {
  const highlight: Record<DocumentSourceId, string> = {
    odometer: 'Odometer · 40,319 km',
    'job-card': 'Job card · RJC4B07542502466077',
    bin: 'BIN · ATH-BIN-450X-1233',
    'service-history': '14 Oct 2025 · 40K service, check battery health · 40,318.80 km',
    'state-of-health': 'State of health · 95%',
    'cell-imbalance': 'Cell imbalance · 0%',
  };

  return (
    <div className="rounded-md bg-violet-100 px-3 py-2 text-sm text-pagination-text ring-2 ring-violet-400">
      <p>{highlight[source]}</p>
    </div>
  );
}

function SourceIcon({ label, source }: { label: string; source: DocumentSourceId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={`Show where ${label} was read from`}
        className="text-pagination-text-muted hover:text-pagination-text inline-flex size-7 items-center justify-center rounded-md"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <FileSearch className="size-4" aria-hidden />
      </span>
      <DocumentSourceDialog source={source} open={open} onOpenChange={setOpen} />
    </>
  );
}

function ReadingSection({
  id,
  title,
  filled,
  source,
  badge,
  children,
}: {
  id: string;
  title: string;
  filled?: boolean;
  source?: DocumentSourceId;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <AccordionItem
      id={id}
      value={id}
      className="border-pagination-border overflow-hidden rounded-[14px] border bg-white"
    >
      <AccordionTrigger className="cursor-pointer border-b border-transparent bg-slate-50 px-6 py-4 hover:no-underline data-[state=open]:border-slate-100 [&_svg:last-child]:ml-2">
        <div className="flex w-full flex-1 items-center justify-between gap-3 pr-1 text-left">
          <span className="text-base font-semibold text-pagination-text">{title}</span>
          {badge ? (
            <span className="text-xs font-medium text-pagination-text-muted">{badge}</span>
          ) : null}
          {filled && source ? <SourceIcon label={title} source={source} /> : null}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 py-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Field({
  id,
  label,
  optional,
  supplied,
  source,
  showSource,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  supplied?: boolean;
  source?: DocumentSourceId;
  showSource?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm font-semibold text-pagination-text">
          {label}
          {optional ? (
            <span className="font-normal text-pagination-text-muted"> (optional)</span>
          ) : null}
          {supplied ? (
            <span className="font-normal text-pagination-text-muted"> (from DMS)</span>
          ) : null}
          {!optional && !supplied ? <span aria-hidden> *</span> : null}
        </label>
        {showSource && source ? <SourceIcon label={label} source={source} /> : null}
      </div>
      {children}
    </div>
  );
}

export function CreateClaimReadingsDocumentsStep({
  onBack,
  onContinue,
}: CreateClaimReadingsDocumentsStepProps) {
  const dms = useDmsIntegrated();
  const uploadSlots = dms
    ? [...UPLOAD_SLOTS]
        .filter((slot) => DMS_UPLOAD_ORDER.includes(slot.id))
        .sort((left, right) => DMS_UPLOAD_ORDER.indexOf(left.id) - DMS_UPLOAD_ORDER.indexOf(right.id))
    : UPLOAD_SLOTS;
  const [attached, setAttached] = useState<Partial<Record<UploadSlotId, string>>>({});
  const [previewTarget, setPreviewTarget] = useState<UploadSlotId | null>(null);
  const [reading, setReading] = useState(false);
  const [readLabel, setReadLabel] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([...SECTION_IDS]);
  const [odometerKm, setOdometerKm] = useState('');
  const [jobCardNumber, setJobCardNumber] = useState('');
  const [bin, setBin] = useState('');
  const readStarted = useRef(false);
  const dmsApplied = useRef(false);
  const fillTimers = useRef<number[]>([]);

  const documentsReady = uploadSlots.every((slot) => Boolean(attached[slot.id]));
  const complete = useMemo(
    () =>
      odometerKm.trim().length > 0 &&
      jobCardNumber.trim().length > 0 &&
      bin.trim().length > 0 &&
      (!dms || documentsReady),
    [bin, dms, documentsReady, jobCardNumber, odometerKm],
  );

  useEffect(() => {
    if (!dms || dmsApplied.current) {
      return;
    }
    dmsApplied.current = true;
    setJobCardNumber(FILLED_READINGS.jobCardNumber);
    setBin(FILLED_READINGS.bin);
    setFetched(true);
  }, [dms]);

  useEffect(() => {
    return () => {
      fillTimers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const queue = (delay: number, action: () => void) => {
    fillTimers.current.push(window.setTimeout(action, delay));
  };

  const applyFilledReadings = () => {
    setJobCardNumber(FILLED_READINGS.jobCardNumber);
    setBin(FILLED_READINGS.bin);
  };

  const startReading = () => {
    if (readStarted.current) {
      return;
    }
    readStarted.current = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      applyFilledReadings();
      setFetched(true);
      return;
    }

    setReading(true);
    uploadSlots.forEach((slot, index) => {
      queue(index * 500, () => setReadLabel(`Reading ${slot.fileName}`));
    });
    const fillStart = uploadSlots.length * 500;
    queue(fillStart, () => {
      setReadLabel('Filling job card and battery identification number');
      setJobCardNumber(FILLED_READINGS.jobCardNumber);
      setActiveField('job-card');
      document.getElementById('job-card-number')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    queue(fillStart + 500, () => {
      setBin(FILLED_READINGS.bin);
      setActiveField('bin');
    });
    queue(fillStart + 1100, () => {
      setReading(false);
      setReadLabel('');
      setActiveField(null);
      setFetched(true);
    });
  };

  const attachAll = () => {
    if (readStarted.current || uploadSlots.every((slot) => attached[slot.id])) {
      return;
    }
    setAttached(Object.fromEntries(uploadSlots.map((slot) => [slot.id, slot.fileName])));
    if (!dms) {
      startReading();
    }
  };

  const previewSlot = uploadSlots.find((slot) => slot.id === previewTarget) ?? null;
  const preview = previewTarget ? DOCUMENT_PREVIEWS[previewTarget] : null;
  const filledClass = (field: string) =>
    cn(fieldClassName, activeField === field && 'bg-violet-50 shadow-[0_0_0_2px_rgba(139,92,246,0.45)]');

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 lg:flex-row lg:items-start">
      <form
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (!complete) {
            return;
          }
          onContinue({
            odometerKm,
            jobCardNumber,
            bin,
            stateOfHealth: '',
            cellImbalance: '',
            serviceHistory: [],
            documents: uploadSlots.flatMap((slot) =>
              attached[slot.id] ? [{ title: slot.title, fileName: attached[slot.id] as string }] : [],
            ),
          });
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-pagination-text">Readings and documents</h2>
          <p className="text-sm leading-5 text-pagination-text-muted">
            {dms
              ? 'Job card and battery identification number are filled from the documents. Enter the odometer yourself.'
              : 'Upload the documents. Job card and battery identification number fill in from them. Enter the odometer yourself.'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="gap-3"
          >
            <ReadingSection id="documents" title="Documents">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {uploadSlots.map((slot) => {
                    const fileName = attached[slot.id];
                    if (fileName) {
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setPreviewTarget(slot.id)}
                          className="border-claims-management-table-border flex items-center gap-3 rounded-[14px] border bg-white p-4 text-left shadow-xs"
                        >
                          <span className="border-claims-management-table-border flex size-10 shrink-0 items-center justify-center rounded-md border bg-slate-50">
                            <FileText className="size-5 text-pagination-text-muted" aria-hidden />
                          </span>
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate text-sm font-semibold text-pagination-text">
                              {slot.title}
                            </span>
                            <span className="truncate text-sm text-pagination-text-muted">{fileName}</span>
                          </span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={attachAll}
                        className="border-claims-management-table-border flex flex-col items-center gap-4 rounded-[14px] border border-dashed bg-white p-4 text-center shadow-xs"
                      >
                        <Upload className="size-7 text-pagination-text-muted opacity-50" aria-hidden />
                        <span className="flex w-full flex-col gap-1.5">
                          <span className="text-base font-semibold tracking-tight text-pagination-text">
                            {slot.title}
                          </span>
                          <span className="truncate text-sm text-pagination-text-muted">
                            Click to attach all
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {dms ? null : (
                  <p className="text-sm text-pagination-text-muted">
                    One click attaches every document. Job card and battery identification number fill in from them.
                  </p>
                )}
                {reading ? (
                  <div className="flex h-10 items-center gap-2" role="status">
                    <Loader2 className="size-4 shrink-0 animate-spin text-pagination-text-muted" aria-hidden />
                    <p className="text-sm text-pagination-text">{readLabel}</p>
                  </div>
                ) : null}
              </div>
            </ReadingSection>
            <ReadingSection id="visit" title="Odometer, job card and BIN">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="odometer-km" label="Odometer, km">
                  <Input
                    id="odometer-km"
                    required
                    inputMode="numeric"
                    value={odometerKm}
                    onChange={(event) => setOdometerKm(event.target.value.replace(/\D/g, ''))}
                    placeholder="Enter the reading"
                    className={fieldClassName}
                  />
                </Field>
                <Field
                  id="job-card-number"
                  label="Job card number"
                  supplied={dms && jobCardNumber === FILLED_READINGS.jobCardNumber}
                  source="job-card"
                  showSource={!dms && fetched && jobCardNumber === FILLED_READINGS.jobCardNumber}
                >
                  <Input
                    id="job-card-number"
                    required
                    value={jobCardNumber}
                    onChange={(event) => setJobCardNumber(event.target.value)}
                    placeholder={dms ? 'Enter the job card number' : 'Filled from your documents'}
                    className={filledClass('job-card')}
                  />
                </Field>
                <Field
                  id="battery-bin"
                  label="Battery identification number (BIN)"
                  supplied={dms}
                  source="bin"
                  showSource={!dms && fetched && bin === FILLED_READINGS.bin}
                >
                  <Input
                    id="battery-bin"
                    required
                    readOnly={dms}
                    value={bin}
                    onChange={(event) => setBin(event.target.value)}
                    placeholder="Filled from your documents"
                    className={cn(filledClass('bin'), dms && 'bg-slate-50')}
                  />
                </Field>
              </div>
            </ReadingSection>
          </Accordion>
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
      <Dialog open={previewSlot != null} onOpenChange={(open) => !open && setPreviewTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewSlot?.title}</DialogTitle>
            <DialogDescription>{previewSlot && attached[previewSlot.id]}</DialogDescription>
          </DialogHeader>
          {preview ? <DocumentPreview page={preview.page} highlight={preview.highlight} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
