'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Flag } from 'lucide-react';

import Breadcrumbs from '@/components/molecules/Breadcrumbs';
import { PAGE_LAYOUT_CLASS, PAGE_TITLE_CLASS } from '@/components/molecules/PageHeading';
import SegmentedTabs from '@/components/molecules/SegmentedTabs';
import UploadRequiredBanner from '@/components/molecules/UploadRequiredBanner';
import ClaimDetailsTable from '@/components/organisms/ClaimDetailsTable';
import InformationCard from '@/components/organisms/InformationCard';
import StatusTimeline from '@/components/organisms/StatusTimeline';
import UploadDocumentsDialog from '@/components/organisms/UploadDocumentsDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ONGOING_CLAIMS,
  STATUS_CLASS,
  type OngoingClaim,
} from '@/features/overview/DealershipOpsOverview';
import {
  CLOSED_CLAIMS,
  OPEN_CLAIMS,
  QUERY_ACTIONS,
  UPLOAD_ACTIONS,
} from '@/features/overview/overviewContent';
import { useRaisedClaimsStore } from '@/lib/prototype/raisedClaims';
import { getPrototypeEmail, getPrototypeFirstName } from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';
import type {
  ClaimDocumentRow,
  UploadDocumentsRow,
} from '@/lib/types/claims-management/claimDetails';
import type { StatusTimelineItem } from '@/lib/types/claims-management';
import { cn, formatEnum } from '@/lib/utils';

const TABS = [
  { value: 'claim-overview', label: 'Claim overview' },
  { value: 'claimant-information', label: 'Claimant information' },
  { value: 'documents', label: 'Documents' },
  { value: 'communication-log', label: 'Communication log' },
];

type DocumentSeed = {
  id: string;
  label: string;
  date: string;
  note: string;
  status: ClaimDocumentRow['status'];
};

const ATTENTION_CLAIMS: OngoingClaim[] = [
  {
    id: 'CLM-10490',
    customer: 'Rahul Menon',
    vehicle: 'Ather 450X',
    registration: 'KA03AB2190',
    raisedOn: '16 Nov',
    status: 'ACKO needs documents',
    filter: 'documents',
  },
  {
    id: 'CLM-10476',
    customer: 'Sneha Reddy',
    vehicle: 'Ather Rizta',
    registration: 'TS09PQ2281',
    raisedOn: '15 Nov',
    status: 'ACKO needs documents',
    filter: 'documents',
  },
  {
    id: 'CLM-10455',
    customer: 'Anita Rao',
    vehicle: 'Ather 450X',
    registration: 'KA05CD4412',
    raisedOn: '12 Nov',
    status: 'Approved · invoice due',
    filter: 'invoice-due',
  },
];

function requestedDocument(
  id: string,
  type: string,
  comment: string,
  isAdditional = false,
): UploadDocumentsRow {
  return {
    id,
    groupId: id,
    type,
    comment,
    isAdditional,
    isUploaded: false,
    note: '',
    taskId: 'prototype',
    machineInstanceId: 'prototype',
    state: 'REQUESTED',
  };
}

type ClaimStory = {
  phone: string;
  vin: string;
  policy: string;
  failedOn: string;
  closestMatch: string;
  odometer: string;
  jobCard: string;
  bin: string;
  stateOfHealth: string;
  cellImbalance: string;
  observation: string;
  documents: DocumentSeed[];
  request?: {
    title: string;
    description: string;
    actionLabel: string;
    dialogTitle: string;
    followUp: DocumentSeed;
  };
  uploadRows?: UploadDocumentsRow[];
  handlerNote?: { body: string; date: string };
};

const STORIES: Record<string, ClaimStory> = {
  'CLM-2026-0812': {
    phone: '98450 22190',
    vin: 'MD626AM12R1A0812',
    policy: 'ATH-BAT-0812',
    failedOn: '24 Sep 2026',
    closestMatch: 'State of health degradation',
    odometer: '18,420 km',
    jobCard: 'RJC4B075426090812',
    bin: 'ATH-BIN-450X-0812',
    stateOfHealth: '91%',
    cellImbalance: '1.8%',
    observation: 'Range dropped after a full charge and the battery warning stayed on.',
    documents: [
      {
        id: 'battery-images',
        label: 'Battery images',
        date: '26 Sep 2026',
        note: 'Pack and connector photos from the job card.',
        status: 'Under evaluation',
      },
      {
        id: 'service-history',
        label: 'Service history',
        date: '26 Sep 2026',
        note: 'The file stops at the 10,000 km service. The failure was at 18,420 km.',
        status: 'Rejected',
      },
      {
        id: 'claim-document',
        label: 'Ather claim document',
        date: '26 Sep 2026',
        note: 'Dealership claim form.',
        status: 'Under evaluation',
      },
    ],
    request: {
      title: 'Documents requested',
      description:
        'The service history stops before the failure, and there is no photo of the battery warning.',
      actionLabel: 'Attach document',
      dialogTitle: 'Upload the missing records',
      followUp: {
        id: 'service-history-full',
        label: 'Service history',
        date: 'Today',
        note: 'Service history through the failure visit.',
        status: 'Under evaluation',
      },
    },
    uploadRows: [
      requestedDocument(
        'service-history',
        'service_history',
        'The service history stops at the 10,000 km visit. The failure was at 18,420 km on 24 Sep. Upload the history through that visit.',
      ),
      requestedDocument(
        'dashboard-warning',
        'dashboard_warning_photo',
        'The claim says the battery warning stayed on after a full charge. Acko has no photo of that lamp. Upload a photo of the dashboard from this visit.',
        true,
      ),
    ],
  },
  'CLM-2026-0819': {
    phone: '99001 77810',
    vin: 'MD626AM12R1A0819',
    policy: 'ATH-BAT-0819',
    failedOn: '5 Oct 2026',
    closestMatch: 'Cell imbalance',
    odometer: '22,110 km',
    jobCard: 'RJC4B075426100819',
    bin: 'ATH-BIN-RIZTA-0819',
    stateOfHealth: '93%',
    cellImbalance: '2.4%',
    observation: 'The scooter cut out on a hill. Cell imbalance was high at the workshop.',
    documents: [
      {
        id: 'battery-images',
        label: 'Battery images',
        date: '7 Oct 2026',
        note: 'Under-seat pack photos.',
        status: 'Under evaluation',
      },
      {
        id: 'job-card',
        label: 'Job card',
        date: '7 Oct 2026',
        note: 'Job card RJC4B075426100819, readable.',
        status: 'Under evaluation',
      },
    ],
    request: {
      title: 'Acko needs a document',
      description: 'Acko needs the per-cell voltage log from the day the scooter cut out.',
      actionLabel: 'Attach document',
      dialogTitle: 'Upload the cell voltage log',
      followUp: {
        id: 'cell-log',
        label: 'Cell voltage log',
        date: 'Today',
        note: 'Per-cell voltages from the hill cut-out.',
        status: 'Under evaluation',
      },
    },
    uploadRows: [
      requestedDocument(
        'cell-log',
        'cell_voltage_log',
        'The claim only records a cell imbalance of 2.4%. The Rizta cut out on a hill on 5 Oct. Upload the per-cell voltage log from that visit.',
        true,
      ),
    ],
  },
  'CLM-2026-0866': {
    phone: '98860 19021',
    vin: 'MD626AM12R1A0866',
    policy: 'ATH-BAT-0866',
    failedOn: '11 Oct 2026',
    closestMatch: 'Cell failure',
    odometer: '31,540 km',
    jobCard: 'RJC4B075426100866',
    bin: 'ATH-BIN-450X-0866',
    stateOfHealth: '88%',
    cellImbalance: '3.1%',
    observation: 'One cell group failed at the 30,000 km service.',
    documents: [
      {
        id: 'battery-images',
        label: 'Battery images',
        date: '14 Oct 2026',
        note: 'Failed module photos.',
        status: 'Approved',
      },
      {
        id: 'service-history',
        label: 'Service history',
        date: '14 Oct 2026',
        note: 'Accepted with the claim.',
        status: 'Approved',
      },
      {
        id: 'claim-document',
        label: 'Ather claim document',
        date: '14 Oct 2026',
        note: 'Approved for battery replacement.',
        status: 'Approved',
      },
    ],
    request: {
      title: 'Invoice due',
      description: 'Only the failed cell group was replaced. Upload the GST invoice for that module.',
      actionLabel: 'Attach invoice',
      dialogTitle: 'Upload the module invoice',
      followUp: {
        id: 'module-invoice',
        label: 'Module invoice',
        date: 'Today',
        note: 'GST invoice for the replacement cell group.',
        status: 'Under evaluation',
      },
    },
    uploadRows: [
      requestedDocument(
        'module-invoice',
        'replacement_module_invoice',
        'Only the failed cell group was replaced on KA 03 EV 9021, not the whole pack. Upload the GST invoice for that module, dated on or after 14 Oct, with the new module number.',
        true,
      ),
    ],
  },
  'CLM-10490': {
    phone: '98450 11233',
    vin: 'MD626AM12R1A1233',
    policy: 'ATH-BAT-1233',
    failedOn: '14 Nov 2026',
    closestMatch: 'State of health degradation',
    odometer: '40,319 km',
    jobCard: 'RJC4B07542502466077',
    bin: 'ATH-BIN-450X-1233',
    stateOfHealth: '95%',
    cellImbalance: '0%',
    observation: 'Range fell below 50 km after a full charge. The workshop photographed the BMS screen instead of exporting the log.',
    documents: [
      {
        id: 'service-history',
        label: 'Service history',
        date: '16 Nov 2026',
        note: 'Uploaded by the dealership.',
        status: 'Under evaluation',
      },
      {
        id: 'claim-document',
        label: 'Ather claim document',
        date: '16 Nov 2026',
        note: 'Uploaded by the dealership.',
        status: 'Under evaluation',
      },
      {
        id: 'diagnostic',
        label: 'Diagnostic report',
        date: '16 Nov 2026',
        note: 'Photo of a laptop screen. The BMS log cannot be read.',
        status: 'Rejected',
      },
    ],
    request: {
      title: 'ACKO needs documents',
      description: 'The diagnostic report is unreadable. Upload the BMS log, not a photo of the screen.',
      actionLabel: 'Attach document',
      dialogTitle: 'Upload a clearer diagnostic',
      followUp: {
        id: 'diagnostic-clear',
        label: 'Diagnostic report',
        date: 'Today',
        note: 'BMS log uploaded by the dealership.',
        status: 'Under evaluation',
      },
    },
    uploadRows: [
      requestedDocument(
        'diagnostic',
        'diagnostic_report',
        'The diagnostic file for job card RJC4B07542502466077 cannot be read. Upload the BMS log from the Ather tool, not a photo of the laptop screen.',
      ),
    ],
  },
  'CLM-10476': {
    phone: '99001 22810',
    vin: 'MD626AM12R1A0476',
    policy: 'ATH-BAT-0476',
    failedOn: '13 Nov 2026',
    closestMatch: 'Cell imbalance',
    odometer: '22,110 km',
    jobCard: 'RJC4B075426110476',
    bin: 'ATH-BIN-RIZTA-0476',
    stateOfHealth: '93%',
    cellImbalance: '2.4%',
    observation: 'The pack would not take a charge. The only job card from that visit is too dark to read.',
    documents: [
      {
        id: 'battery-images',
        label: 'Battery images',
        date: '15 Nov 2026',
        note: 'Uploaded by the dealership.',
        status: 'Under evaluation',
      },
      {
        id: 'job-card',
        label: 'Job card',
        date: '15 Nov 2026',
        note: 'Photo of RJC4B075426110476 is too dark to read the odometer.',
        status: 'Rejected',
      },
    ],
    request: {
      title: 'ACKO needs documents',
      description: 'The job card photo is too dark to read the odometer and the complaint.',
      actionLabel: 'Attach document',
      dialogTitle: 'Upload a clearer job card',
      followUp: {
        id: 'job-card-clear',
        label: 'Job card',
        date: 'Today',
        note: 'Clearer job card photo uploaded by the dealership.',
        status: 'Under evaluation',
      },
    },
    uploadRows: [
      requestedDocument(
        'job-card',
        'job_card',
        'The photo of job card RJC4B075426110476 is too dark. The odometer and the customer complaint cannot be read. Upload a clearer photo, or the PDF from the job card system.',
      ),
    ],
  },
  'CLM-10455': {
    phone: '98802 44120',
    vin: 'MD626AM12R1A0455',
    policy: 'ATH-BAT-0455',
    failedOn: '8 Nov 2026',
    closestMatch: 'Cell failure',
    odometer: '36,200 km',
    jobCard: 'RJC4B075426110455',
    bin: 'ATH-BIN-450X-0455',
    stateOfHealth: '86%',
    cellImbalance: '3.4%',
    observation: 'A cell group failed and Acko approved the battery replacement.',
    documents: [
      {
        id: 'battery-images',
        label: 'Battery images',
        date: '12 Nov 2026',
        note: 'Approved with the claim.',
        status: 'Approved',
      },
      {
        id: 'claim-document',
        label: 'Ather claim document',
        date: '12 Nov 2026',
        note: 'Approved with the claim.',
        status: 'Approved',
      },
    ],
    request: {
      title: 'Approved · invoice due',
      description:
        'The pack replacement on KA05CD4412 was approved on 12 Nov. Upload the tax invoice for the new pack.',
      actionLabel: 'Attach invoice',
      dialogTitle: 'Upload the pack invoice',
      followUp: {
        id: 'invoice',
        label: 'Purchase invoice',
        date: 'Today',
        note: 'Tax invoice for the replacement pack.',
        status: 'Under evaluation',
      },
    },
    uploadRows: [
      requestedDocument(
        'invoice',
        'purchase_invoice',
        'The battery replacement for KA05CD4412 was approved on 12 Nov. Upload the tax invoice for the new pack. It should show BIN ATH-BIN-450X-0455 and claim CLM-10455.',
        true,
      ),
    ],
  },
};

const FALLBACK_DOCUMENTS: DocumentSeed[] = [
  {
    id: 'battery-images',
    label: 'Battery images',
    date: 'Raised with the claim',
    note: 'Uploaded by the dealership.',
    status: 'Under evaluation',
  },
  {
    id: 'service-history',
    label: 'Service history',
    date: 'Raised with the claim',
    note: 'Uploaded by the dealership.',
    status: 'Under evaluation',
  },
  {
    id: 'claim-document',
    label: 'Ather claim document',
    date: 'Raised with the claim',
    note: 'Uploaded by the dealership.',
    status: 'Under evaluation',
  },
  {
    id: 'invoice',
    label: 'Purchase invoice',
    date: 'Raised with the claim',
    note: 'Uploaded by the dealership.',
    status: 'Under evaluation',
  },
];

const OVERVIEW_STATUS: Record<string, Pick<OngoingClaim, 'status' | 'filter'>> = {
  'With ACKO': { status: 'With ACKO', filter: 'in-review' },
  'ACKO needs documents': { status: 'ACKO needs documents', filter: 'documents' },
  'Documents requested': { status: 'Documents requested', filter: 'documents' },
  'Approved · invoice due': { status: 'Approved · invoice due', filter: 'invoice-due' },
  'Upload invoice': { status: 'Upload invoice', filter: 'invoice-due' },
  'Invoice due': { status: 'Invoice due', filter: 'invoice-due' },
  'Invoice approved': { status: 'Invoice approved', filter: 'payment-pending' },
  'Waiting for payment': { status: 'Waiting for payment', filter: 'payment-pending' },
  'Payment on the way': { status: 'Payment on the way', filter: 'payment-pending' },
  'Payment overdue': { status: 'Payment overdue', filter: 'payment-pending' },
  Paid: { status: 'Paid', filter: 'paid' },
  Closed: { status: 'Closed', filter: 'closed' },
  'Closed · reopenable': { status: 'Closed · reopenable', filter: 'closed' },
  'Not covered': { status: 'Not covered', filter: 'rejected' },
  'Not approved': { status: 'Not approved', filter: 'rejected' },
  'Partly approved': { status: 'Partly approved', filter: 'in-review' },
  'Query raised': { status: 'Query raised', filter: 'in-review' },
};

function splitVehicleLine(line: string) {
  const parts = line.split(' · ').filter((part) => !part.startsWith('CLM-'));
  return {
    vehicle: parts[0] ?? '',
    registration: parts[1] ?? '',
  };
}

function overviewClaim(claimNumber: string): OngoingClaim | undefined {
  const row = [...OPEN_CLAIMS, ...CLOSED_CLAIMS].find((item) => item.id === claimNumber);
  if (row) {
    const vehicle = splitVehicleLine(row.vehicle);
    const mapped = OVERVIEW_STATUS[row.status];
    if (!mapped) return undefined;
    return {
      id: row.id,
      customer: row.customer,
      vehicle: vehicle.vehicle,
      registration: vehicle.registration,
      raisedOn: row.raised,
      status: mapped.status,
      filter: mapped.filter,
    };
  }

  const action = [...UPLOAD_ACTIONS, ...QUERY_ACTIONS].find((item) => item.id === claimNumber);
  if (!action) return undefined;
  const vehicle = splitVehicleLine(action.vehicle);
  const mapped = OVERVIEW_STATUS[action.badge];
  if (!mapped) return undefined;
  return {
    id: action.id,
    customer: action.customer,
    vehicle: vehicle.vehicle,
    registration: vehicle.registration,
    raisedOn: action.raisedOn,
    status: mapped.status,
    filter: mapped.filter,
  };
}

function overviewStory(claim: OngoingClaim): ClaimStory | null {
  const row = [...OPEN_CLAIMS, ...CLOSED_CLAIMS].find((item) => item.id === claim.id);
  const action = [...UPLOAD_ACTIONS, ...QUERY_ACTIONS].find((item) => item.id === claim.id);
  if (!row && !action) return null;

  const suffix = claim.id.replace(/\D/g, '').slice(-4);
  const detail = action?.detail ?? row?.next ?? '';
  const when = row?.next ?? claim.raisedOn;
  const needsUpload = claim.filter === 'documents' || claim.filter === 'invoice-due';
  const decided =
    claim.filter === 'closed' ||
    claim.filter === 'rejected' ||
    claim.filter === 'payment-pending' ||
    claim.filter === 'paid';

  return {
    phone: `98${suffix} 1200`,
    vin: `MD626AM12R1A${suffix}`,
    policy: `ATH-BAT-${suffix}`,
    failedOn: claim.raisedOn,
    closestMatch:
      claim.status === 'Not approved' || claim.status === 'Not covered'
        ? 'BMS fault'
        : claim.status === 'Partly approved'
          ? 'Cell failure'
          : 'BMS fault',
    odometer: '27,600 km',
    jobCard: `RJC4B0754${suffix}`,
    bin: `ATH-BIN-${suffix}`,
    stateOfHealth: '90%',
    cellImbalance: '1.4%',
    observation: detail || 'The battery warning came on during regular use.',
    documents: FALLBACK_DOCUMENTS.map((document) => ({
      ...document,
      status: decided ? 'Approved' : 'Under evaluation',
      date: claim.raisedOn,
    })),
    request: needsUpload
      ? {
          title: claim.status,
          description: detail,
          actionLabel: claim.filter === 'invoice-due' ? 'Attach invoice' : 'Attach document',
          dialogTitle: claim.filter === 'invoice-due' ? 'Upload the invoice' : 'Upload the requested document',
          followUp: {
            id: claim.filter === 'invoice-due' ? 'invoice' : 'requested-document',
            label: claim.filter === 'invoice-due' ? 'Purchase invoice' : (row?.next ?? 'Requested document'),
            date: 'Today',
            note: detail,
            status: 'Under evaluation',
          },
        }
      : undefined,
    handlerNote:
      claim.status === 'Not approved' ||
      claim.status === 'Not covered' ||
      claim.status === 'Partly approved' ||
      claim.status === 'Query raised'
        ? {
            body: `${(detail && detail !== when ? `${detail} ${when}` : detail || when).replace(/\.+$/, '')}.`,
            date: claim.raisedOn,
          }
        : claim.status === 'Payment overdue'
          ? { body: `The payout has not arrived. ${when}.`, date: claim.raisedOn }
          : undefined,
  };
}

function storyFor(claim: OngoingClaim): ClaimStory {
  const known = STORIES[claim.id];
  if (known) return known;

  const fromOverview = overviewStory(claim);
  if (fromOverview) return fromOverview;

  const closed = claim.filter === 'closed' || claim.filter === 'paid' || claim.filter === 'rejected';
  return {
    phone: '98000 00000',
    vin: `MD626AM12R1A${claim.id.slice(-4)}`,
    policy: `ATH-BAT-${claim.id.slice(-4)}`,
    failedOn: claim.raisedOn,
    closestMatch: claim.status === 'Rejected' ? 'Physical damage' : 'BMS fault',
    odometer: '27,600 km',
    jobCard: `RJC4B0754${claim.id.slice(-4)}`,
    bin: `ATH-BIN-${claim.id.slice(-4)}`,
    stateOfHealth: '90%',
    cellImbalance: '1.2%',
    observation:
      claim.status === 'Paid'
        ? 'The battery pack was replaced and Acko paid the invoice.'
        : claim.status === 'Rejected'
          ? 'The casing was physically damaged. That is outside the battery warranty.'
          : claim.status === 'Payment pending'
            ? 'The invoice is with Acko. The payout has not been made yet.'
            : 'The battery warning came on during regular use.',
    documents: FALLBACK_DOCUMENTS.map((document) => ({
      ...document,
      status: closed ? 'Approved' : 'Under evaluation',
      date: claim.raisedOn,
    })),
    handlerNote:
      claim.status === 'Rejected'
        ? {
            body: 'The casing was physically damaged. That sits outside the battery warranty.',
            date: claim.raisedOn,
          }
        : undefined,
  };
}

type ClaimMessage = {
  id: string;
  from: 'dealership' | 'acko';
  author: string;
  body: string;
  at: string;
};

const CLAIM_MESSAGE_STORAGE_KEY = 'pp_claim_messages';

function readClaimMessages(): Record<string, ClaimMessage[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(CLAIM_MESSAGE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ClaimMessage[]>) : {};
  } catch {
    return {};
  }
}

function messageTime(date = new Date()): string {
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ackoReply(note: ClaimMessage): ClaimMessage {
  return {
    id: `${note.id}-reply`,
    from: 'acko',
    author: 'ACKO',
    body: 'We have your note. A handler is looking at this claim and will keep the reply here.',
    at: messageTime(),
  };
}

function handlerNoteItem(story: ClaimStory): StatusTimelineItem | null {
  if (!story.handlerNote) return null;
  return {
    id: 'handler-note',
    description: 'Note from ACKO',
    title: story.handlerNote.body,
    performer: 'ACKO',
    timestampLabel: '',
    timestamp: story.handlerNote.date,
    isActive: true,
  };
}

function messageItems(messages: ClaimMessage[]): StatusTimelineItem[] {
  return messages.map((message, index) => ({
    id: message.id,
    description: message.from === 'acko' ? 'Reply from ACKO' : 'Note to ACKO',
    title: message.body,
    performer: message.from === 'acko' ? 'ACKO' : message.author,
    timestampLabel: '',
    timestamp: message.at,
    isActive: index === 0,
  }));
}

function statusTooltip(status: string): string {
  if (status === 'In review with ACKO' || status === 'With ACKO') {
    return 'ACKO is checking this claim.';
  }
  if (status === 'ACKO needs documents' || status === 'Documents requested') {
    return 'ACKO is waiting for documents.';
  }
  if (status === 'Approved · invoice due' || status === 'Upload invoice' || status === 'Invoice due') {
    return 'Approved. The repair invoice is still due.';
  }
  if (status === 'Invoice approved') return 'ACKO approved the invoice.';
  if (status === 'Waiting for payment' || status === 'Payment pending') {
    return 'Payment has not gone out yet.';
  }
  if (status === 'Payment on the way') return 'Payment is being processed.';
  if (status === 'Payment overdue') return 'Payment is past the expected date.';
  if (status === 'Paid') return 'ACKO has paid this claim.';
  if (status === 'Rejected' || status === 'Not approved') return 'ACKO did not approve this claim.';
  if (status === 'Partly approved') return 'ACKO approved only part of this claim.';
  if (status === 'Not covered') return 'This failure is outside the cover.';
  if (status === 'Query raised') return 'ACKO has a question on this claim.';
  if (status === 'Closed') return 'This claim is closed.';
  if (status === 'Closed · reopenable') return 'Closed for now. It can be raised again.';
  return 'ACKO is checking this claim.';
}

function statusUpdateCopy(status: string): string {
  if (status === 'Paid') return 'Acko paid the replacement invoice.';
  if (status === 'Rejected') return 'Acko rejected this claim.';
  if (status === 'Closed' || status === 'Closed · reopenable') {
    return 'Closed for now. The dealership can raise it again with a clearer inspection.';
  }
  if (status === 'ACKO needs documents' || status === 'Documents requested') {
    return 'Acko asked the dealership for documents.';
  }
  if (
    status === 'Payment pending' ||
    status === 'Payment on the way' ||
    status === 'Payment overdue' ||
    status === 'Waiting for payment' ||
    status === 'Invoice approved' ||
    status === 'Upload invoice' ||
    status === 'Approved · invoice due' ||
    status === 'Invoice due'
  ) {
    return 'The claim moved on to payment.';
  }
  if (status === 'Not approved' || status === 'Partly approved' || status === 'Not covered') {
    return 'Acko recorded a decision on this claim.';
  }
  if (status === 'Query raised') return 'A query is open on this claim.';
  return 'Acko is checking the readings and the documents.';
}

function timelineFor(claim: OngoingClaim): StatusTimelineItem[] {
  const current: StatusTimelineItem = {
    id: 'current-status',
    description: claim.status,
    title: statusUpdateCopy(claim.status),
    stageDescription: statusTooltip(claim.status),
    performer: '',
    timestampLabel: '',
    timestamp: claim.raisedOn,
    isActive: true,
  };
  const alreadyInReview = claim.status === 'In review with ACKO' || claim.status === 'With ACKO';
  if (alreadyInReview) return [current];
  return [
    current,
    {
      id: 'review',
      description: 'In review with ACKO',
      title: 'Acko is checking the readings and the documents.',
      stageDescription: statusTooltip('In review with ACKO'),
      performer: '',
      timestampLabel: '',
      timestamp: claim.raisedOn,
      isActive: false,
    },
  ];
}

function toDocumentRow(seed: DocumentSeed, uploadedBy: string): ClaimDocumentRow {
  return {
    id: seed.id,
    label: seed.label,
    uploadedBy,
    date: seed.date,
    note: seed.note,
    status: seed.status,
    actions: [{ type: 'view' }, { type: 'download' }],
    document: { data: [] },
  };
}

function informationColumns(items: { label: string; value: string }[]) {
  const midpoint = Math.ceil(items.length / 2);
  return [
    { id: 'left', items: items.slice(0, midpoint) },
    { id: 'right', items: items.slice(midpoint) },
  ].filter((column) => column.items.length > 0);
}

function rowsFromStory(story: ClaimStory): UploadDocumentsRow[] {
  if (story.uploadRows) {
    return story.uploadRows.map((row) => ({ ...row }));
  }
  if (!story.request) return [];
  const invoice = story.request.followUp.label.toLowerCase().includes('invoice');
  return [
    requestedDocument(
      story.request.followUp.id,
      story.request.followUp.label.toLowerCase().replace(/\s+/g, '_'),
      story.request.description,
      invoice,
    ),
  ];
}

export default function DealershipClaimDetail() {
  const { partner } = useParams<{ partner: string }>();
  const searchParams = useSearchParams();
  const claimNumber = searchParams.get('claimNumber')?.trim() ?? '';
  const { userProfile } = useUserProfileStore();
  const raisedClaims = useRaisedClaimsStore((state) => state.claims);
  const hydrateRaisedClaims = useRaisedClaimsStore((state) => state.hydrate);
  const claim = useMemo(
    () =>
      raisedClaims.find((item) => item.id === claimNumber) ??
      ONGOING_CLAIMS.find((item) => item.id === claimNumber) ??
      ATTENTION_CLAIMS.find((item) => item.id === claimNumber) ??
      overviewClaim(claimNumber),
    [claimNumber, raisedClaims],
  );
  const [tab, setTab] = useState(searchParams.get('tab') === 'documents' ? 'documents' : 'claim-overview');
  const [requestSent, setRequestSent] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadRows, setUploadRows] = useState<UploadDocumentsRow[]>([]);
  const [submittedDocs, setSubmittedDocs] = useState<DocumentSeed[]>([]);
  const [claimsReady, setClaimsReady] = useState(false);
  const [messagesReady, setMessagesReady] = useState(false);
  const [threads, setThreads] = useState<Record<string, ClaimMessage[]>>({});
  const [composeOpen, setComposeOpen] = useState(false);
  const [justSentOpen, setJustSentOpen] = useState(false);
  const [note, setNote] = useState('');
  const replyTimer = useRef<number | null>(null);

  useEffect(() => {
    hydrateRaisedClaims();
    setClaimsReady(true);
  }, [hydrateRaisedClaims]);

  useEffect(() => {
    const stored = readClaimMessages();
    const completed = Object.fromEntries(
      Object.entries(stored).map(([id, messages]) => [
        id,
        messages[0]?.from === 'dealership' ? [ackoReply(messages[0]), ...messages] : messages,
      ]),
    );
    setThreads(completed);
    setMessagesReady(true);
  }, []);

  useEffect(() => {
    if (!messagesReady) return;
    window.sessionStorage.setItem(CLAIM_MESSAGE_STORAGE_KEY, JSON.stringify(threads));
  }, [messagesReady, threads]);

  useEffect(
    () => () => {
      if (replyTimer.current) window.clearTimeout(replyTimer.current);
    },
    [],
  );

  const story = useMemo(() => (claim ? storyFor(claim) : null), [claim]);

  useEffect(() => {
    setTab(searchParams.get('tab') === 'documents' ? 'documents' : 'claim-overview');
    setRequestSent(false);
    setUploadOpen(false);
    setSubmittedDocs([]);
    setUploadRows(story ? rowsFromStory(story) : []);
    setComposeOpen(false);
    setJustSentOpen(false);
    setNote('');
  }, [claimNumber, story]);

  if (!claimsReady) {
    return null;
  }

  if (!claim || !story) {
    return (
      <div className={PAGE_LAYOUT_CLASS}>
        <Breadcrumbs />
        <div className="flex flex-col gap-3">
          <h1 className={PAGE_TITLE_CLASS}>Claim not found</h1>
          <p className="text-sm text-pagination-text-muted">
            This claim is not on the dealership list.
          </p>
          <Button asChild variant="outline" className="h-9 w-fit px-4">
            <Link href={`/${partner}/dashboard/overview`}>Back to overview</Link>
          </Button>
        </div>
      </div>
    );
  }

  const documents = [
    ...story.documents.map((document) => toDocumentRow(document, 'Dealership')),
    ...submittedDocs.map((document) => toDocumentRow(document, 'Dealership')),
  ];
  const showRequest = Boolean(story.request) && !requestSent;
  const thread = threads[claim.id] ?? [];
  const waitingOnAcko = thread[0]?.from === 'dealership';
  const handlerNote = handlerNoteItem(story);
  const statusItems = timelineFor(claim);
  const communicationItems = [...messageItems(thread), ...(handlerNote ? [handlerNote] : [])].map(
    (item, index) => ({ ...item, isActive: index === 0 }),
  );

  const openMessage = () => {
    if (waitingOnAcko) {
      setJustSentOpen(true);
      return;
    }
    setNote('');
    setComposeOpen(true);
  };

  const sendNote = () => {
    const body = note.trim();
    if (!body) return;
    const claimId = claim.id;
    const sent: ClaimMessage = {
      id: `note-${Date.now()}`,
      from: 'dealership',
      author: getPrototypeFirstName(userProfile?.email || getPrototypeEmail()),
      body,
      at: messageTime(),
    };
    setThreads((current) => ({
      ...current,
      [claimId]: [sent, ...(current[claimId] ?? [])],
    }));
    setNote('');
    setComposeOpen(false);
    setTab('communication-log');
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      setThreads((current) => {
        const existing = current[claimId] ?? [];
        if (existing[0]?.id !== sent.id) return current;
        return { ...current, [claimId]: [ackoReply(sent), ...existing] };
      });
    }, 1800);
  };

  return (
    <div className={PAGE_LAYOUT_CLASS}>
      <Breadcrumbs />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={PAGE_TITLE_CLASS}>Claim: {claim.id}</h1>
          <Badge className={cn('border px-2 py-0.5 text-xs font-medium', STATUS_CLASS[claim.status])}>
            {claim.status}
          </Badge>
        </div>
        <Button
          type="button"
          onClick={openMessage}
          className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover h-8 gap-1.5 rounded-full px-4 text-sm font-medium"
        >
          <Flag className="size-3.5 opacity-80" strokeWidth={1.75} />
          Raise to ACKO
        </Button>
      </div>

      <SegmentedTabs
        value={tab}
        onValueChange={setTab}
        tabs={TABS}
        className="min-h-12 w-full max-w-5xl py-3"
        triggerClassName="h-10 px-2 py-4"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {tab === 'claim-overview' ? (
            <>
              <InformationCard
                title="Claim summary"
                columns={informationColumns([
                  { label: 'Claim number', value: claim.id },
                  { label: 'Raised on', value: claim.raisedOn },
                  { label: 'Policy', value: story.policy },
                  { label: 'Plan', value: 'Battery extended warranty' },
                  { label: 'Coverage', value: 'Battery' },
                  { label: 'Vehicle', value: claim.vehicle },
                  { label: 'Registration', value: claim.registration },
                  { label: 'VIN', value: story.vin },
                  { label: 'Odometer', value: story.odometer },
                  { label: 'Job card', value: story.jobCard },
                  { label: 'Battery identification number', value: story.bin },
                ])}
              />
              <InformationCard
                title="What happened"
                columns={informationColumns([
                  { label: 'What the customer reported', value: story.observation },
                  { label: 'When it failed', value: story.failedOn },
                  { label: 'Closest failure match', value: story.closestMatch },
                ])}
              />
            </>
          ) : null}

          {tab === 'claimant-information' ? (
            <InformationCard
              title="Claimant"
              columns={informationColumns([
                { label: 'Name', value: claim.customer },
                { label: 'Mobile', value: story.phone },
                { label: 'Vehicle', value: claim.vehicle },
                { label: 'Registration', value: claim.registration },
                { label: 'Policy', value: story.policy },
                { label: 'Plan', value: 'Battery extended warranty' },
              ])}
            />
          ) : null}

          {tab === 'communication-log' ? (
            <StatusTimeline
              header={
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold leading-7 text-pagination-text">Communication log</h2>
                  <p className="text-sm font-normal text-pagination-text-muted">
                    Notes written to ACKO, and the replies that come back.
                  </p>
                </div>
              }
              items={communicationItems}
              emptyLabel="No notes yet. Use Raise to ACKO to write the first one."
            />
          ) : null}

          {tab === 'documents' ? (
            <div className="flex flex-col gap-4">
              {showRequest && story.request ? (
                <UploadRequiredBanner
                  title={story.request.title}
                  description={story.request.description}
                  actionLabel={story.request.actionLabel}
                  onActionClick={() => setUploadOpen(true)}
                />
              ) : null}
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold leading-7 text-pagination-text">
                  Documents uploaded
                </h2>
                <ClaimDetailsTable variant="documents" data={documents} />
              </div>
            </div>
          ) : null}

        </div>

        <StatusTimeline title="Status timeline" items={statusItems} emptyLabel="No status updates yet." />
      </div>

      <Dialog open={justSentOpen} onOpenChange={setJustSentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>You just sent a note</DialogTitle>
            <DialogDescription>
              ACKO has your note on {claim.id}. You can send another if there is more to add.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setJustSentOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover"
              onClick={() => {
                setJustSentOpen(false);
                setNote('');
                setComposeOpen(true);
              }}
            >
              Send another note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) setNote('');
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Raise to ACKO</DialogTitle>
            <DialogDescription>
              Add a note for {claim.id}. It shows in the communication log, and ACKO’s reply shows there too.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-2 text-sm font-medium text-pagination-text">
            Note
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What should ACKO know?"
              className="min-h-24"
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!note.trim()}
              className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover"
              onClick={sendNote}
            >
              Send note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadDocumentsDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        data={{
          title: story.request?.dialogTitle ?? 'Upload additional document',
          claimSummary: `Claim ID ${claim.id} | ${claim.customer}`,
        }}
        rows={uploadRows}
        onDocumentRequestedChange={() => undefined}
        onNotesChange={(rowId, value) =>
          setUploadRows((current) =>
            current.map((row) => (row.id === rowId ? { ...row, note: value } : row)),
          )
        }
        onUploadClick={(rowId) =>
          setUploadRows((current) =>
            current.map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    isUploaded: true,
                    filename: `${formatEnum(row.type)}.pdf`,
                    state: 'UPLOADED',
                  }
                : row,
            ),
          )
        }
        onDeleteClick={(rowId) =>
          setUploadRows((current) =>
            current.map((row) =>
              row.id === rowId
                ? { ...row, isUploaded: false, filename: undefined, state: 'REQUESTED' }
                : row,
            ),
          )
        }
        onAddDocument={() => undefined}
        onSubmit={() => {
          setSubmittedDocs(
            uploadRows
              .filter((row) => row.isUploaded)
              .map((row) => ({
                id: row.id,
                label: formatEnum(row.type),
                date: 'Today',
                note: row.note.trim() || 'Uploaded by the dealership.',
                status: 'Under evaluation' as const,
              })),
          );
          setRequestSent(true);
          setUploadOpen(false);
        }}
      />
    </div>
  );
}
