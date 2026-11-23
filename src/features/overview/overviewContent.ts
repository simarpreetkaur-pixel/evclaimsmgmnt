export type OverviewVariant = 'ops' | 'owner' | 'super';

export type ActionGroup = 'documents' | 'invoices' | 'queries';

export type ActionItem = {
  id: string;
  customer: string;
  badge: string;
  group: ActionGroup;
  vehicle: string;
  detail: string;
  /** Days left for the dealership to respond. Shown only at 3 or below. */
  daysLeft?: number;
  raisedOn: string;
  action: string;
  documentsTab: boolean;
};

export type ClaimBucket = 'waiting' | 'acko' | 'payment' | 'closed';

export type ClaimRow = {
  id: string;
  customer: string;
  vehicle: string;
  raised: string;
  status: string;
  actor: 'You' | 'ACKO';
  next: string;
  bucket: ClaimBucket;
};

export const UPLOAD_ACTIONS: ActionItem[] = [
  {
    id: 'CLM-10490',
    customer: 'Rahul Menon',
    badge: 'ACKO needs documents',
    group: 'documents',
    vehicle: 'Ather 450X · KA 03 AB 2190 · CLM-10490',
    detail: 'Uploaded the BMS log export. The photo of the screen cannot be read.',
    daysLeft: 2,
    raisedOn: '16 Nov',
    action: 'Upload document',
    documentsTab: true,
  },
  {
    id: 'CLM-10455',
    customer: 'Anita Rao',
    badge: 'Approved · invoice due',
    group: 'invoices',
    vehicle: 'Ather 450X · KA 05 CD 4412 · CLM-10455',
    detail: 'Battery replacement approved for ₹42,000. Upload the repair invoice so ACKO can pay.',
    daysLeft: 1,
    raisedOn: '9 Nov',
    action: 'Upload invoice',
    documentsTab: true,
  },
  {
    id: 'CLM-10476',
    customer: 'Sneha Reddy',
    badge: 'ACKO needs documents',
    group: 'documents',
    vehicle: 'Ather Rizta · TS 09 PQ 7781 · CLM-10476',
    detail: 'The job card photo is too dark. Upload a clearer photo.',
    daysLeft: 4,
    raisedOn: '15 Nov',
    action: 'Upload document',
    documentsTab: true,
  },
  {
    id: 'CLM-10481',
    customer: 'Karthik Rao',
    badge: 'ACKO needs documents',
    group: 'documents',
    vehicle: 'Ather Rizta Z · KA 51 EV 7781 · CLM-10481',
    detail: 'Uploaded the service history for the last 12 months.',
    daysLeft: 6,
    raisedOn: '14 Nov',
    action: 'Upload document',
    documentsTab: true,
  },
  {
    id: 'CLM-10466',
    customer: 'Divya Menon',
    badge: 'Approved · invoice due',
    group: 'invoices',
    vehicle: 'Ather 450X · KA 03 EV 9021 · CLM-10466',
    detail: 'Motor controller replacement approved for ₹28,000. Upload the repair invoice.',
    daysLeft: 3,
    raisedOn: '7 Nov',
    action: 'Upload invoice',
    documentsTab: true,
  },
];

export const QUERY_ACTIONS: ActionItem[] = [
  {
    id: 'CLM-10459',
    customer: 'Pooja Nair',
    badge: 'Not covered',
    group: 'queries',
    vehicle: 'Ather Rizta Z · KA 03 EV 1102 · CLM-10459',
    detail: 'Claimed ₹14,500. Not covered because the BMS log was not received.',
    raisedOn: '16 Nov',
    action: 'Raise a query',
    documentsTab: false,
  },
  {
    id: 'CLM-10422',
    customer: 'Vikram Shetty',
    badge: 'Not covered',
    group: 'queries',
    vehicle: 'Ather 450X · KA 02 EV 4401 · CLM-10422',
    detail: 'Claimed ₹18,000. Labour above the agreed rate card was not covered.',
    raisedOn: '12 Nov',
    action: 'Raise a query',
    documentsTab: false,
  },
  {
    id: 'CLM-10458',
    customer: 'Farah Khan',
    badge: 'Not covered',
    group: 'queries',
    vehicle: 'Ather 450 Apex · KA 02 EV 8802 · CLM-10458',
    detail: 'Claimed ₹40,000, approved ₹34,000. Cell replacement was covered, not the full battery.',
    raisedOn: '15 Nov',
    action: 'Raise a query',
    documentsTab: false,
  },
  {
    id: 'CLM-10388',
    customer: 'Arjun Das',
    badge: 'Query raised',
    group: 'queries',
    vehicle: 'Ather Rizta S · KA 05 EV 3399 · CLM-10388',
    detail: 'Claimed ₹31,000, approved ₹19,000. You asked ACKO to review the part price.',
    raisedOn: '18 Nov',
    action: 'View query',
    documentsTab: false,
  },
];

export const OPEN_CLAIMS: ClaimRow[] = [
  {
    id: 'CLM-10471',
    customer: 'Suresh Kumar',
    vehicle: 'Ather 450X · KA 02 EV 2201',
    raised: '19 Nov',
    status: 'With ACKO',
    actor: 'ACKO',
    next: 'Review the claim',
    bucket: 'acko',
  },
  {
    id: 'CLM-10484',
    customer: 'Imran Shaikh',
    vehicle: 'Ather 450 Apex · KA 04 EV 6512',
    raised: '18 Nov',
    status: 'With ACKO',
    actor: 'ACKO',
    next: 'Review the claim',
    bucket: 'acko',
  },
  {
    id: 'CLM-10483',
    customer: 'Ravi Teja',
    vehicle: 'Ather Rizta S · KA 05 EV 3399',
    raised: '17 Nov',
    status: 'Upload invoice',
    actor: 'You',
    next: 'Upload the repair invoice',
    bucket: 'waiting',
  },
  {
    id: 'CLM-10490',
    customer: 'Rahul Menon',
    vehicle: 'Ather 450X · KA 03 AB 2190',
    raised: '16 Nov',
    status: 'ACKO needs documents',
    actor: 'You',
    next: 'Upload BMS log',
    bucket: 'waiting',
  },
  {
    id: 'CLM-10476',
    customer: 'Sneha Reddy',
    vehicle: 'Ather Rizta · TS 09 PQ 7781',
    raised: '15 Nov',
    status: 'ACKO needs documents',
    actor: 'You',
    next: 'Upload job card photo',
    bucket: 'waiting',
  },
  {
    id: 'CLM-10481',
    customer: 'Karthik Rao',
    vehicle: 'Ather Rizta Z · KA 51 EV 7781',
    raised: '14 Nov',
    status: 'ACKO needs documents',
    actor: 'You',
    next: 'Upload service history',
    bucket: 'waiting',
  },
  {
    id: 'CLM-10468',
    customer: 'Lakshmi Narayan',
    vehicle: 'Ather 450 Apex · KA 01 EV 8820',
    raised: '13 Nov',
    status: 'With ACKO',
    actor: 'ACKO',
    next: 'Review the claim',
    bucket: 'acko',
  },
  {
    id: 'CLM-10461',
    customer: 'Neha Joshi',
    vehicle: 'Ather Rizta Z · KA 53 EV 1102',
    raised: '11 Nov',
    status: 'Invoice approved',
    actor: 'ACKO',
    next: 'Waiting for payment',
    bucket: 'acko',
  },
  {
    id: 'CLM-10455',
    customer: 'Anita Rao',
    vehicle: 'Ather 450X · KA 05 CD 4412',
    raised: '9 Nov',
    status: 'Approved · invoice due',
    actor: 'You',
    next: 'Upload invoice',
    bucket: 'waiting',
  },
  {
    id: 'CLM-10452',
    customer: 'Ananya Krishnan',
    vehicle: 'Ather 450X Gen 3 · KA 01 EV 1234',
    raised: '8 Nov',
    status: 'Waiting for payment',
    actor: 'ACKO',
    next: 'Pay the invoice',
    bucket: 'payment',
  },
  {
    id: 'CLM-10466',
    customer: 'Divya Menon',
    vehicle: 'Ather 450X · KA 03 EV 9021',
    raised: '7 Nov',
    status: 'Approved · invoice due',
    actor: 'You',
    next: 'Upload invoice',
    bucket: 'waiting',
  },
  {
    id: 'CLM-10448',
    customer: 'Kiran Rao',
    vehicle: 'Ather 450X · KA 05 EV 2208',
    raised: '6 Nov',
    status: 'With ACKO',
    actor: 'ACKO',
    next: 'Review the claim',
    bucket: 'acko',
  },
  {
    id: 'CLM-10431',
    customer: 'Meera Pillai',
    vehicle: 'Ather 450X · KA 03 EV 4411',
    raised: '4 Nov',
    status: 'Waiting for payment',
    actor: 'ACKO',
    next: 'Pay the invoice',
    bucket: 'payment',
  },
  {
    id: 'CLM-10440',
    customer: 'Aditi Shah',
    vehicle: 'Ather 450X · KA 03 EV 5521',
    raised: '3 Nov',
    status: 'Waiting for payment',
    actor: 'ACKO',
    next: 'Pay the invoice',
    bucket: 'payment',
  },
];

export const CLOSED_CLAIMS: ClaimRow[] = [
  {
    id: 'CLM-10412',
    customer: 'Neha Joshi',
    vehicle: 'Ather Rizta Z · KA 53 EV 2210',
    raised: '2 Nov',
    status: 'Paid',
    actor: 'ACKO',
    next: 'Paid on 2 Nov',
    bucket: 'closed',
  },
  {
    id: 'CLM-10418',
    customer: 'Harish Menon',
    vehicle: 'Ather 450X · KA 04 EV 1188',
    raised: '28 Oct',
    status: 'Not covered',
    actor: 'ACKO',
    next: 'Closed. The damage is outside the warranty.',
    bucket: 'closed',
  },
  {
    id: 'CLM-10405',
    customer: 'Leela Krishnan',
    vehicle: 'Ather Rizta · KA 03 EV 6640',
    raised: '20 Oct',
    status: 'Closed · reopenable',
    actor: 'You',
    next: 'Closed. The dealership can raise it again.',
    bucket: 'closed',
  },
];

export const CLAIM_BARS = [
  { label: 'Aug', value: 64, display: '64' },
  { label: 'Sep', value: 104, display: '104' },
  { label: 'Oct', value: 92, display: '92' },
  { label: 'Nov', value: 38, display: '38 so far', partial: true },
];

export const MONEY_BARS = [
  { label: 'Aug', value: 5.1, display: '₹5.1L' },
  { label: 'Sep', value: 7.2, display: '₹7.2L' },
  { label: 'Oct', value: 8.1, display: '₹8.1L' },
  { label: 'Nov', value: 4.6, display: '₹4.6L so far', partial: true },
];

export const APPROVAL_ROWS = [
  { month: 'Aug', rate: '81%', days: '14 days' },
  { month: 'Sep', rate: '84%', days: '12 days' },
  { month: 'Oct', rate: '85%', days: '10 days' },
  { month: 'Nov', rate: '87%', days: '9 days' },
];

export const REJECTION_REASONS = [
  { label: 'BMS log missing or unreadable', count: 2 },
  { label: 'Damage not covered', count: 1 },
  { label: 'Warranty expired', count: 1 },
];

export const TEAM_ROWS = [
  { name: 'Simarpreet', raised: 18, rate: '88%', reply: '1.2 days', waiting: '2 claims' },
  { name: 'Anika Shah', raised: 12, rate: '83%', reply: '2.8 days', waiting: '2 claims' },
  { name: 'Rohan Iyer', raised: 10, rate: '90%', reply: '1.5 days', waiting: '1 claim' },
];
