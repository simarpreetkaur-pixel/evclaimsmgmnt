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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const UPLOAD_SLOTS = [
  { id: 'battery-images', title: 'Battery images', required: true, fileName: 'battery-image.jpg' },
  { id: 'service-history', title: 'Service history', required: false, fileName: 'service-history.png' },
  { id: 'ather-claim', title: 'Ather claim document', required: true, fileName: 'ather-claim-document.pdf' },
  { id: 'purchase-invoice', title: 'Purchase invoice', required: true, fileName: 'purchase-invoice.pdf' },
] as const;

type UploadSlotId = (typeof UPLOAD_SLOTS)[number]['id'];

const DMS_UPLOAD_ORDER: UploadSlotId[] = ['purchase-invoice', 'ather-claim'];

const SECTION_IDS = ['documents', 'visit', 'service-history', 'battery-health'] as const;

const FILLED_READINGS = {
  odometerKm: '40319',
  jobCardNumber: 'RJC4B07542502466077',
  bin: 'ATH-BIN-450X-1233',
  stateOfHealth: '95',
  cellImbalance: '0',
};

const SERVICE_HISTORY_ROWS = [
  ['MYHAAACA8PBB64153', 'RJC4B0G4237742', '30/06/2023 9:23 AM', '', '—', '—', '—', '5,087.48'],
  ['MYHAAACA8PBB64153', 'RJC422567244664', '25/06/2024 11:33 AM', '20K service, belt sound, handle vibration', '—', '—', '—', '10,982.84'],
  ['MYHAAACA8PBB64153', 'RJC422567244766', '26/06/2024 3:41 PM', 'Tyre rip', '—', '—', '—', '20,013.89'],
  ['MYHAAACA8PBB64153', 'RJC4B0G42323042', '10/11/2023 9:21 PM', '18K service, both brake checkup, belt noise up to 30 speed', '—', '—', '—', '10,413.19'],
  ['MYHAAACA8PBB64153', 'RJC4B0G42331077', '03/01/2024 11:22 AM', 'Rear tyre rip', '—', '—', '—', '12,395.26'],
  ['MYHAAACA8PBB64153', 'RJC4B0G423338343', '24/02/2024 11:03 AM', '15K service, both brake checkup, belt noise heavy at 40 speed', '—', '—', '—', '14,988.19'],
  ['MYHAAACA8PBB64153', 'RJC4225672412149', '10/10/2024 10:58 AM', '25K service, both brake pad rip, fork oil top-up', '—', '—', '—', '25,243.62'],
  ['MYHAAACA8PBB64153', 'RJC4225672501535358', '18/01/2025 1:47 AM', '30K service, both brake pad rip, silicon spray, rear tyre rip, brake oil top-up', '1.3', '88.93', 'No further action needed', '29,814.92'],
  ['MYHAAACA8PBB64153', 'RJC422567250370392', '09/06/2025 11:35 PM', '35K service, both brake pad rip, silicon spray, brake oil, caliper cap rip, rubbing polish, both gripper charge', '1.84', '93.64', 'No further action needed', '34,981.77'],
  ['MYHAAACA8PBB64153', 'RJC422567230290659', '23/02/2024 10:07 PM', '45K silicon spray, brake oil, air check, software update, range issue', '11.67', '93.78', 'No further action required, proceed with the normal flow.', '45,038.82'],
  ['MYHAAACA8PBB64153', 'RJC4B07542502466077', '14/10/2025 11:48 PM', '40K service, check battery health', '1.3', '92.57', 'No further action needed', '40,318.80'],
];

export const SERVICE_HISTORY_COLUMNS = [
  'VIN',
  'Job card no.',
  'Created',
  'Customer voice',
  'SOC imbalance',
  'SOH',
  'Advice',
  'Odometer',
];

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

const EMPTY_SERVICE_ROW = () => Array.from({ length: SERVICE_HISTORY_COLUMNS.length }, () => '');

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

function HealthParameter({
  id,
  label,
  value,
  sourceValue,
  showSource = true,
  highlighted = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  sourceValue: string;
  showSource?: boolean;
  highlighted?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm font-semibold text-pagination-text">
          {label}
          <span className="font-normal text-pagination-text-muted"> (optional)</span>
        </label>
        {showSource && value.length > 0 && value === sourceValue ? (
          <SourceIcon
            label={label}
            source={id === 'state-of-health' ? 'state-of-health' : 'cell-imbalance'}
          />
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ''))}
          placeholder="—"
          className={cn(fieldClassName, 'w-28', highlighted && 'bg-violet-50 shadow-[0_0_0_2px_rgba(139,92,246,0.45)]')}
        />
        <span className="text-sm text-pagination-text-muted">%</span>
      </div>
    </div>
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
  const [stateOfHealth, setStateOfHealth] = useState('');
  const [cellImbalance, setCellImbalance] = useState('');
  const [serviceRows, setServiceRows] = useState<string[][]>([EMPTY_SERVICE_ROW()]);
  const [serviceSource, setServiceSource] = useState<string[][] | null>(null);
  const readStarted = useRef(false);
  const dmsApplied = useRef(false);
  const fillTimers = useRef<number[]>([]);
  const serviceMatchesSource =
    serviceSource != null && JSON.stringify(serviceRows) === JSON.stringify(serviceSource);

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
    setOdometerKm(FILLED_READINGS.odometerKm);
    setJobCardNumber(FILLED_READINGS.jobCardNumber);
    setBin(FILLED_READINGS.bin);
    const filledHistory = SERVICE_HISTORY_ROWS.map((row) => [...row]);
    setServiceRows(filledHistory);
    setServiceSource(filledHistory.map((row) => [...row]));
    setOpenSections([...SECTION_IDS]);
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
    setOdometerKm(FILLED_READINGS.odometerKm);
    setJobCardNumber(FILLED_READINGS.jobCardNumber);
    setBin(FILLED_READINGS.bin);
    setStateOfHealth(FILLED_READINGS.stateOfHealth);
    setCellImbalance(FILLED_READINGS.cellImbalance);
    const filledHistory = SERVICE_HISTORY_ROWS.map((row) => [...row]);
    setServiceRows(filledHistory);
    setServiceSource(filledHistory.map((row) => [...row]));
    setOpenSections([...SECTION_IDS]);
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
      setReadLabel('Filling odometer, job card and BIN');
      setOdometerKm(FILLED_READINGS.odometerKm);
      setActiveField('odometer');
      document.getElementById('odometer-km')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    queue(fillStart + 500, () => {
      setJobCardNumber(FILLED_READINGS.jobCardNumber);
      setActiveField('job-card');
    });
    queue(fillStart + 1000, () => {
      setBin(FILLED_READINGS.bin);
      setActiveField('bin');
    });
    queue(fillStart + 1600, () => {
      setReadLabel('Filling service history');
      setActiveField('service');
      const filledHistory = SERVICE_HISTORY_ROWS.map((row) => [...row]);
      setServiceRows(filledHistory);
      setServiceSource(filledHistory.map((row) => [...row]));
      document.getElementById('service-history')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    queue(fillStart + 2300, () => {
      setReadLabel('Filling battery health');
      setStateOfHealth(FILLED_READINGS.stateOfHealth);
      setActiveField('soh');
      document.getElementById('battery-health')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    queue(fillStart + 2800, () => {
      setCellImbalance(FILLED_READINGS.cellImbalance);
      setActiveField('cell');
    });
    queue(fillStart + 3400, () => {
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
            stateOfHealth,
            cellImbalance,
            serviceHistory: serviceRows.filter((row) => row.some((cell) => cell.trim().length > 0)),
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
              ? 'Odometer, job card, BIN, and service history are filled from the dealership DMS. Upload the purchase invoice and the Ather claim document.'
              : 'Add the documents for this visit. The sections below fill in from them.'}
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
                    One click attaches every document. They are read first, then the fields fill in.
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
                <Field
                  id="odometer-km"
                  label="Odometer, km"
                  supplied={dms && odometerKm === FILLED_READINGS.odometerKm}
                  source="odometer"
                  showSource={!dms && fetched && odometerKm === FILLED_READINGS.odometerKm}
                >
                  <Input
                    id="odometer-km"
                    required
                    inputMode="numeric"
                    value={odometerKm}
                    onChange={(event) => setOdometerKm(event.target.value.replace(/\D/g, ''))}
                    placeholder={dms ? 'Enter the reading' : 'Filled from your documents'}
                    className={filledClass('odometer')}
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

            <ReadingSection
              id="service-history"
              title="Service history"
              filled={!dms && serviceMatchesSource}
              source="service-history"
              badge={dms && serviceMatchesSource ? 'From DMS' : undefined}
            >
              <div className="flex flex-col gap-3">
                <div
                  className={cn(
                    'border-claims-management-table-border rounded-claims-management-table overflow-hidden border bg-white transition-shadow duration-500',
                    activeField === 'service' && 'shadow-[0_0_0_2px_rgba(139,92,246,0.45)]',
                  )}
                >
                  <Table>
                    <TableHeader className="bg-claims-management-table-header-bg">
                      <TableRow className="border-claims-table-border border-b-claims-table-border hover:bg-transparent">
                        {SERVICE_HISTORY_COLUMNS.map((column) => (
                          <TableHead key={column} className="whitespace-nowrap">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceRows.map((row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          className="border-claims-management-table-border border-b-claims-management-table-border hover:bg-transparent"
                        >
                          {row.map((cell, columnIndex) => (
                            <TableCell
                              key={`${rowIndex}-${columnIndex}`}
                              className={cn(
                                'px-2 py-1',
                                columnIndex === 3 && 'min-w-56',
                                columnIndex === 6 && 'min-w-48',
                              )}
                            >
                              <Input
                                aria-label={`${SERVICE_HISTORY_COLUMNS[columnIndex]} row ${rowIndex + 1}`}
                                value={cell}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  setServiceRows((current) =>
                                    current.map((currentRow, currentIndex) =>
                                      currentIndex === rowIndex
                                        ? currentRow.map((currentCell, cellIndex) =>
                                            cellIndex === columnIndex ? nextValue : currentCell,
                                          )
                                        : currentRow,
                                    ),
                                  );
                                }}
                                className="border-policy-search-border h-8 min-w-28 bg-white px-2 text-sm shadow-none"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setServiceRows((current) => [...current, EMPTY_SERVICE_ROW()])}
                  className="border-policy-search-border h-9 w-fit bg-white px-4 text-sm font-medium shadow-policy-search"
                >
                  Add a visit
                </Button>
              </div>
            </ReadingSection>

            <ReadingSection
              id="battery-health"
              title="State of health and cell imbalance"
              filled={fetched}
            >
              <div className="flex flex-col gap-5">
                <HealthParameter
                  id="state-of-health"
                  label="State of health"
                  value={stateOfHealth}
                  sourceValue={FILLED_READINGS.stateOfHealth}
                  showSource={!dms}
                  highlighted={activeField === 'soh'}
                  onChange={setStateOfHealth}
                />
                <div className="border-claims-table-border border-t" />
                <HealthParameter
                  id="cell-imbalance"
                  label="Cell imbalance"
                  value={cellImbalance}
                  sourceValue={FILLED_READINGS.cellImbalance}
                  showSource={!dms}
                  highlighted={activeField === 'cell'}
                  onChange={setCellImbalance}
                />
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
