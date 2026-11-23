export type OwnerPeriod = 'this-week' | 'this-month' | 'last-month' | 'this-quarter' | 'custom';

export type WalletStatus = 'Credited' | 'Pending' | 'Debited';

export type OwnerSeriesPoint = {
  label: string;
  value: number;
};

export type OwnerOutcomePoint = {
  label: string;
  honoured: number;
  rejected: number;
};

export type OwnerClaimTypePoint = {
  label: string;
  battery: number;
  component: number;
};

export type OwnerTeamRow = {
  name: string;
  raised: number;
  honoured: number;
  rejected: number;
  waiting: number;
};

export type OwnerTransaction = {
  id: string;
  date: string;
  reference: string;
  amount: number;
  status: WalletStatus;
};

export type OwnerSnapshot = {
  raised: number;
  honoured: number;
  rejected: number;
  raisedDelta: number;
  comparisonLabel: string;
  credited: number;
  pending: number;
  raisedSeries: OwnerSeriesPoint[];
  claimTypeSeries: OwnerClaimTypePoint[];
  outcomeSeries: OwnerOutcomePoint[];
  team: OwnerTeamRow[];
  transactions: OwnerTransaction[];
};

export const OWNER_WALLET_BALANCE = 240000;
/** Still unpaid today. Older periods do not keep their own pending total. */
export const OWNER_PENDING_AMOUNT = 120000;
export const OWNER_UNDER_REVIEW = 24;

export const OWNER_PERIODS: { id: OwnerPeriod; label: string }[] = [
  { id: 'this-week', label: 'This week' },
  { id: 'this-month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: 'this-quarter', label: 'This quarter' },
  { id: 'custom', label: 'Custom' },
];

const THIS_MONTH_TEAM: OwnerTeamRow[] = [
  { name: 'Simarpreet', raised: 48, honoured: 36, rejected: 6, waiting: 4 },
  { name: 'Anika Shah', raised: 42, honoured: 32, rejected: 8, waiting: 3 },
  { name: 'Rohan Iyer', raised: 38, honoured: 28, rejected: 4, waiting: 5 },
];

const SNAPSHOTS: Record<Exclude<OwnerPeriod, 'custom'>, OwnerSnapshot> = {
  'this-week': {
    raised: 32,
    honoured: 22,
    rejected: 4,
    raisedDelta: 8,
    comparisonLabel: 'vs last week',
    credited: 180000,
    pending: 40000,
    raisedSeries: [
      { label: 'Mon', value: 4 },
      { label: 'Tue', value: 6 },
      { label: 'Wed', value: 5 },
      { label: 'Thu', value: 7 },
      { label: 'Fri', value: 4 },
      { label: 'Sat', value: 6 },
    ],
    claimTypeSeries: [
      { label: 'Mon', battery: 3, component: 1 },
      { label: 'Tue', battery: 4, component: 2 },
      { label: 'Wed', battery: 3, component: 2 },
      { label: 'Thu', battery: 5, component: 2 },
      { label: 'Fri', battery: 3, component: 1 },
      { label: 'Sat', battery: 4, component: 2 },
    ],
    outcomeSeries: [
      { label: 'Mon', honoured: 3, rejected: 1 },
      { label: 'Tue', honoured: 4, rejected: 0 },
      { label: 'Wed', honoured: 4, rejected: 1 },
      { label: 'Thu', honoured: 5, rejected: 1 },
      { label: 'Fri', honoured: 3, rejected: 0 },
      { label: 'Sat', honoured: 3, rejected: 1 },
    ],
    team: [
      { name: 'Simarpreet', raised: 12, honoured: 9, rejected: 1, waiting: 2 },
      { name: 'Anika Shah', raised: 11, honoured: 7, rejected: 2, waiting: 1 },
      { name: 'Rohan Iyer', raised: 9, honoured: 6, rejected: 1, waiting: 2 },
    ],
    transactions: [
      { id: 'w1', date: '19 Nov', reference: 'CLM-2026-0859', amount: 48000, status: 'Credited' },
      { id: 'w2', date: '18 Nov', reference: 'CLM-2026-0866', amount: 62400, status: 'Pending' },
    ],
  },
  'this-month': {
    raised: 128,
    honoured: 96,
    rejected: 18,
    raisedDelta: 12,
    comparisonLabel: 'vs last month',
    credited: 860000,
    pending: 120000,
    raisedSeries: [
      { label: 'Aug', value: 86 },
      { label: 'Sep', value: 104 },
      { label: 'Oct', value: 114 },
      { label: 'Nov', value: 128 },
    ],
    claimTypeSeries: [
      { label: 'Aug', battery: 64, component: 22 },
      { label: 'Sep', battery: 76, component: 28 },
      { label: 'Oct', battery: 80, component: 34 },
      { label: 'Nov', battery: 88, component: 40 },
    ],
    outcomeSeries: [
      { label: 'Aug', honoured: 62, rejected: 14 },
      { label: 'Sep', honoured: 74, rejected: 16 },
      { label: 'Oct', honoured: 80, rejected: 20 },
      { label: 'Nov', honoured: 96, rejected: 18 },
    ],
    team: THIS_MONTH_TEAM,
    transactions: [
      { id: 'm1', date: '18 Nov', reference: 'CLM-2026-0859', amount: 48000, status: 'Credited' },
      { id: 'm2', date: '16 Nov', reference: 'CLM-2026-0866', amount: 62400, status: 'Pending' },
      { id: 'm3', date: '12 Nov', reference: 'Battery collection', amount: -5000, status: 'Debited' },
      { id: 'm4', date: '8 Nov', reference: 'CLM-2026-0833', amount: 36200, status: 'Credited' },
      { id: 'm5', date: '2 Nov', reference: 'CLM-10455', amount: 54000, status: 'Pending' },
    ],
  },
  'last-month': {
    raised: 114,
    honoured: 80,
    rejected: 20,
    raisedDelta: -6,
    comparisonLabel: 'vs September',
    credited: 710000,
    pending: 90000,
    raisedSeries: [
      { label: 'Jul', value: 92 },
      { label: 'Aug', value: 86 },
      { label: 'Sep', value: 104 },
      { label: 'Oct', value: 114 },
    ],
    claimTypeSeries: [
      { label: 'Jul', battery: 70, component: 22 },
      { label: 'Aug', battery: 64, component: 22 },
      { label: 'Sep', battery: 76, component: 28 },
      { label: 'Oct', battery: 80, component: 34 },
    ],
    outcomeSeries: [
      { label: 'Jul', honoured: 68, rejected: 12 },
      { label: 'Aug', honoured: 62, rejected: 14 },
      { label: 'Sep', honoured: 74, rejected: 16 },
      { label: 'Oct', honoured: 80, rejected: 20 },
    ],
    team: [
      { name: 'Simarpreet', raised: 44, honoured: 32, rejected: 7, waiting: 3 },
      { name: 'Anika Shah', raised: 38, honoured: 26, rejected: 8, waiting: 2 },
      { name: 'Rohan Iyer', raised: 32, honoured: 22, rejected: 5, waiting: 4 },
    ],
    transactions: [
      { id: 'l1', date: '28 Oct', reference: 'CLM-2026-0819', amount: 41000, status: 'Credited' },
      { id: 'l2', date: '21 Oct', reference: 'Battery collection', amount: -5000, status: 'Debited' },
      { id: 'l3', date: '14 Oct', reference: 'CLM-2026-0812', amount: 27500, status: 'Credited' },
    ],
  },
  'this-quarter': {
    raised: 346,
    honoured: 250,
    rejected: 54,
    raisedDelta: 9,
    comparisonLabel: 'vs last quarter',
    credited: 2420000,
    pending: 120000,
    raisedSeries: [
      { label: 'Sep', value: 104 },
      { label: 'Oct', value: 114 },
      { label: 'Nov', value: 128 },
    ],
    claimTypeSeries: [
      { label: 'Sep', battery: 76, component: 28 },
      { label: 'Oct', battery: 80, component: 34 },
      { label: 'Nov', battery: 88, component: 40 },
    ],
    outcomeSeries: [
      { label: 'Sep', honoured: 74, rejected: 16 },
      { label: 'Oct', honoured: 80, rejected: 20 },
      { label: 'Nov', honoured: 96, rejected: 18 },
    ],
    team: [
      { name: 'Simarpreet', raised: 132, honoured: 98, rejected: 18, waiting: 4 },
      { name: 'Anika Shah', raised: 116, honoured: 82, rejected: 22, waiting: 3 },
      { name: 'Rohan Iyer', raised: 98, honoured: 70, rejected: 14, waiting: 5 },
    ],
    transactions: [
      { id: 'q1', date: '18 Nov', reference: 'CLM-2026-0859', amount: 48000, status: 'Credited' },
      { id: 'q2', date: '12 Nov', reference: 'Battery collection', amount: -5000, status: 'Debited' },
      { id: 'q3', date: '28 Oct', reference: 'CLM-2026-0819', amount: 41000, status: 'Credited' },
      { id: 'q4', date: '16 Sep', reference: 'CLM-2026-0833', amount: 33800, status: 'Credited' },
    ],
  },
};

export function honourRate(honoured: number, rejected: number): number {
  const decided = honoured + rejected;
  if (decided === 0) {
    return 0;
  }
  return Math.round((honoured / decided) * 100);
}

export function snapshotForPeriod(period: Exclude<OwnerPeriod, 'custom'>): OwnerSnapshot {
  return SNAPSHOTS[period];
}

export function snapshotForCustomRange(from: Date, to: Date): OwnerSnapshot {
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
  if (days <= 7) {
    return SNAPSHOTS['this-week'];
  }
  if (days <= 35) {
    return SNAPSHOTS['this-month'];
  }
  return SNAPSHOTS['this-quarter'];
}

export function formatInrCompact(amount: number): string {
  const absolute = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  if (absolute >= 100000) {
    const lakhs = absolute / 100000;
    const text = Number.isInteger(lakhs) ? String(lakhs) : lakhs.toFixed(1).replace(/\.0$/, '');
    return `${sign}₹${text}L`;
  }
  return `${sign}₹${absolute.toLocaleString('en-IN')}`;
}

export function formatInr(amount: number): string {
  const sign = amount < 0 ? '−' : '+';
  return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`;
}
