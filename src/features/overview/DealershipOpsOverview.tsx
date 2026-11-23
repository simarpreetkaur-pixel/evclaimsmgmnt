'use client';

import { PersonaOverview } from '@/features/overview/PersonaOverview';

export type ClaimStatus =
  | 'In review with ACKO'
  | 'With ACKO'
  | 'ACKO needs documents'
  | 'Documents requested'
  | 'Approved · invoice due'
  | 'Upload invoice'
  | 'Invoice due'
  | 'Invoice approved'
  | 'Waiting for payment'
  | 'Paid'
  | 'Payment pending'
  | 'Payment on the way'
  | 'Payment overdue'
  | 'Not covered'
  | 'Not approved'
  | 'Partly approved'
  | 'Query raised'
  | 'Rejected'
  | 'Closed'
  | 'Closed · reopenable';

export type ClaimFilter =
  | 'all'
  | 'in-review'
  | 'documents'
  | 'invoice-due'
  | 'payment-pending'
  | 'paid'
  | 'rejected'
  | 'closed';

export type OngoingClaim = {
  id: string;
  customer: string;
  vehicle: string;
  registration: string;
  raisedOn: string;
  status: ClaimStatus;
  filter: Exclude<ClaimFilter, 'all'>;
};

export const ONGOING_CLAIMS: OngoingClaim[] = [
  {
    id: 'CLM-2026-0812',
    customer: 'Meera Pillai',
    vehicle: 'Ather 450X',
    registration: 'KA 02 EV 4410',
    raisedOn: '26 Sep',
    status: 'Documents requested',
    filter: 'documents',
  },
  {
    id: 'CLM-2026-0819',
    customer: 'Karthik Rao',
    vehicle: 'Ather Rizta Z',
    registration: 'KA 51 EV 7781',
    raisedOn: '7 Oct',
    status: 'Documents requested',
    filter: 'documents',
  },
  {
    id: 'CLM-2026-0866',
    customer: 'Divya Menon',
    vehicle: 'Ather 450X',
    registration: 'KA 03 EV 9021',
    raisedOn: '14 Oct',
    status: 'Invoice due',
    filter: 'invoice-due',
  },
  {
    id: 'CLM-2026-0862',
    customer: 'Ananya Krishnan',
    vehicle: 'Ather 450X Gen 3',
    registration: 'KA 01 EV 1234',
    raisedOn: '29 Sep',
    status: 'Payment pending',
    filter: 'payment-pending',
  },
  {
    id: 'CLM-2026-0871',
    customer: 'Suresh Kumar',
    vehicle: 'Ather Rizta S',
    registration: 'KA 05 EV 3399',
    raisedOn: '19 Oct',
    status: 'In review with ACKO',
    filter: 'in-review',
  },
  {
    id: 'CLM-2026-0859',
    customer: 'Lakshmi Narayan',
    vehicle: 'Ather 450 Apex',
    registration: 'KA 01 EV 8820',
    raisedOn: '22 Sep',
    status: 'Paid',
    filter: 'paid',
  },
  {
    id: 'CLM-2026-0851',
    customer: 'Imran Shaikh',
    vehicle: 'Ather 450X',
    registration: 'KA 04 EV 6612',
    raisedOn: '18 Sep',
    status: 'Rejected',
    filter: 'rejected',
  },
  {
    id: 'CLM-2026-0833',
    customer: 'Neha Joshi',
    vehicle: 'Ather Rizta Z',
    registration: 'KA 53 EV 1102',
    raisedOn: '2 Sep',
    status: 'Closed',
    filter: 'closed',
  },
];

export const STATUS_CLASS: Record<ClaimStatus, string> = {
  'ACKO needs documents':
    'border-endorse-policy-badge-error-border bg-endorse-policy-badge-error-bg text-endorse-policy-badge-error-text',
  'Documents requested':
    'border-endorse-policy-badge-error-border bg-endorse-policy-badge-error-bg text-endorse-policy-badge-error-text',
  'Approved · invoice due':
    'border-endorse-policy-badge-warning-border bg-endorse-policy-badge-warning-bg text-endorse-policy-badge-warning-text',
  'Upload invoice':
    'border-endorse-policy-badge-warning-border bg-endorse-policy-badge-warning-bg text-endorse-policy-badge-warning-text',
  'Invoice due':
    'border-endorse-policy-badge-warning-border bg-endorse-policy-badge-warning-bg text-endorse-policy-badge-warning-text',
  'Invoice approved': 'border-transparent bg-create-claim-button/10 text-create-claim-button',
  'Waiting for payment': 'border-transparent bg-create-claim-button/10 text-create-claim-button',
  'Not covered':
    'border-endorse-policy-badge-error-border bg-endorse-policy-badge-error-bg text-endorse-policy-badge-error-text',
  'Closed · reopenable':
    'border-endorse-policy-badge-success-border bg-endorse-policy-badge-success-bg text-endorse-policy-badge-success-text',
  'Payment pending':
    'border-endorse-policy-badge-warning-border bg-endorse-policy-badge-warning-bg text-endorse-policy-badge-warning-text',
  'In review with ACKO': 'border-transparent bg-secondary text-pagination-text',
  'With ACKO': 'border-transparent bg-secondary text-pagination-text',
  'Payment on the way': 'border-transparent bg-create-claim-button/10 text-create-claim-button',
  'Payment overdue':
    'border-endorse-policy-badge-error-border bg-endorse-policy-badge-error-bg text-endorse-policy-badge-error-text',
  'Not approved': 'border-transparent bg-secondary text-pagination-text',
  'Partly approved':
    'border-endorse-policy-badge-warning-border bg-endorse-policy-badge-warning-bg text-endorse-policy-badge-warning-text',
  'Query raised': 'border-transparent bg-create-claim-button/10 text-create-claim-button',
  Paid: 'border-endorse-policy-badge-success-border bg-endorse-policy-badge-success-bg text-endorse-policy-badge-success-text',
  Rejected:
    'border-endorse-policy-badge-error-border bg-endorse-policy-badge-error-bg text-endorse-policy-badge-error-text',
  Closed: 'border-transparent bg-secondary text-pagination-text',
};

export const CLAIM_FILTERS: { id: ClaimFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in-review', label: 'In review with ACKO' },
  { id: 'documents', label: 'Documents requested' },
  { id: 'invoice-due', label: 'Invoice due' },
  { id: 'payment-pending', label: 'Payment pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'closed', label: 'Closed' },
];

export function DealershipOpsOverview() {
  return <PersonaOverview variant="ops" />;
}
