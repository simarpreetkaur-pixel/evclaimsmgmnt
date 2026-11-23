'use client';

import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  applySystemEvent,
  changeApdBasis,
  createSnapshot,
  selectView,
  type AccessUser,
  type Capability,
  type Command,
  type Role,
  type Scenario,
  type Snapshot,
  type SystemEvent,
  type Topology,
} from './domain';
import { simulatorGateway, type FinanceGateway } from './gateway';

export type ApproachMode =
  | 'approach-1'
  | 'approach-2'
  | 'approach-3'
  | 'engineering-ready'
  | 'engineering-ready-v2'
  | 'engineering-ready-v3'
  | 'engineering-ready-v3.1';

export type WgGraceStatus = 'healthy' | 'low-float' | 'grace-active' | 'grace-expired';

export interface PartnerWgDirectoryItem {
  wgId: string;
  wgName: string;
  brands: string[];
  sector: string;
  topologyKey: Topology;
  activeUsersCount: number;
  vansCount: number;
  plansCount: number;
  activePoliciesCount: number;
  wgPoolBalanceRupees: number;
  minRequiredRupees: number;
  graceStatus: WgGraceStatus;
  graceDaysLeft: number;
  vans: { id: string; label: string; masked: string; balanceRupees: number }[];
  plans: { id: string; name: string; brand: string; policiesCount: number; gwpRupees: number }[];
}

export type WgPoolPresetId =
  | 'wireframe-low-200k'
  | 'positive-wg-80k'
  | 'negative-wg-blocks-positive-van'
  | 'deposit-van-plus-issuance-vans';

export type VanPurpose = 'both' | 'deposit-only' | 'issuance-only';

export interface WgMinThresholdConfig {
  mode: 'fixed' | 'gwp-percentage';
  fixedAmountRupees: number;
  gwpPercentage: number;
  monthlyGwpRunRateRupees: number;
  updatedBy: string;
  updatedAt: string;
}

export const WG_POOL_PRESETS: Record<
  WgPoolPresetId,
  {
    id: WgPoolPresetId;
    badge: string;
    title: string;
    description: string;
    vanContributionsRupees: Record<string, number>;
    vanPurposes: Record<string, VanPurpose>;
  }
> = {
  'wireframe-low-200k': {
    id: 'wireframe-low-200k',
    badge: 'Preset 1 · Wireframe Default (₹2,00,234 Low)',
    title: 'WG Pool ₹2,00,234 (Low) · VAN 1 (+₹1.20L), VAN 2 (+₹1.80L), VAN 3 (-₹1.00L)',
    description:
      'Matches the separated WG Pool Balance wireframe (₹2,00,234 Low). Overall WG Pool is above the minimum threshold so policy issuance stays Active, even for VAN 3 (-₹1,00,000 drawdown).',
    vanContributionsRupees: {
      'VAN-1': 120234,
      'VAN-2': 180000,
      'VAN-3': -100000,
      'VAN-4': 0,
    },
    vanPurposes: {
      'VAN-1': 'both',
      'VAN-2': 'both',
      'VAN-3': 'issuance-only',
      'VAN-4': 'both',
    },
  },
  'positive-wg-80k': {
    id: 'positive-wg-80k',
    badge: 'Preset 2 · WG +₹80k (VAN 1: +100k, VAN 2: +80k, VAN 3: -100k)',
    title: 'WG Pool +₹80,000 · VAN 1 (+₹1,00,000) + VAN 2 (+₹80,000) + VAN 3 (-₹1,00,000)',
    description:
      'Exact prompt scenario: VAN 1 (+1,00,000), VAN 2 (+80,000), and VAN 3 (-1,00,000) sum to +₹80,000 WG Pool. With a 15% Monthly GWP Run-rate threshold (₹99,746), WG Pool (+₹80,000) falls below the minimum requirement and pauses issuance; with a ₹50,000 fixed threshold, issuance remains Active.',
    vanContributionsRupees: {
      'VAN-1': 100000,
      'VAN-2': 80000,
      'VAN-3': -100000,
      'VAN-4': 0,
    },
    vanPurposes: {
      'VAN-1': 'both',
      'VAN-2': 'both',
      'VAN-3': 'issuance-only',
      'VAN-4': 'both',
    },
  },
  'negative-wg-blocks-positive-van': {
    id: 'negative-wg-blocks-positive-van',
    badge: 'Preset 3 · Negative WG (-₹1L) Blocks Positive VAN 1 (+₹2L)',
    title: 'WG Pool -₹1,00,000 · VAN 1 (+₹2,00,000) & VAN 2 (-₹3,00,000) → Issuance Blocked',
    description:
      'Exact prompt scenario: Overall WG balance is -₹1,00,000 (contributed by VAN 1 at +₹2,00,000 and VAN 2 at -₹3,00,000). Even when viewing VAN 1 (+₹2,00,000), policy issuance is blocked because solvency is enforced at the Wallet Group level.',
    vanContributionsRupees: {
      'VAN-1': 200000,
      'VAN-2': -300000,
      'VAN-3': 0,
      'VAN-4': 0,
    },
    vanPurposes: {
      'VAN-1': 'both',
      'VAN-2': 'issuance-only',
      'VAN-3': 'both',
      'VAN-4': 'both',
    },
  },
  'deposit-van-plus-issuance-vans': {
    id: 'deposit-van-plus-issuance-vans',
    badge: 'Preset 4 · 1 Deposit VAN (+₹5L) + 2 Issuance VANs (-₹3L)',
    title: 'WG Pool +₹2,00,000 · VAN 1 Deposit Hub (+₹5L) Funding VAN 2 (-₹1.8L) & VAN 3 (-₹1.2L)',
    description:
      'Common partner practice: VAN 1 is used exclusively for treasury deposits (+₹5,00,000) while VAN 2 (-₹1,80,000) and VAN 3 (-₹1,20,000) are used for policy issuance. Contextual banners explain that negative balances on VAN 2 & VAN 3 are expected drawdowns from the central WG Pool.',
    vanContributionsRupees: {
      'VAN-1': 500000,
      'VAN-2': -180000,
      'VAN-3': -120000,
      'VAN-4': 0,
    },
    vanPurposes: {
      'VAN-1': 'deposit-only',
      'VAN-2': 'issuance-only',
      'VAN-3': 'issuance-only',
      'VAN-4': 'both',
    },
  },
};

export type SuggestedScenarioId =
  | 'S1-wg-full'
  | 'S2-van-a-shared'
  | 'S3-plan-a1-masked-coplan'
  | 'S4-single-van-b-c'
  | 'S5-ops-only-plans'
  | 'S6-finance-only-vans'
  | 'S7-district-viewer';

export type ModuleId =
  | 'overview'
  | 'policies'
  | 'claims'
  | 'financials'
  | 'manual-refunds'
  | 'reports'
  | 'settings';

export type AccessLevel = 'none' | 'view' | 'edit';

export interface PartnerRoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystemTemplate?: boolean;
  userCount: number;
  permissions: Record<ModuleId, AccessLevel>;
  /** Nested show/hide controls per module sub-section / metric (key: `${moduleId}:${subId}`, default true = Show) */
  subPermissions?: Record<string, boolean>;
  updatedAt: string;
}

export interface V31ModuleSubItem {
  id: string;
  label: string;
  category: 'Metric' | 'Chart' | 'Feature';
}

export const V31_MODULE_SUBSECTIONS: Record<ModuleId, V31ModuleSubItem[]> = {
  overview: [
    { id: 'FLOAT_BALANCE', label: 'APD Balance & account breakdown', category: 'Metric' },
    { id: 'TOTAL_POLICIES_ISSUED', label: 'Total policies issued', category: 'Metric' },
    { id: 'GROSS_WRITTEN_PREMIUM', label: 'Gross written premium', category: 'Metric' },
    { id: 'AVERAGE_PREMIUM', label: 'Avg premium amount', category: 'Metric' },
    { id: 'AVERAGE_SI', label: 'Avg sum insured value', category: 'Metric' },
    { id: 'CLAIM_SETTLEMENT_RATIO', label: 'Claims settlement ratio', category: 'Metric' },
    { id: 'GWP_POLICY_COUNT_TREND', label: 'GWP & Policy Count Trend', category: 'Chart' },
    { id: 'CLAIMS_TREND_BY_STATUS', label: 'Claims trend (GPA)', category: 'Chart' },
    { id: 'AVG_PREMIUM_TREND', label: 'Avg premium trend', category: 'Chart' },
    {
      id: 'GEO_DISTRIBUTION_POLICIES',
      label: 'Geographical distribution of policies',
      category: 'Chart',
    },
    {
      id: 'GEO_DISTRIBUTION_CLAIMS',
      label: 'Geographical distribution of claims',
      category: 'Chart',
    },
    {
      id: 'AVERAGE_SI_TREND',
      label: 'Monthly average sum insured trend',
      category: 'Chart',
    },
    {
      id: 'POLICIES_BY_TENURE_DISTRIBUTION',
      label: 'Policies by tenure distribution',
      category: 'Chart',
    },
  ],
  policies: [
    { id: 'POLICY_KPI_TOTAL', label: 'Total policies issued', category: 'Metric' },
    { id: 'POLICY_KPI_CANCELLED', label: 'Cancelled policies', category: 'Metric' },
    { id: 'POLICY_KPI_GWP', label: 'Gross written premium', category: 'Metric' },
    { id: 'POLICY_TABLE_EXPORT', label: 'Policy list & endorsement actions', category: 'Feature' },
  ],
  claims: [
    { id: 'CLAIMS_KPI_TOTAL', label: 'Total claims & status breakdown', category: 'Metric' },
    { id: 'CLAIMS_KPI_PAID', label: 'Claim amount paid', category: 'Metric' },
    { id: 'CLAIMS_KPI_RATIO', label: 'Claims settlement ratio', category: 'Metric' },
    {
      id: 'CLAIMS_INTIMATION',
      label: 'Claim intimation & document upload',
      category: 'Feature',
    },
  ],
  financials: [
    { id: 'FIN_APD_BALANCE_BAR', label: 'APD Balance & VAN pool breakdown', category: 'Metric' },
    {
      id: 'FIN_AVAILABLE_KPIS',
      label: 'Available balance & ledger KPI cards',
      category: 'Metric',
    },
    { id: 'FIN_CD_LEDGER_TABLE', label: 'CD transaction ledger & filters', category: 'Feature' },
    {
      id: 'FIN_DEPOSIT_ACTIONS',
      label: 'Deposit top-up & statement download',
      category: 'Feature',
    },
  ],
  'manual-refunds': [
    {
      id: 'REFUND_FAILED_QUEUE',
      label: 'Failed refund queue & beneficiary update',
      category: 'Feature',
    },
    { id: 'REFUND_BULK_UPLOAD', label: 'Bulk refund upload', category: 'Feature' },
  ],
  reports: [
    {
      id: 'REPORTS_MONTHLY_CD_GST',
      label: 'Monthly CD & GST statements',
      category: 'Feature',
    },
    { id: 'REPORTS_CUSTOM_EXPORT', label: 'Custom report exports', category: 'Feature' },
  ],
  settings: [
    { id: 'SETTINGS_TEAM_MEMBERS', label: 'Team members & access grants', category: 'Feature' },
    { id: 'SETTINGS_ROLES', label: 'Roles & module permissions', category: 'Feature' },
  ],
};

export interface V31VanCatalogItem {
  id: string;
  vanNumber: string;
  masked: string;
  partner: string;
  balanceRupees: number;
}

export const V31_VAN_CATALOG: V31VanCatalogItem[] = [
  {
    id: 'VAN-1',
    vanNumber: '9010410001041',
    masked: '•••• 1041',
    partner: 'Zomato',
    balanceRupees: 120234,
  },
  {
    id: 'VAN-2',
    vanNumber: '9010410001042',
    masked: '•••• 1042',
    partner: 'Blinkit',
    balanceRupees: 180000,
  },
  {
    id: 'VAN-3',
    vanNumber: '9010410001043',
    masked: '•••• 1043',
    partner: 'District',
    balanceRupees: -100000,
  },
  {
    id: 'VAN-4',
    vanNumber: '9010410001044',
    masked: '•••• 1044',
    partner: 'Hyperpure',
    balanceRupees: 0,
  },
  {
    id: 'VAN-5',
    vanNumber: '9010410001045',
    masked: '•••• 1045',
    partner: 'Zomato',
    balanceRupees: 85000,
  },
  {
    id: 'VAN-6',
    vanNumber: '9010410001046',
    masked: '•••• 1046',
    partner: 'Zomato',
    balanceRupees: 64000,
  },
  {
    id: 'VAN-7',
    vanNumber: '9010410001047',
    masked: '•••• 1047',
    partner: 'Blinkit',
    balanceRupees: 112000,
  },
  {
    id: 'VAN-8',
    vanNumber: '9010410001048',
    masked: '•••• 1048',
    partner: 'Blinkit',
    balanceRupees: 45000,
  },
  {
    id: 'VAN-9',
    vanNumber: '9010410001049',
    masked: '•••• 1049',
    partner: 'District',
    balanceRupees: 92000,
  },
  {
    id: 'VAN-10',
    vanNumber: '9010410001050',
    masked: '•••• 1050',
    partner: 'District',
    balanceRupees: 38000,
  },
  {
    id: 'VAN-11',
    vanNumber: '9010410001051',
    masked: '•••• 1051',
    partner: 'Hyperpure',
    balanceRupees: 74000,
  },
  {
    id: 'VAN-12',
    vanNumber: '9010410001052',
    masked: '•••• 1052',
    partner: 'Hyperpure',
    balanceRupees: 51000,
  },
];

export function formatVanNumberV31(vanId: string): string {
  const found = V31_VAN_CATALOG.find((v) => v.id === vanId || v.vanNumber === vanId);
  return found ? found.vanNumber : vanId;
}

export interface V31PlanCatalogItem {
  id: string;
  name: string;
  partner: string;
  vanId: string;
  policiesIssued: number;
  gwpRupees: number;
  avgSumInsuredRupees: number;
  claimsRatio: number;
}

export const V31_PLAN_CATALOG: V31PlanCatalogItem[] = [
  // Zomato (7 plans)
  {
    id: 'gig-1',
    name: 'Zomato Gig Plan 1',
    partner: 'Zomato',
    vanId: 'VAN-1',
    policiesIssued: 142,
    gwpRupees: 120322,
    avgSumInsuredRupees: 2003,
    claimsRatio: 1.2,
  },
  {
    id: 'gig-2',
    name: 'Zomato Gig Plan 2',
    partner: 'Zomato',
    vanId: 'VAN-1',
    policiesIssued: 98,
    gwpRupees: 84500,
    avgSumInsuredRupees: 1850,
    claimsRatio: 0.9,
  },
  {
    id: 'zom-3',
    name: 'Zomato Rider GPA Plus',
    partner: 'Zomato',
    vanId: 'VAN-5',
    policiesIssued: 164,
    gwpRupees: 148200,
    avgSumInsuredRupees: 2500,
    claimsRatio: 1.1,
  },
  {
    id: 'zom-4',
    name: 'Zomato Fleet Shield',
    partner: 'Zomato',
    vanId: 'VAN-5',
    policiesIssued: 112,
    gwpRupees: 96400,
    avgSumInsuredRupees: 2200,
    claimsRatio: 1.0,
  },
  {
    id: 'zom-5',
    name: 'Zomato EV Battery Protect',
    partner: 'Zomato',
    vanId: 'VAN-6',
    policiesIssued: 76,
    gwpRupees: 68900,
    avgSumInsuredRupees: 3100,
    claimsRatio: 0.8,
  },
  {
    id: 'zom-6',
    name: 'Zomato Merchant Fire & Burglary',
    partner: 'Zomato',
    vanId: 'VAN-6',
    policiesIssued: 54,
    gwpRupees: 82100,
    avgSumInsuredRupees: 5000,
    claimsRatio: 0.7,
  },
  {
    id: 'zom-7',
    name: 'Zomato Dining Out Liability',
    partner: 'Zomato',
    vanId: 'VAN-6',
    policiesIssued: 48,
    gwpRupees: 43200,
    avgSumInsuredRupees: 2800,
    claimsRatio: 0.9,
  },
  // Blinkit (6 plans)
  {
    id: 'blinkit-3',
    name: 'Blinkit Plan 3',
    partner: 'Blinkit',
    vanId: 'VAN-2',
    policiesIssued: 215,
    gwpRupees: 198400,
    avgSumInsuredRupees: 3500,
    claimsRatio: 1.4,
  },
  {
    id: 'blk-2',
    name: 'Blinkit Picker Accident Cover',
    partner: 'Blinkit',
    vanId: 'VAN-2',
    policiesIssued: 180,
    gwpRupees: 162000,
    avgSumInsuredRupees: 3000,
    claimsRatio: 1.2,
  },
  {
    id: 'blk-3',
    name: 'Blinkit Darkstore Property',
    partner: 'Blinkit',
    vanId: 'VAN-7',
    policiesIssued: 94,
    gwpRupees: 141000,
    avgSumInsuredRupees: 4800,
    claimsRatio: 1.0,
  },
  {
    id: 'blk-4',
    name: 'Blinkit Cold-Chain Transit',
    partner: 'Blinkit',
    vanId: 'VAN-7',
    policiesIssued: 68,
    gwpRupees: 74800,
    avgSumInsuredRupees: 3600,
    claimsRatio: 0.9,
  },
  {
    id: 'blk-5',
    name: 'Blinkit Rider Health Pro',
    partner: 'Blinkit',
    vanId: 'VAN-8',
    policiesIssued: 152,
    gwpRupees: 136800,
    avgSumInsuredRupees: 2900,
    claimsRatio: 1.3,
  },
  {
    id: 'blk-6',
    name: 'Blinkit Last-Mile Third Party',
    partner: 'Blinkit',
    vanId: 'VAN-8',
    policiesIssued: 88,
    gwpRupees: 79200,
    avgSumInsuredRupees: 2600,
    claimsRatio: 1.1,
  },
  // District (6 plans)
  {
    id: 'district-4',
    name: 'District Plan 4',
    partner: 'District',
    vanId: 'VAN-3',
    policiesIssued: 64,
    gwpRupees: 96800,
    avgSumInsuredRupees: 4800,
    claimsRatio: 0.8,
  },
  {
    id: 'dst-2',
    name: 'District Concert Cancellation',
    partner: 'District',
    vanId: 'VAN-3',
    policiesIssued: 92,
    gwpRupees: 138000,
    avgSumInsuredRupees: 5200,
    claimsRatio: 0.7,
  },
  {
    id: 'dst-3',
    name: 'District Ticketing Refund Cover',
    partner: 'District',
    vanId: 'VAN-9',
    policiesIssued: 310,
    gwpRupees: 186000,
    avgSumInsuredRupees: 1900,
    claimsRatio: 1.1,
  },
  {
    id: 'dst-4',
    name: 'District Venue Public Liability',
    partner: 'District',
    vanId: 'VAN-9',
    policiesIssued: 45,
    gwpRupees: 94500,
    avgSumInsuredRupees: 6500,
    claimsRatio: 0.6,
  },
  {
    id: 'dst-5',
    name: 'District Sports Pass Protect',
    partner: 'District',
    vanId: 'VAN-10',
    policiesIssued: 128,
    gwpRupees: 89600,
    avgSumInsuredRupees: 2400,
    claimsRatio: 0.9,
  },
  {
    id: 'dst-6',
    name: 'District Artist Tour Shield',
    partner: 'District',
    vanId: 'VAN-10',
    policiesIssued: 36,
    gwpRupees: 72000,
    avgSumInsuredRupees: 6000,
    claimsRatio: 0.5,
  },
  // Hyperpure (5 plans)
  {
    id: 'hyperpure-5',
    name: 'Hyperpure Plan 5',
    partner: 'Hyperpure',
    vanId: 'VAN-4',
    policiesIssued: 41,
    gwpRupees: 52900,
    avgSumInsuredRupees: 6200,
    claimsRatio: 0.6,
  },
  {
    id: 'hyp-2',
    name: 'Hyperpure Cold Storage Cover',
    partner: 'Hyperpure',
    vanId: 'VAN-4',
    policiesIssued: 58,
    gwpRupees: 87000,
    avgSumInsuredRupees: 5800,
    claimsRatio: 0.7,
  },
  {
    id: 'hyp-3',
    name: 'Hyperpure B2B Credit Shield',
    partner: 'Hyperpure',
    vanId: 'VAN-11',
    policiesIssued: 74,
    gwpRupees: 111000,
    avgSumInsuredRupees: 7200,
    claimsRatio: 0.8,
  },
  {
    id: 'hyp-4',
    name: 'Hyperpure Logistics Fleet',
    partner: 'Hyperpure',
    vanId: 'VAN-11',
    policiesIssued: 63,
    gwpRupees: 75600,
    avgSumInsuredRupees: 4500,
    claimsRatio: 0.9,
  },
  {
    id: 'hyp-5',
    name: 'Hyperpure Vendor Transit',
    partner: 'Hyperpure',
    vanId: 'VAN-12',
    policiesIssued: 49,
    gwpRupees: 58800,
    avgSumInsuredRupees: 4100,
    claimsRatio: 0.7,
  },
];

export interface AccessRequestItem {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  currentRoleName: string;
  requestedModules: { module: ModuleId; level: 'view' | 'edit' }[];
  requestedVanIds: string[];
  requestedPlanIds: string[];
  reason: string;
  triggerContext: string;
  status: 'pending' | 'approved' | 'modified' | 'rejected';
  createdAt: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export type NotificationCategory = 'alerts' | 'tasks' | 'mentions' | 'approvals';

export interface ContextualNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  unread: boolean;
  vanId?: string;
  planId?: string;
  requestId?: string;
  uploadState?: 'uploading' | 'success' | 'failed' | 'partial';
  actionLabel?: string;
  actionRoute?: string;
}

export type BulkToastState = null | {
  kind: 'uploading' | 'success' | 'failed' | 'partial';
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
};

const DEFAULT_VAN_ALIASES: Record<string, string> = {
  'VAN-1': 'Zomato Gig Float',
  'VAN-2': 'Blinkit Darkstore Float',
  'VAN-3': 'District Events Float',
  'VAN-4': 'Hyperpure B2B Float',
};

export const INITIAL_PARTNER_ROLES: PartnerRoleDefinition[] = [
  {
    id: 'role-super-admin',
    name: 'Partner Super Admin',
    description: 'Full view & edit access across all operational, financial, and UAM modules.',
    isSystemTemplate: true,
    userCount: 1,
    permissions: {
      overview: 'edit',
      policies: 'edit',
      claims: 'edit',
      financials: 'edit',
      'manual-refunds': 'edit',
      reports: 'edit',
      settings: 'edit',
    },
    updatedAt: '01 Nov 2026',
  },
  {
    id: 'role-entity-subadmin',
    name: 'Entity Sub-Admin (Finance & Ops)',
    description:
      'Delegated admin for assigned VANs & Plans with full operational and financial access.',
    isSystemTemplate: true,
    userCount: 1,
    permissions: {
      overview: 'edit',
      policies: 'edit',
      claims: 'edit',
      financials: 'edit',
      'manual-refunds': 'edit',
      reports: 'edit',
      settings: 'edit',
    },
    updatedAt: '01 Nov 2026',
  },
  {
    id: 'role-operations',
    name: 'Operations (Policies & Claims)',
    description:
      'View & edit access for Overview, Policy Management, and Claims only. No access to Financials, Reports, or Settings.',
    isSystemTemplate: false,
    userCount: 2,
    permissions: {
      overview: 'edit',
      policies: 'edit',
      claims: 'edit',
      financials: 'none',
      'manual-refunds': 'none',
      reports: 'none',
      settings: 'none',
    },
    updatedAt: '01 Nov 2026',
  },
  {
    id: 'role-claims-finance',
    name: 'Claims & Finance Hybrid',
    description:
      'Operates on Claims & Manual Refunds with View & Dispute access on Financials (Travel / Credit partner persona).',
    isSystemTemplate: false,
    userCount: 1,
    permissions: {
      overview: 'view',
      policies: 'view',
      claims: 'edit',
      financials: 'edit',
      'manual-refunds': 'edit',
      reports: 'view',
      settings: 'none',
    },
    updatedAt: '01 Nov 2026',
  },
  {
    id: 'role-finance-policy-edit',
    name: 'Finance & Policy Controller',
    description:
      'Primary finance role with full CD Ledger control plus read/edit access to Policies, Claims, and Reports.',
    isSystemTemplate: false,
    userCount: 1,
    permissions: {
      overview: 'view',
      policies: 'edit',
      claims: 'view',
      financials: 'edit',
      'manual-refunds': 'edit',
      reports: 'edit',
      settings: 'none',
    },
    updatedAt: '01 Nov 2026',
  },
  {
    id: 'role-viewer',
    name: 'Read-Only Plan & Finance Viewer',
    description:
      'View-only access to assigned VANs and Plans on Overview, Policies, and Financials.',
    isSystemTemplate: false,
    userCount: 1,
    permissions: {
      overview: 'view',
      policies: 'view',
      claims: 'view',
      financials: 'view',
      'manual-refunds': 'none',
      reports: 'view',
      settings: 'none',
    },
    updatedAt: '01 Nov 2026',
  },
];

/**
 * Engineering Ready Version 3.0: Streamlined 3 Predefined Roles
 * 1. Super Admin
 * 2. Operations User
 * 3. Finance User
 * (Each can be customized via Configure Matrix, and new custom roles can be added.)
 */
export const V3_INITIAL_PARTNER_ROLES: PartnerRoleDefinition[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Full view and edit access across all modules and settings.',
    isSystemTemplate: true,
    userCount: 2,
    permissions: {
      overview: 'edit',
      policies: 'edit',
      claims: 'edit',
      financials: 'edit',
      'manual-refunds': 'edit',
      reports: 'edit',
      settings: 'edit',
    },
    updatedAt: '04 Nov 2026',
  },
  {
    id: 'role-operations',
    name: 'Operations User',
    description: 'Access to overview, policies, and claims for assigned plans.',
    isSystemTemplate: true,
    userCount: 2,
    permissions: {
      overview: 'edit',
      policies: 'edit',
      claims: 'edit',
      financials: 'none',
      'manual-refunds': 'edit',
      reports: 'none',
      settings: 'none',
    },
    updatedAt: '04 Nov 2026',
  },
  {
    id: 'role-finance',
    name: 'Finance User',
    description: 'Access to financials, refunds, and statements for assigned accounts.',
    isSystemTemplate: true,
    userCount: 2,
    permissions: {
      overview: 'view',
      policies: 'none',
      claims: 'none',
      financials: 'edit',
      'manual-refunds': 'edit',
      reports: 'edit',
      settings: 'none',
    },
    updatedAt: '04 Nov 2026',
  },
];

const SEED_PARTNER_WGS: Omit<PartnerWgDirectoryItem, 'wgId'>[] = [
  {
    wgName: 'Eternal',
    brands: ['Zomato', 'Blinkit', 'District', 'Hyperpure'],
    sector: 'Food, Quick Commerce & Events',
    topologyKey: 'eternal',
    activeUsersCount: 18,
    vansCount: 4,
    plansCount: 5,
    activePoliciesCount: 560,
    wgPoolBalanceRupees: 200234,
    minRequiredRupees: 99746,
    graceStatus: 'low-float',
    graceDaysLeft: 10,
    vans: [
      { id: 'VAN-1', label: 'Zomato Gig Float', masked: '•••• 1041', balanceRupees: 120234 },
      { id: 'VAN-2', label: 'Blinkit Darkstore Float', masked: '•••• 1042', balanceRupees: 180000 },
      { id: 'VAN-3', label: 'District Events Float', masked: '•••• 1043', balanceRupees: -100000 },
      { id: 'VAN-4', label: 'Hyperpure B2B Float', masked: '•••• 1044', balanceRupees: 0 },
    ],
    plans: [
      {
        id: 'gig-1',
        name: 'Zomato Gig Plan 1',
        brand: 'Zomato',
        policiesCount: 142,
        gwpRupees: 120322,
      },
      {
        id: 'gig-2',
        name: 'Zomato Gig Plan 2',
        brand: 'Zomato',
        policiesCount: 98,
        gwpRupees: 84500,
      },
      {
        id: 'blinkit-3',
        name: 'Blinkit Plan 3',
        brand: 'Blinkit',
        policiesCount: 215,
        gwpRupees: 310450,
      },
      {
        id: 'district-4',
        name: 'District Plan 4',
        brand: 'District',
        policiesCount: 64,
        gwpRupees: 96800,
      },
      {
        id: 'hyperpure-5',
        name: 'Hyperpure Plan 5',
        brand: 'Hyperpure',
        policiesCount: 41,
        gwpRupees: 52900,
      },
    ],
  },
  {
    wgName: 'Cred',
    brands: ['Cred', 'Credit Vidya'],
    sector: 'Fintech & Credit',
    topologyKey: 'cred',
    activeUsersCount: 14,
    vansCount: 3,
    plansCount: 4,
    activePoliciesCount: 890,
    wgPoolBalanceRupees: 485000,
    minRequiredRupees: 120000,
    graceStatus: 'healthy',
    graceDaysLeft: 10,
    vans: [
      { id: 'VAN-1', label: 'Cred Mint Float', masked: '•••• 2011', balanceRupees: 310000 },
      {
        id: 'VAN-2',
        label: 'Cred Shared Credit Float',
        masked: '•••• 2012',
        balanceRupees: 175000,
      },
      { id: 'VAN-3', label: 'Cred Garage Float', masked: '•••• 2013', balanceRupees: 0 },
    ],
    plans: [
      {
        id: 'cred-1',
        name: 'Cred Protect Plan A',
        brand: 'Cred',
        policiesCount: 410,
        gwpRupees: 450000,
      },
      {
        id: 'cred-2',
        name: 'Credit Vidya Shield',
        brand: 'Credit Vidya',
        policiesCount: 280,
        gwpRupees: 210000,
      },
      {
        id: 'cred-3',
        name: 'Cred Travel Cover',
        brand: 'Cred',
        policiesCount: 120,
        gwpRupees: 140000,
      },
      {
        id: 'cred-4',
        name: 'Cred Garage Plan',
        brand: 'Cred',
        policiesCount: 80,
        gwpRupees: 95000,
      },
    ],
  },
  {
    wgName: 'MakeMyTrip Group',
    brands: ['MakeMyTrip', 'Goibibo', 'RedBus'],
    sector: 'Travel & Mobility',
    topologyKey: 'eternal',
    activeUsersCount: 32,
    vansCount: 5,
    plansCount: 8,
    activePoliciesCount: 4210,
    wgPoolBalanceRupees: -145000,
    minRequiredRupees: 250000,
    graceStatus: 'grace-active',
    graceDaysLeft: 6,
    vans: [
      {
        id: 'VAN-1',
        label: 'MMT Domestic Flight Float',
        masked: '•••• 3091',
        balanceRupees: 220000,
      },
      { id: 'VAN-2', label: 'Goibibo Hotel Float', masked: '•••• 3092', balanceRupees: -195000 },
      {
        id: 'VAN-3',
        label: 'RedBus Trip Protect Float',
        masked: '•••• 3093',
        balanceRupees: -170000,
      },
    ],
    plans: [
      {
        id: 'mmt-1',
        name: 'MMT Domestic Trip Delay',
        brand: 'MakeMyTrip',
        policiesCount: 1920,
        gwpRupees: 890000,
      },
      {
        id: 'mmt-2',
        name: 'Goibibo Cancellation Cover',
        brand: 'Goibibo',
        policiesCount: 1340,
        gwpRupees: 540000,
      },
      {
        id: 'mmt-3',
        name: 'RedBus Ride Shield',
        brand: 'RedBus',
        policiesCount: 950,
        gwpRupees: 310000,
      },
    ],
  },
  {
    wgName: 'Swiggy Bundl',
    brands: ['Swiggy Food', 'Instamart', 'Dineout'],
    sector: 'Food & Quick Commerce',
    topologyKey: 'eternal',
    activeUsersCount: 24,
    vansCount: 3,
    plansCount: 6,
    activePoliciesCount: 1840,
    wgPoolBalanceRupees: -280000,
    minRequiredRupees: 180000,
    graceStatus: 'grace-expired',
    graceDaysLeft: 0,
    vans: [
      { id: 'VAN-1', label: 'Swiggy Fleet Float', masked: '•••• 4101', balanceRupees: 90000 },
      { id: 'VAN-2', label: 'Instamart Picker Float', masked: '•••• 4102', balanceRupees: -370000 },
    ],
    plans: [
      {
        id: 'swg-1',
        name: 'Swiggy Rider GPA Plan',
        brand: 'Swiggy Food',
        policiesCount: 1120,
        gwpRupees: 670000,
      },
      {
        id: 'swg-2',
        name: 'Instamart Store Cover',
        brand: 'Instamart',
        policiesCount: 720,
        gwpRupees: 410000,
      },
    ],
  },
];

const EXTRA_PARTNER_BRANDS = [
  ['PhonePe', 'Indus Appstore', 'Pincode'],
  ['Urban Company', 'Native Appliances'],
  ['Flipkart', 'Myntra', 'Cleartrip'],
  ['Ola Electric', 'Ola Mobility'],
  ['Razorpay', 'RazorpayX'],
  ['Nykaa', 'Nykaa Fashion'],
  ['Zepto', 'Zepto Cafe'],
  ['Meesho', 'Valmo Logistics'],
  ['Paytm', 'Paytm Travel'],
  ['Groww', 'Groww Credit'],
  ['Pine Labs', 'Qwikcilver'],
  ['Porter', 'Porter Enterprise'],
  ['Delhivery', 'Spoton'],
  ['Lenskart', 'Owndays'],
  ['Tata Digital', 'BigBasket', '1mg'],
  ['Reliance Retail', 'JioMart', 'Ajio'],
];

export const PARTNER_WG_DIRECTORY: PartnerWgDirectoryItem[] = Array.from(
  { length: 120 },
  (_, idx) => {
    const wgNum = String(idx + 1).padStart(3, '0');
    if (idx < SEED_PARTNER_WGS.length) {
      return {
        ...SEED_PARTNER_WGS[idx],
        wgId: `WG-${wgNum}`,
      };
    }
    const brandGroup =
      EXTRA_PARTNER_BRANDS[(idx - SEED_PARTNER_WGS.length) % EXTRA_PARTNER_BRANDS.length];
    const regionSuffix =
      idx >= SEED_PARTNER_WGS.length + EXTRA_PARTNER_BRANDS.length
        ? ` · Unit ${Math.floor((idx - SEED_PARTNER_WGS.length) / EXTRA_PARTNER_BRANDS.length) + 1}`
        : '';
    const wgName = `${brandGroup[0]} Group${regionSuffix}`;
    const graceMod = idx % 17;
    const graceStatus: WgGraceStatus =
      graceMod === 0
        ? 'grace-expired'
        : graceMod === 3 || graceMod === 9
          ? 'grace-active'
          : graceMod === 5 || graceMod === 12
            ? 'low-float'
            : 'healthy';
    const balance =
      graceStatus === 'grace-expired'
        ? -190000 - (idx % 5) * 25000
        : graceStatus === 'grace-active'
          ? -65000 - (idx % 4) * 15000
          : graceStatus === 'low-float'
            ? 75000 + (idx % 3) * 12000
            : 320000 + (idx % 9) * 85000;
    const vansCount = (idx % 3) + 2;
    const plansCount = vansCount + (idx % 2) + 1;
    return {
      wgId: `WG-${wgNum}`,
      wgName,
      brands: brandGroup,
      sector: idx % 2 === 0 ? 'Enterprise & Commerce' : 'Fintech & Mobility',
      topologyKey: idx % 2 === 0 ? 'eternal' : 'cred',
      activeUsersCount: 6 + (idx % 22),
      vansCount,
      plansCount,
      activePoliciesCount: 180 + ((idx * 73) % 2400),
      wgPoolBalanceRupees: balance,
      minRequiredRupees: 90000 + (idx % 5) * 25000,
      graceStatus,
      graceDaysLeft:
        graceStatus === 'grace-expired' ? 0 : graceStatus === 'grace-active' ? (idx % 8) + 2 : 10,
      vans: Array.from({ length: vansCount }, (__, vIdx) => ({
        id: `VAN-${vIdx + 1}`,
        label: `${brandGroup[vIdx % brandGroup.length]} Float ${vIdx + 1}`,
        masked: `•••• ${4000 + idx * 10 + vIdx}`,
        balanceRupees: Math.round(balance / vansCount),
      })),
      plans: Array.from({ length: plansCount }, (__, pIdx) => ({
        id: `plan-${idx}-${pIdx + 1}`,
        name: `${brandGroup[pIdx % brandGroup.length]} Plan ${pIdx + 1}`,
        brand: brandGroup[pIdx % brandGroup.length],
        policiesCount: 60 + pIdx * 45,
        gwpRupees: 95000 + pIdx * 40000,
      })),
    };
  },
);

export const INITIAL_ACCESS_REQUESTS: AccessRequestItem[] = [
  {
    id: 'AR-104',
    requesterId: 'partner-ops',
    requesterName: 'Vikram Nair',
    requesterEmail: 'vikram.nair@eternal.com',
    currentRoleName: 'Operations (Policies & Claims)',
    requestedModules: [
      { module: 'financials', level: 'view' },
      { module: 'manual-refunds', level: 'edit' },
    ],
    requestedVanIds: ['VAN-1'],
    requestedPlanIds: ['gig-1', 'gig-2'],
    reason:
      'Need to verify VAN-1 balance and retry failed bank refund payouts after cancelling policies for Zomato Gig Plan 1.',
    triggerContext: 'Triggered from Policy Cancellation → Refund Payout workflow',
    status: 'pending',
    createdAt: '12 mins ago',
  },
  {
    id: 'AR-103',
    requesterId: 'partner-viewer',
    requesterName: 'Karan Kapoor',
    requesterEmail: 'karan.kapoor@zomato.com',
    currentRoleName: 'Read-Only Plan & Finance Viewer',
    requestedModules: [
      { module: 'claims', level: 'edit' },
      { module: 'reports', level: 'edit' },
    ],
    requestedVanIds: ['VAN-1'],
    requestedPlanIds: ['gig-1', 'gig-2'],
    reason:
      'Taking over monthly claims settlement sign-off and Zomato Gig Plan 2 endorsement reconciliation.',
    triggerContext: 'Triggered from Claims Management → Submit Claim Action',
    status: 'pending',
    createdAt: '1 hr ago',
  },
  {
    id: 'AR-101',
    requesterId: 'account-manager',
    requesterName: 'Neha Gupta',
    requesterEmail: 'neha.gupta@blinkit.com',
    currentRoleName: 'Claims & Finance Hybrid',
    requestedModules: [{ module: 'policies', level: 'edit' }],
    requestedVanIds: ['VAN-2'],
    requestedPlanIds: ['blinkit-3'],
    reason: 'Approved for Blinkit Darkstore policy endorsements.',
    triggerContext: 'Triggered from Policy Management',
    status: 'approved',
    createdAt: 'Yesterday',
    resolvedBy: 'Aarav Mehta (Super Admin)',
    resolutionNote: 'Approved View & Edit for Blinkit Plan 3.',
  },
];

export const INITIAL_CONTEXTUAL_NOTIFICATIONS: ContextualNotification[] = [
  {
    id: 'NOTIF-1',
    category: 'alerts',
    title: 'Upload In Progress',
    body: '200 user entries from Partner_Users_Batch_Nov2026.csv are being validated and mapped to WG > VAN > PLAN scopes. You will be notified once complete.',
    timestamp: '1 min ago',
    unread: true,
    uploadState: 'uploading',
    actionLabel: 'View UAM Directory',
    actionRoute: 'settings/access-management',
  },
  {
    id: 'NOTIF-2',
    category: 'approvals',
    title: 'Access Request · Vikram Nair (Operations)',
    body: 'Requested Financials (View) & Manual Refunds (View & Edit) on VAN-1 · Zomato Gig Float (•••• 1041) to resolve failed policy cancellation payouts.',
    timestamp: '12 mins ago',
    unread: true,
    vanId: 'VAN-1',
    requestId: 'AR-104',
    actionLabel: 'Review request',
    actionRoute: 'settings/access-management',
  },
  {
    id: 'NOTIF-3',
    category: 'approvals',
    title: 'Access Request · Karan Kapoor (Plan 1 Lead)',
    body: 'Requested Claims (View & Edit) and Zomato Gig Plan 2 scope under shared account VAN-1 (•••• 1041).',
    timestamp: '1 hr ago',
    unread: true,
    vanId: 'VAN-1',
    requestId: 'AR-103',
    actionLabel: 'Review request',
    actionRoute: 'settings/access-management',
  },
  {
    id: 'NOTIF-4',
    category: 'alerts',
    title: 'Low CD Balance on Zomato Gig Float (•••• 1041)',
    body: 'Available balance on VAN-1 is ₹2,00,234 (shared across Zomato Gig Plan 1 & Plan 2). Top up before issuance threshold is reached.',
    timestamp: '2 hrs ago',
    unread: false,
    vanId: 'VAN-1',
    actionLabel: 'Open Financials',
    actionRoute: 'financials',
  },
  {
    id: 'NOTIF-5',
    category: 'tasks',
    title: '2 Failed Bank Refund Payouts Require Beneficiary Update',
    body: 'Policies under Zomato Gig Plan 1 (VAN-1) have returned bank payouts. Funds remain held until beneficiary IFSC is updated.',
    timestamp: '3 hrs ago',
    unread: false,
    vanId: 'VAN-1',
    actionLabel: 'Open Manual Refunds',
    actionRoute: 'manual-refunds',
  },
  {
    id: 'NOTIF-6',
    category: 'mentions',
    title: '@Aarav Mehta mentioned by Riya Sharma',
    body: '“@Aarav Mehta Can you approve Vikram’s Manual Refunds access for VAN-1? His team is blocked on 4 policy cancellation payouts.”',
    timestamp: '4 hrs ago',
    unread: false,
    vanId: 'VAN-1',
    requestId: 'AR-104',
    actionLabel: 'Open Access Requests',
    actionRoute: 'settings/access-management',
  },
];

function seedRealisticUamUsers(s: Snapshot): Snapshot {
  if (s.topology !== 'eternal') return s;
  const directory: Record<string, Partial<AccessUser>> = {
    'super-admin': {
      name: 'Aarav Mehta (Super Admin)',
      email: 'aarav.mehta@eternal.com',
      status: 'active',
      vanIds: ['VAN-1', 'VAN-2', 'VAN-3'],
      planIds: ['gig-1', 'gig-2', 'blinkit-3', 'district-4'],
      capabilities: ['view', 'export', 'dispute', 'report-deposit', 'manage-access'],
    },
    'partner-finance': {
      name: 'Riya Sharma (Zomato Sub-Admin)',
      email: 'riya.sharma@zomato.com',
      status: 'active',
      vanIds: ['VAN-1'],
      planIds: ['gig-1', 'gig-2'],
      capabilities: ['view', 'export', 'dispute', 'report-deposit', 'manage-access'],
    },
    'partner-viewer': {
      name: 'Karan Kapoor (Zomato Plan 1 Lead)',
      email: 'karan.kapoor@zomato.com',
      status: 'active',
      vanIds: ['VAN-1'],
      planIds: ['gig-1'],
      capabilities: ['view', 'export'],
    },
    'account-manager': {
      name: 'Neha Gupta (Blinkit Claims & Finance)',
      email: 'neha.gupta@blinkit.com',
      status: 'active',
      vanIds: ['VAN-2'],
      planIds: ['blinkit-3'],
      capabilities: ['view', 'export', 'dispute'],
    },
    'partner-ops': {
      name: 'Vikram Nair (Operations · Policies & Claims)',
      email: 'vikram.nair@eternal.com',
      status: 'active',
      vanIds: [],
      planIds: ['gig-1', 'gig-2', 'blinkit-3'],
      capabilities: [],
    },
    'eternal-group-finance': {
      name: 'Ananya Iyer (Finance & Policy Controller)',
      email: 'ananya.iyer@eternal.com',
      status: 'active',
      vanIds: ['VAN-1', 'VAN-2', 'VAN-3'],
      planIds: ['gig-1', 'blinkit-3'],
      capabilities: ['view', 'export', 'dispute'],
    },
  };
  return {
    ...s,
    users: s.users.map((u) => (directory[u.id] ? { ...u, ...directory[u.id] } : u)),
  };
}

function useWorkspaceState(gateway: FinanceGateway) {
  const [snapshot, setSnapshot] = useState(() => seedRealisticUamUsers(createSnapshot()));
  const [role, setRoleState] = useState<Role>('super-admin');
  const [scenario, setScenario] = useState<Scenario>('healthy');
  const [selectedVan, setSelectedVan] = useState('VAN-1');
  const [approachMode, setApproachMode] = useState<ApproachMode>('engineering-ready-v3.1');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [selectedPartnersV31, setSelectedPartnersV31] = useState<string[]>([
    'Zomato',
    'Blinkit',
    'District',
    'Hyperpure',
  ]);
  const [selectedPlanIdsV31, setSelectedPlanIdsV31] = useState<string[]>(
    V31_PLAN_CATALOG.map((p) => p.id),
  );
  const [vanAliases, setVanAliases] = useState<Record<string, string>>(DEFAULT_VAN_ALIASES);
  const [activeSuggestedScenario, setActiveSuggestedScenario] =
    useState<SuggestedScenarioId>('S1-wg-full');
  const [suggestedDrawerOpen, setSuggestedDrawerOpen] = useState(false);
  const [namingCeremonyOpen, setNamingCeremonyOpen] = useState(false);

  // Engineering Ready v2.0 & v3.0: WG Pool Balance, VAN Contributions/Purposes & Acko Super Admin Threshold
  const [wgPoolPreset, setWgPoolPreset] = useState<WgPoolPresetId>('wireframe-low-200k');
  const [vanContributionsRupees, setVanContributionsRupees] = useState<Record<string, number>>(
    WG_POOL_PRESETS['wireframe-low-200k'].vanContributionsRupees,
  );
  const [vanPurposeMap, setVanPurposeMap] = useState<Record<string, VanPurpose>>(
    WG_POOL_PRESETS['wireframe-low-200k'].vanPurposes,
  );
  const [wgMinThresholdConfig, setWgMinThresholdConfig] = useState<WgMinThresholdConfig>({
    mode: 'gwp-percentage',
    fixedAmountRupees: 50000,
    gwpPercentage: 15,
    monthlyGwpRunRateRupees: 664972,
    updatedBy: 'ACKO Super Admin (Underwriting & Treasury)',
    updatedAt: '04 Nov 2026, 09:00 AM',
  });
  const [isAckoSuperAdmin, setIsAckoSuperAdmin] = useState<boolean>(false);
  const [ackoThresholdModalOpen, setAckoThresholdModalOpen] = useState<boolean>(false);

  // Engineering Ready v3.0: 3 Predefined Roles + 10-Day Grace Period + 120 Partner WGs Directory
  const [v3PartnerRoles, setV3PartnerRoles] =
    useState<PartnerRoleDefinition[]>(V3_INITIAL_PARTNER_ROLES);
  const [v3UserRoleAssignments, setV3UserRoleAssignments] = useState<Record<string, string>>({
    'super-admin': 'role-super-admin',
    'partner-finance': 'role-super-admin',
    'partner-viewer': 'role-operations',
    'account-manager': 'role-finance',
    'partner-ops': 'role-operations',
    'eternal-group-finance': 'role-finance',
  });
  const [wgGraceStatus, setWgGraceStatus] = useState<WgGraceStatus>('low-float');
  const [wgGraceDaysLeft, setWgGraceDaysLeft] = useState<number>(6);
  const [selectedPartnerWgId, setSelectedPartnerWgId] = useState<string>('WG-001');
  const [managePartnersViewActive, setManagePartnersViewActive] = useState<boolean>(false);

  // Engineering-Ready v1.0 & v2.0 UAM, Roles, Access Requests, Notifications & Bulk Upload Toasts
  const [v1PartnerRoles, setV1PartnerRoles] =
    useState<PartnerRoleDefinition[]>(INITIAL_PARTNER_ROLES);
  const [v1UserRoleAssignments, setV1UserRoleAssignments] = useState<Record<string, string>>({
    'super-admin': 'role-super-admin',
    'partner-finance': 'role-entity-subadmin',
    'partner-viewer': 'role-viewer',
    'account-manager': 'role-claims-finance',
    'partner-ops': 'role-operations',
    'eternal-group-finance': 'role-finance-policy-edit',
  });

  const isV3Mode =
    approachMode === 'engineering-ready-v3' || approachMode === 'engineering-ready-v3.1';
  const partnerRoles = isV3Mode ? v3PartnerRoles : v1PartnerRoles;
  const userRoleAssignments = isV3Mode ? v3UserRoleAssignments : v1UserRoleAssignments;
  const setPartnerRoles = isV3Mode ? setV3PartnerRoles : setV1PartnerRoles;
  const setUserRoleAssignments = isV3Mode ? setV3UserRoleAssignments : setV1UserRoleAssignments;
  const [accessRequests, setAccessRequests] =
    useState<AccessRequestItem[]>(INITIAL_ACCESS_REQUESTS);
  const [contextualNotifications, setContextualNotifications] = useState<ContextualNotification[]>(
    INITIAL_CONTEXTUAL_NOTIFICATIONS,
  );
  const [requestAccessModal, setRequestAccessModal] = useState<{
    open: boolean;
    defaultModule?: ModuleId;
    defaultLevel?: 'view' | 'edit';
    triggerContext?: string;
  }>({ open: false });
  const [bulkToast, setBulkToast] = useState<BulkToastState>(null);
  const [uamActiveTab, setUamActiveTab] = useState<
    'users' | 'roles' | 'requests' | 'van-naming' | 'wg-threshold'
  >('users');

  const [pending, setPending] = useState(false);
  const [failNextAction, setFailNextAction] = useState(false);
  const [timeoutNextAction, setTimeoutNextAction] = useState(false);
  const [unknownOutcome, setUnknownOutcome] = useState<string | null>(null);
  const pendingOutcome = useRef<{ result: Snapshot; generation: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const view = selectView(snapshot, role);

  const activeRoleDefinition =
    partnerRoles.find((r) => r.id === userRoleAssignments[role]) || partnerRoles[0];

  const configure = async (topology: Topology, nextScenario: Scenario, nextRole?: Role) => {
    const request = ++generation.current;
    const result = await gateway.load(topology, nextScenario);
    if (request !== generation.current) return;
    setSnapshot(nextScenario === 'healthy' ? seedRealisticUamUsers(result) : result);
    if (nextRole) setRoleState(nextRole);
    setScenario(nextScenario);
    setSelectedVan('VAN-1');
    setError(null);
    setFailNextAction(false);
    setUnknownOutcome(null);
    pendingOutcome.current = null;
    setTimeoutNextAction(false);
    if (
      !nextRole &&
      ((topology === 'eternal' && role === 'credit-vidya') ||
        (topology === 'cred' && role === 'eternal-group-finance'))
    )
      setRoleState('partner-finance');
  };

  const setRole = (next: Role) => {
    generation.current += 1;
    setRoleState(next);
    const targetUser = snapshot.users.find((u) => u.id === next);
    if (targetUser?.vanIds.length) {
      setSelectedVan(targetUser.vanIds[0]);
    } else {
      setSelectedVan(next === 'credit-vidya' ? 'VAN-2' : 'VAN-1');
    }
    if (targetUser?.planIds.length) {
      setSelectedPlanId(targetUser.planIds[0]);
    }
    setError(null);
  };

  const execute = async (command: Command): Promise<boolean> => {
    if (inFlight.current || unknownOutcome) return false;
    inFlight.current = true;
    setPending(true);
    setError(null);
    const request = generation.current;
    const key = `LOCAL-${snapshot.revision}-${crypto.randomUUID()}`;
    try {
      if (failNextAction) {
        setFailNextAction(false);
        await new Promise((resolve) => setTimeout(resolve, 450));
        throw new Error(
          'The service could not complete this request. Your entries are preserved. Retry when ready.',
        );
      }
      const result = await gateway.execute(snapshot, role, command, key);
      if (request !== generation.current) return false;
      if (timeoutNextAction) {
        setTimeoutNextAction(false);
        pendingOutcome.current = { result, generation: request };
        setUnknownOutcome(key);
        setError('The response was interrupted. Check the request status before submitting again.');
        return false;
      }
      setSnapshot(result);
      toast.success(result.audit.at(-1)?.title || 'Request completed');
      return true;
    } catch (e) {
      if (request === generation.current) {
        const message = e instanceof Error ? e.message : 'Something went wrong. Please retry.';
        setError(message);
        toast.error(message);
      }
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  const system = (event: SystemEvent) => {
    if (inFlight.current || unknownOutcome) return;
    try {
      generation.current += 1;
      const result = applySystemEvent(snapshot, event);
      setSnapshot(result);
      setError(null);
      toast.success(result.audit.at(-1)?.title);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to apply event');
    }
  };

  const checkOutcome = () => {
    const held = pendingOutcome.current;
    if (held && held.generation === generation.current) {
      setSnapshot(held.result);
      setError(null);
      toast.success('Request confirmed. The original operation completed once.');
    } else {
      setError('Context changed. Reload the scenario to retrieve a fresh authorized snapshot.');
    }
    setUnknownOutcome(null);
    pendingOutcome.current = null;
  };

  const setApdBasis = (basis: Snapshot['apdBasis']) => {
    generation.current += 1;
    setSnapshot((s) => changeApdBasis(s, basis));
  };

  const markRead = () => {
    setSnapshot((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }));
    setContextualNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const setVanAlias = (vanId: string, alias: string) => {
    setVanAliases((prev) => ({ ...prev, [vanId]: alias }));
  };

  const savePartnerRole = (roleDef: PartnerRoleDefinition) => {
    setPartnerRoles((prev) => {
      const exists = prev.some((r) => r.id === roleDef.id);
      return exists ? prev.map((r) => (r.id === roleDef.id ? roleDef : r)) : [...prev, roleDef];
    });
    toast.success(`Role "${roleDef.name}" saved.`);
  };

  const assignUserRoleAndScope = (user: AccessUser, roleId: string, reasonText: string) => {
    const roleDef = partnerRoles.find((r) => r.id === roleId);
    const derivedCaps: Capability[] = [];
    if (roleDef) {
      if (roleDef.permissions.financials !== 'none') derivedCaps.push('view');
      if (roleDef.permissions.reports !== 'none' || roleDef.permissions.financials === 'edit')
        derivedCaps.push('export');
      if (roleDef.permissions.financials === 'edit') derivedCaps.push('dispute', 'report-deposit');
      if (roleDef.permissions.settings === 'edit') derivedCaps.push('manage-access');
    } else {
      derivedCaps.push(...user.capabilities);
    }
    const updatedUser: AccessUser = {
      ...user,
      capabilities: [...new Set(derivedCaps)],
    };
    setUserRoleAssignments((prev) => ({ ...prev, [user.id]: roleId }));
    setSnapshot((s) => {
      const exists = s.users.some((u) => u.id === updatedUser.id);
      return {
        ...s,
        revision: s.revision + 1,
        users: exists
          ? s.users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
          : [...s.users, updatedUser],
        audit: [
          ...s.audit,
          {
            id: `AUD-UAM-${s.revision + 1}`,
            actor: view.actor.label,
            title: exists
              ? `User access updated (${updatedUser.name})`
              : `User invited (${updatedUser.name})`,
            detail: `Role: ${roleDef?.name || roleId} · VANs: ${updatedUser.vanIds.join(', ') || 'None'} · Plans: ${updatedUser.planIds.length} · Reason: ${reasonText}`,
            at: new Date().toISOString(),
          },
        ],
      };
    });
    toast.success(`Updated access for ${updatedUser.name}`);
  };

  const revokeUserAccess = (userId: string) => {
    const target = snapshot.users.find((u) => u.id === userId);
    if (!target) return;
    setSnapshot((s) => ({
      ...s,
      revision: s.revision + 1,
      users: s.users.filter((u) => u.id !== userId),
      audit: [
        ...s.audit,
        {
          id: `AUD-REVOKE-${s.revision + 1}`,
          actor: view.actor.label,
          title: `User access revoked (${target.name})`,
          detail: `Removed ${target.email} from workspace.`,
          at: new Date().toISOString(),
        },
      ],
    }));
    toast.success(`Revoked access for ${target.name}`);
  };

  const bulkOnboardUsers = (
    entries: {
      name: string;
      email: string;
      roleId: string;
      vanIds: string[];
      planIds: string[];
    }[],
    fileName: string,
    failedCount = 0,
  ) => {
    const totalRows = entries.length + failedCount;
    setBulkToast({
      kind: 'uploading',
      fileName,
      totalRows,
      successRows: entries.length,
      failedRows: failedCount,
    });

    setTimeout(() => {
      if (entries.length === 0 && failedCount > 0) {
        setBulkToast({
          kind: 'failed',
          fileName,
          totalRows,
          successRows: 0,
          failedRows: failedCount,
        });
        setContextualNotifications((prev) => [
          {
            id: `NOTIF-BULK-${Date.now()}`,
            category: 'alerts',
            title: 'Upload Failed',
            body: `All ${totalRows} entries in ${fileName} failed validation. Download the error file, correct the issues, and re-upload.`,
            timestamp: 'Just now',
            unread: true,
            uploadState: 'failed',
            actionLabel: 'Open UAM',
            actionRoute: 'settings/access-management',
          },
          ...prev,
        ]);
        return;
      }

      const newRoleMap: Record<string, string> = {};
      const newUsers: AccessUser[] = entries.map((entry, idx) => {
        const uid = `bulk-user-${Date.now()}-${idx}`;
        const rDef = partnerRoles.find((r) => r.id === entry.roleId);
        const caps: Capability[] = [];
        if (rDef?.permissions.financials !== 'none') caps.push('view');
        if (rDef?.permissions.reports !== 'none') caps.push('export');
        if (rDef?.permissions.financials === 'edit') caps.push('dispute');
        if (rDef?.permissions.settings === 'edit') caps.push('manage-access');
        newRoleMap[uid] = entry.roleId;
        return {
          id: uid,
          name: entry.name,
          email: entry.email,
          status: 'active',
          vanIds: entry.vanIds,
          planIds: entry.planIds,
          capabilities: caps,
        };
      });

      setUserRoleAssignments((prev) => ({ ...prev, ...newRoleMap }));
      setSnapshot((s) => ({
        ...s,
        revision: s.revision + 1,
        users: [...s.users, ...newUsers],
        audit: [
          ...s.audit,
          {
            id: `AUD-BULK-${s.revision + 1}`,
            actor: view.actor.label,
            title: `Bulk user upload completed (${entries.length} onboarded)`,
            detail: `File: ${fileName} · ${entries.length} succeeded, ${failedCount} failed validation.`,
            at: new Date().toISOString(),
          },
        ],
      }));

      const finalKind = failedCount > 0 ? 'partial' : 'success';
      setBulkToast({
        kind: finalKind,
        fileName,
        totalRows,
        successRows: entries.length,
        failedRows: failedCount,
      });
      setContextualNotifications((prev) => [
        {
          id: `NOTIF-BULK-${Date.now()}`,
          category: 'alerts',
          title: finalKind === 'success' ? 'Upload Complete!' : 'Upload Partially Complete',
          body:
            finalKind === 'success'
              ? `All ${entries.length} entries from ${fileName} were successfully uploaded.`
              : `${entries.length} entries were uploaded successfully, but ${failedCount} entries failed validation. Download the error file to fix and re-upload.`,
          timestamp: 'Just now',
          unread: true,
          uploadState: finalKind,
          actionLabel: 'View onboarded users',
          actionRoute: 'settings/access-management',
        },
        ...prev,
      ]);
    }, 900);
  };

  const submitAccessRequest = (payload: {
    requestedModules: { module: ModuleId; level: 'view' | 'edit' }[];
    requestedVanIds: string[];
    requestedPlanIds: string[];
    reason: string;
    triggerContext: string;
  }) => {
    const newId = `AR-${105 + accessRequests.length}`;
    const currentUser = snapshot.users.find((u) => u.id === role);
    const req: AccessRequestItem = {
      id: newId,
      requesterId: role,
      requesterName: currentUser?.name || view.actor.label,
      requesterEmail: currentUser?.email || `${role}@eternal.com`,
      currentRoleName: activeRoleDefinition.name,
      requestedModules: payload.requestedModules,
      requestedVanIds: payload.requestedVanIds,
      requestedPlanIds: payload.requestedPlanIds,
      reason: payload.reason,
      triggerContext: payload.triggerContext,
      status: 'pending',
      createdAt: 'Just now',
    };
    setAccessRequests((prev) => [req, ...prev]);
    setContextualNotifications((prev) => [
      {
        id: `NOTIF-REQ-${Date.now()}`,
        category: 'approvals',
        title: `Access Request (${newId}) · ${req.requesterName}`,
        body: `Requested ${payload.requestedModules
          .map((m) => `${m.module} (${m.level})`)
          .join(', ')} for ${payload.requestedVanIds.join(', ') || 'assigned plans'}.`,
        timestamp: 'Just now',
        unread: true,
        vanId: payload.requestedVanIds[0],
        requestId: newId,
        actionLabel: 'Review in UAM',
        actionRoute: 'settings/access-management',
      },
      ...prev,
    ]);
    setRequestAccessModal({ open: false });
    toast.success(`Access request ${newId} submitted to your administrator.`);
  };

  const resolveAccessRequest = (
    requestId: string,
    decision: 'approved' | 'modified' | 'rejected',
    note: string,
    overrideVans?: string[],
    overridePlans?: string[],
  ) => {
    const targetReq = accessRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    setAccessRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: decision,
              resolvedBy: view.actor.label,
              resolutionNote: note,
            }
          : r,
      ),
    );

    if (decision === 'approved' || decision === 'modified') {
      const vansToGrant = overrideVans ?? targetReq.requestedVanIds;
      const plansToGrant = overridePlans ?? targetReq.requestedPlanIds;
      // Also update the requester's role permissions or user capabilities
      const requesterRoleId = userRoleAssignments[targetReq.requesterId];
      if (requesterRoleId) {
        setPartnerRoles((prev) =>
          prev.map((r) => {
            if (r.id !== requesterRoleId) return r;
            const nextPerms = { ...r.permissions };
            for (const item of targetReq.requestedModules) {
              nextPerms[item.module] =
                decision === 'modified' && item.level === 'edit' ? 'view' : item.level;
            }
            return { ...r, permissions: nextPerms };
          }),
        );
      }

      setSnapshot((s) => ({
        ...s,
        revision: s.revision + 1,
        users: s.users.map((u) => {
          if (u.id !== targetReq.requesterId) return u;
          const nextVans = [...new Set([...u.vanIds, ...vansToGrant])];
          const nextPlans = [...new Set([...u.planIds, ...plansToGrant])];
          const nextCaps = [...u.capabilities];
          if (
            targetReq.requestedModules.some(
              (m) => m.module === 'financials' || m.module === 'manual-refunds',
            ) &&
            !nextCaps.includes('view')
          ) {
            nextCaps.push('view');
          }
          if (
            targetReq.requestedModules.some(
              (m) => m.module === 'financials' && m.level === 'edit',
            ) &&
            decision === 'approved' &&
            !nextCaps.includes('dispute')
          ) {
            nextCaps.push('dispute', 'export');
          }
          return {
            ...u,
            vanIds: nextVans,
            planIds: nextPlans,
            capabilities: nextCaps,
          };
        }),
        audit: [
          ...s.audit,
          {
            id: `AUD-REQ-${s.revision + 1}`,
            actor: view.actor.label,
            title: `Access request ${requestId} ${decision} for ${targetReq.requesterName}`,
            detail: note,
            at: new Date().toISOString(),
          },
        ],
      }));
    }

    setContextualNotifications((prev) => [
      {
        id: `NOTIF-RES-${Date.now()}`,
        category: 'approvals',
        title: `Access Request ${requestId} ${decision === 'rejected' ? 'Declined' : 'Approved'}`,
        body: `${targetReq.requesterName}: ${note}`,
        timestamp: 'Just now',
        unread: true,
        requestId,
      },
      ...prev,
    ]);

    toast.success(
      `Request ${requestId} ${decision === 'rejected' ? 'rejected' : 'approved and applied'}.`,
    );
  };

  const applySuggestedScenario = (presetId: SuggestedScenarioId) => {
    generation.current += 1;
    setActiveSuggestedScenario(presetId);
    const fresh = seedRealisticUamUsers(createSnapshot('eternal', 'healthy'));

    if (presetId === 'S1-wg-full') {
      setSnapshot(fresh);
      setRoleState('super-admin');
      setSelectedVan('VAN-1');
      setSelectedPlanId('all');
      setSelectedPartnersV31(['Zomato', 'Blinkit', 'District', 'Hyperpure']);
      setSelectedPlanIdsV31(V31_PLAN_CATALOG.map((p) => p.id));
    } else if (presetId === 'S2-van-a-shared') {
      setSnapshot(fresh);
      setRoleState('partner-finance');
      setSelectedVan('VAN-1');
      setSelectedPlanId('gig-1');
      setSelectedPartnersV31(['Zomato', 'Blinkit']);
      setSelectedPlanIdsV31(
        V31_PLAN_CATALOG.filter((p) => ['Zomato', 'Blinkit'].includes(p.partner)).map((p) => p.id),
      );
    } else if (presetId === 'S3-plan-a1-masked-coplan') {
      setSnapshot(fresh);
      setRoleState('partner-viewer');
      setSelectedVan('VAN-1');
      setSelectedPlanId('gig-1');
      setSelectedPartnersV31(['Zomato']);
      setSelectedPlanIdsV31(
        V31_PLAN_CATALOG.filter((p) => p.partner === 'Zomato').map((p) => p.id),
      );
    } else if (presetId === 'S4-single-van-b-c') {
      setSnapshot(fresh);
      setRoleState('account-manager');
      setSelectedVan('VAN-2');
      setSelectedPlanId('blinkit-3');
      setSelectedPartnersV31(['Blinkit']);
      setSelectedPlanIdsV31(
        V31_PLAN_CATALOG.filter((p) => p.partner === 'Blinkit').map((p) => p.id),
      );
    } else if (presetId === 'S5-ops-only-plans') {
      setSnapshot(fresh);
      setRoleState('partner-ops');
      setSelectedVan('VAN-1');
      setSelectedPlanId('all');
      setSelectedPartnersV31(['Zomato', 'Blinkit']);
      setSelectedPlanIdsV31(
        V31_PLAN_CATALOG.filter((p) => ['Zomato', 'Blinkit'].includes(p.partner)).map((p) => p.id),
      );
    } else if (presetId === 'S6-finance-only-vans') {
      setSnapshot(fresh);
      setRoleState('eternal-group-finance');
      setSelectedVan('VAN-1');
      setSelectedPlanId('gig-1');
      setSelectedPartnersV31(['Zomato', 'Blinkit', 'District']);
      setSelectedPlanIdsV31(
        V31_PLAN_CATALOG.filter((p) => ['Zomato', 'Blinkit', 'District'].includes(p.partner)).map(
          (p) => p.id,
        ),
      );
    } else if (presetId === 'S7-district-viewer') {
      fresh.users = fresh.users.map((u) =>
        u.id === 'partner-viewer'
          ? {
              ...u,
              name: 'Devika Rao (District Plan Viewer)',
              email: 'devika.rao@district.in',
              vanIds: ['VAN-3'],
              planIds: ['district-4'],
              capabilities: ['view'],
            }
          : u,
      );
      setSnapshot(fresh);
      setRoleState('partner-viewer');
      setSelectedVan('VAN-3');
      setSelectedPlanId('district-4');
      setSelectedPartnersV31(['District']);
      setSelectedPlanIdsV31(
        V31_PLAN_CATALOG.filter((p) => p.partner === 'District').map((p) => p.id),
      );
    }
    setScenario('healthy');
    setError(null);
  };

  // Engineering Ready v2.0 & v3.0: Computed WG Pool Balance & Minimum Threshold Guardrail
  const wgPoolBalanceRupees = Object.values(vanContributionsRupees).reduce(
    (sum, val) => sum + val,
    0,
  );
  const effectiveMinWgBalanceRupees =
    wgMinThresholdConfig.mode === 'fixed'
      ? wgMinThresholdConfig.fixedAmountRupees
      : Math.round(
          (wgMinThresholdConfig.monthlyGwpRunRateRupees * wgMinThresholdConfig.gwpPercentage) / 100,
        );
  const isWgIssuanceBlocked = isV3Mode
    ? wgGraceStatus === 'grace-expired'
    : wgPoolBalanceRupees < effectiveMinWgBalanceRupees || wgPoolBalanceRupees < 0;
  const isWgBalanceLow = isV3Mode
    ? wgGraceStatus === 'low-float' || wgGraceStatus === 'grace-active'
    : !isWgIssuanceBlocked &&
      wgPoolBalanceRupees <= Math.max(effectiveMinWgBalanceRupees * 2.2, 220000);

  const activePartnerWg =
    PARTNER_WG_DIRECTORY.find((item) => item.wgId === selectedPartnerWgId) ||
    PARTNER_WG_DIRECTORY[0];

  const selectPartnerWg = (wgId: string) => {
    const target = PARTNER_WG_DIRECTORY.find((item) => item.wgId === wgId);
    if (!target) return;
    setSelectedPartnerWgId(wgId);
    setWgGraceStatus(target.graceStatus);
    setWgGraceDaysLeft(target.graceDaysLeft);
    const nextContrib: Record<string, number> = {
      'VAN-1': target.vans[0]?.balanceRupees ?? 120000,
      'VAN-2': target.vans[1]?.balanceRupees ?? 80000,
      'VAN-3': target.vans[2]?.balanceRupees ?? 0,
      'VAN-4': target.vans[3]?.balanceRupees ?? 0,
    };
    setVanContributionsRupees(nextContrib);
    toast.success(`Switched active partner workspace to ${target.wgName} (${target.wgId})`);
  };

  const applyWgPoolPreset = (presetId: WgPoolPresetId) => {
    const preset = WG_POOL_PRESETS[presetId];
    if (!preset) return;
    setWgPoolPreset(presetId);
    setVanContributionsRupees({ ...preset.vanContributionsRupees });
    setVanPurposeMap({ ...preset.vanPurposes });
    if (presetId === 'negative-wg-blocks-positive-van') {
      setWgGraceStatus('grace-active');
      setWgGraceDaysLeft(6);
    } else if (presetId === 'wireframe-low-200k' || presetId === 'positive-wg-80k') {
      setWgGraceStatus('low-float');
      setWgGraceDaysLeft(10);
    } else {
      setWgGraceStatus('healthy');
      setWgGraceDaysLeft(10);
    }
    toast.success(`Loaded WG Pool scenario: ${preset.badge}`);
  };

  const setVanPurpose = (vanId: string, purpose: VanPurpose) => {
    setVanPurposeMap((prev) => ({ ...prev, [vanId]: purpose }));
  };

  const updateWgMinThresholdConfig = (next: Partial<WgMinThresholdConfig>) => {
    setWgMinThresholdConfig((prev) => {
      const updated: WgMinThresholdConfig = {
        ...prev,
        ...next,
        updatedBy: 'ACKO Super Admin (Underwriting & Treasury)',
        updatedAt: 'Just now',
      };
      const newMin =
        updated.mode === 'fixed'
          ? updated.fixedAmountRupees
          : Math.round((updated.monthlyGwpRunRateRupees * updated.gwpPercentage) / 100);
      setContextualNotifications((notifs) => [
        {
          id: `NOTIF-WG-MIN-${Date.now()}`,
          category: 'alerts',
          title: 'Minimum WG Balance Requirement Updated by ACKO',
          body:
            updated.mode === 'fixed'
              ? `Minimum Wallet Group pool balance updated to fixed ₹${newMin.toLocaleString('en-IN')}. Policy issuance pauses across all VANs if WG Pool drops below this threshold.`
              : `Minimum Wallet Group pool balance updated to ${updated.gwpPercentage}% of Monthly GWP Run-rate (₹${updated.monthlyGwpRunRateRupees.toLocaleString('en-IN')}) = ₹${newMin.toLocaleString('en-IN')}.`,
          timestamp: 'Just now',
          unread: true,
          actionLabel: 'View Overview',
          actionRoute: 'overview',
        },
        ...notifs,
      ]);
      toast.success(
        updated.mode === 'fixed'
          ? `Minimum WG Balance set to fixed ₹${newMin.toLocaleString('en-IN')}`
          : `Minimum WG Balance set to ${updated.gwpPercentage}% of Monthly GWP Run-rate (₹${newMin.toLocaleString('en-IN')})`,
      );
      return updated;
    });
  };

  return {
    snapshot,
    view,
    role,
    setRole,
    scenario,
    configure,
    selectedVan,
    setSelectedVan,
    approachMode,
    setApproachMode,
    selectedPlanId,
    setSelectedPlanId,
    selectedPartnersV31,
    setSelectedPartnersV31,
    selectedPlanIdsV31,
    setSelectedPlanIdsV31,
    vanAliases,
    setVanAlias,
    activeSuggestedScenario,
    applySuggestedScenario,
    suggestedDrawerOpen,
    setSuggestedDrawerOpen,
    namingCeremonyOpen,
    setNamingCeremonyOpen,
    wgPoolPreset,
    applyWgPoolPreset,
    vanContributionsRupees,
    setVanContributionsRupees,
    vanPurposeMap,
    setVanPurpose,
    wgMinThresholdConfig,
    updateWgMinThresholdConfig,
    wgPoolBalanceRupees,
    effectiveMinWgBalanceRupees,
    isWgIssuanceBlocked,
    isWgBalanceLow,
    isAckoSuperAdmin,
    setIsAckoSuperAdmin,
    ackoThresholdModalOpen,
    setAckoThresholdModalOpen,
    wgGraceStatus,
    setWgGraceStatus,
    wgGraceDaysLeft,
    setWgGraceDaysLeft,
    selectedPartnerWgId,
    selectPartnerWg,
    activePartnerWg,
    managePartnersViewActive,
    setManagePartnersViewActive,
    partnerRoles,
    savePartnerRole,
    userRoleAssignments,
    activeRoleDefinition,
    assignUserRoleAndScope,
    revokeUserAccess,
    bulkOnboardUsers,
    accessRequests,
    submitAccessRequest,
    resolveAccessRequest,
    contextualNotifications,
    setContextualNotifications,
    requestAccessModal,
    setRequestAccessModal,
    bulkToast,
    setBulkToast,
    uamActiveTab,
    setUamActiveTab,
    pending: pending || !!unknownOutcome,
    unknownOutcome,
    timeoutNextAction,
    setTimeoutNextAction,
    checkOutcome,
    error,
    clearError: () => setError(null),
    execute,
    system,
    failNextAction,
    setFailNextAction,
    setApdBasis,
    markRead,
  };
}

const WorkspaceContext = createContext<ReturnType<typeof useWorkspaceState> | null>(null);
export function FinancialWorkspaceProvider({
  children,
  gateway = simulatorGateway,
}: {
  children: ReactNode;
  gateway?: FinanceGateway;
}) {
  const value = useWorkspaceState(gateway);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useFinancialWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('FinancialWorkspaceProvider is required.');
  return value;
}
