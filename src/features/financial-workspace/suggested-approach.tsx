'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  FileSpreadsheet,
  Info,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeading, PAGE_LAYOUT_CLASS } from '@/components/molecules/PageHeading';
import { STATIC_OVERVIEW_RESPONSE } from '@/lib/services/overview/static';
import { cn } from '@/lib/utils';
import { money } from './domain';
import { BrandInlineSelect } from './common';
import {
  formatVanNumberV31,
  useFinancialWorkspace,
  V31_PLAN_CATALOG,
  type ApproachMode,
  type SuggestedScenarioId,
  type V31PlanCatalogItem,
} from './provider';

export interface PlanMetricFixture {
  planId: string;
  shortCode: string;
  planName: string;
  partner: string;
  vanId: string;
  vanCode: string;
  policiesIssued: number;
  policiesPrev: number;
  policiesDelta: string;
  gwp: string;
  gwpNum: number;
  gwpPrev: string;
  gwpDelta: string;
  avgPremium: string;
  avgPremiumPrev: string;
  avgPremiumDelta: string;
  avgSumInsured: string;
  avgSumInsuredPrev: string;
  avgSumInsuredDelta: string;
  claimsRatio: string;
  claimsRatioPrev: string;
  claimsRatioDelta: string;
  vanBalanceDisplay: string;
  vanBalanceStatus: 'Low' | 'Healthy' | 'Deficit';
}

export const PLAN_METRICS: Record<string, PlanMetricFixture> = {
  'gig-1': {
    planId: 'gig-1',
    shortCode: 'Plan A1',
    planName: 'Zomato Gig Plan 1',
    partner: 'Zomato',
    vanId: 'VAN-1',
    vanCode: 'VAN 1',
    policiesIssued: 142,
    policiesPrev: 14,
    policiesDelta: '52.2%',
    gwp: '₹1,20,322',
    gwpNum: 120322,
    gwpPrev: '₹1,220',
    gwpDelta: '52.2%',
    avgPremium: '₹10,003',
    avgPremiumPrev: '₹10,003',
    avgPremiumDelta: '52.2%',
    avgSumInsured: '₹2,003',
    avgSumInsuredPrev: '₹2,003',
    avgSumInsuredDelta: '52.2%',
    claimsRatio: '1.2',
    claimsRatioPrev: '1.3',
    claimsRatioDelta: '52.2%',
    vanBalanceDisplay: '₹2,00,234',
    vanBalanceStatus: 'Low',
  },
  'gig-2': {
    planId: 'gig-2',
    shortCode: 'Plan A2',
    planName: 'Zomato Gig Plan 2',
    partner: 'Zomato',
    vanId: 'VAN-1',
    vanCode: 'VAN 1',
    policiesIssued: 98,
    policiesPrev: 64,
    policiesDelta: '34.8%',
    gwp: '₹84,500',
    gwpNum: 84500,
    gwpPrev: '₹61,400',
    gwpDelta: '37.6%',
    avgPremium: '₹8,622',
    avgPremiumPrev: '₹9,593',
    avgPremiumDelta: '10.1%',
    avgSumInsured: '₹1,750',
    avgSumInsuredPrev: '₹1,500',
    avgSumInsuredDelta: '16.7%',
    claimsRatio: '0.9',
    claimsRatioPrev: '1.1',
    claimsRatioDelta: '18.2%',
    vanBalanceDisplay: '₹2,00,234',
    vanBalanceStatus: 'Low',
  },
  'blinkit-3': {
    planId: 'blinkit-3',
    shortCode: 'Plan B1',
    planName: 'Blinkit Plan 3',
    partner: 'Blinkit',
    vanId: 'VAN-2',
    vanCode: 'VAN 2',
    policiesIssued: 215,
    policiesPrev: 180,
    policiesDelta: '19.4%',
    gwp: '₹3,10,450',
    gwpNum: 310450,
    gwpPrev: '₹2,60,000',
    gwpDelta: '19.4%',
    avgPremium: '₹14,439',
    avgPremiumPrev: '₹14,444',
    avgPremiumDelta: '0.1%',
    avgSumInsured: '₹3,500',
    avgSumInsuredPrev: '₹3,200',
    avgSumInsuredDelta: '9.4%',
    claimsRatio: '1.4',
    claimsRatioPrev: '1.5',
    claimsRatioDelta: '6.7%',
    vanBalanceDisplay: '₹4,85,900',
    vanBalanceStatus: 'Healthy',
  },
  'district-4': {
    planId: 'district-4',
    shortCode: 'Plan C1',
    planName: 'District Plan 4',
    partner: 'District',
    vanId: 'VAN-3',
    vanCode: 'VAN 3',
    policiesIssued: 64,
    policiesPrev: 49,
    policiesDelta: '30.6%',
    gwp: '₹96,800',
    gwpNum: 96800,
    gwpPrev: '₹74,100',
    gwpDelta: '30.6%',
    avgPremium: '₹15,125',
    avgPremiumPrev: '₹15,122',
    avgPremiumDelta: '0.1%',
    avgSumInsured: '₹5,000',
    avgSumInsuredPrev: '₹5,000',
    avgSumInsuredDelta: '0.0%',
    claimsRatio: '0.7',
    claimsRatioPrev: '0.8',
    claimsRatioDelta: '12.5%',
    vanBalanceDisplay: '₹4,60,000',
    vanBalanceStatus: 'Healthy',
  },
  'hyperpure-5': {
    planId: 'hyperpure-5',
    shortCode: 'Plan D1',
    planName: 'Hyperpure Plan 5',
    partner: 'Hyperpure',
    vanId: 'VAN-4',
    vanCode: 'VAN 4',
    policiesIssued: 41,
    policiesPrev: 35,
    policiesDelta: '17.1%',
    gwp: '₹52,900',
    gwpNum: 52900,
    gwpPrev: '₹45,000',
    gwpDelta: '17.5%',
    avgPremium: '₹12,902',
    avgPremiumPrev: '₹12,857',
    avgPremiumDelta: '0.4%',
    avgSumInsured: '₹2,500',
    avgSumInsuredPrev: '₹2,500',
    avgSumInsuredDelta: '0.0%',
    claimsRatio: '0.6',
    claimsRatioPrev: '0.7',
    claimsRatioDelta: '14.3%',
    vanBalanceDisplay: '₹1,90,000',
    vanBalanceStatus: 'Healthy',
  },
};

export interface SuggestedScenarioCard {
  id: SuggestedScenarioId;
  tierLabel: string;
  badge: string;
  userName: string;
  title: string;
  topologySummary: string;
  description: string;
  vanGrants: string[];
  planGrants: string[];
  uamExperience: string;
  recommendedRoute: 'overview' | 'financials' | 'settings/access-management';
}

export const SUGGESTED_SCENARIOS: SuggestedScenarioCard[] = [
  {
    id: 'S1-wg-full',
    tierLabel: 'Tier 1 · Partner Super Admin',
    badge: 'S1 · Super Admin (Full WG)',
    userName: 'Aarav Mehta',
    title: '1 WG Full Access · 3 VANs (A, B, C) & 4 Plans (A1, A2, B1, C1)',
    topologySummary:
      'VAN-1 → 2 Plans (Zom Gig 1 & 2) · VAN-2 → 1 Plan (Blinkit) · VAN-3 → 1 Plan (District)',
    description:
      'Full 1-WG visibility and user administration across all 3 VAN accounts and all 4 operational plans.',
    vanGrants: ['VAN-1 (Zomato Gig)', 'VAN-2 (Blinkit)', 'VAN-3 (District)'],
    planGrants: ['Zomato Gig Plan 1', 'Zomato Gig Plan 2', 'Blinkit Plan 3', 'District Plan 4'],
    uamExperience:
      'Full Admin View: Can invite/edit users and grant any of the 3 VANs and 4 Plans.',
    recommendedRoute: 'overview',
  },
  {
    id: 'S2-van-a-shared',
    tierLabel: 'Tier 2 · Delegated Sub-Admin (Shared VAN)',
    badge: 'S2 · Sub-Admin (VAN A · 2 Plans)',
    userName: 'Riya Sharma',
    title: 'Single VAN A Access · Shared across 2 Plans (Zomato Gig Plan 1 & 2)',
    topologySummary: 'VAN-1 (•••• 1041) funds both Zomato Gig Plan 1 and Zomato Gig Plan 2',
    description:
      'Entity sub-admin with access only to VAN-1 and its 2 attached plans. Toggling between Plan 1 and Plan 2 updates all 5 Plan KPIs while the CD account balance stays anchored to VAN-1.',
    vanGrants: ['VAN-1 (Zomato Gig)'],
    planGrants: ['Zomato Gig Plan 1', 'Zomato Gig Plan 2'],
    uamExperience:
      'Scoped Sub-Admin View: Can manage users only within VAN-1 and Zomato Gig Plans 1 & 2; cannot grant Blinkit or District.',
    recommendedRoute: 'overview',
  },
  {
    id: 'S3-plan-a1-masked-coplan',
    tierLabel: 'Tier 3 · Single-Plan User on Shared VAN',
    badge: 'S3 · Plan A1 Only on Shared VAN A',
    userName: 'Karan Kapoor',
    title: 'Granted VAN A + Plan 1 Only · Co-Plan 2 Masked in Financials',
    topologySummary: 'Granted VAN-1 + Zomato Gig Plan 1 only (Zomato Gig Plan 2 excluded)',
    description:
      'Operational pages show only Zomato Gig Plan 1. Financials shows VAN-1 true CD balance while masking Zomato Gig Plan 2 debits as "Restricted attribution".',
    vanGrants: ['VAN-1 (Zomato Gig)'],
    planGrants: ['Zomato Gig Plan 1 only'],
    uamExperience:
      'Smaller-User Self-View: Sees their own granted scope (VAN-1 + Zomato Gig Plan 1) and organization admins to contact.',
    recommendedRoute: 'financials',
  },
  {
    id: 'S4-single-van-b-c',
    tierLabel: 'Tier 4 · Dedicated 1:1 Subsidiary Lead',
    badge: 'S4 · Dedicated VAN B (Blinkit 1:1)',
    userName: 'Neha Gupta',
    title: 'Single 1:1 VAN & Plan · Blinkit (VAN-2 → Blinkit Plan 3)',
    topologySummary: 'VAN-2 → Blinkit Plan 3 (1:1 mapping) · VAN-1 & VAN-3 excluded',
    description:
      'Subsidiary user with isolated access to VAN-2 and Blinkit Plan 3. Wallet balance and plan metrics align 1-to-1.',
    vanGrants: ['VAN-2 (Blinkit)'],
    planGrants: ['Blinkit Plan 3'],
    uamExperience:
      'Smaller-User Self-View: Sees their isolated Blinkit account & plan access and who can modify it.',
    recommendedRoute: 'overview',
  },
  {
    id: 'S5-ops-only-plans',
    tierLabel: 'Tier 5 · Operations / Claims User (0 VANs)',
    badge: 'S5 · Operations Only (Plans Only)',
    userName: 'Vikram Nair',
    title: 'Operations Persona · 3 Plans Granted, Zero Financial VAN Exposure',
    topologySummary: 'Zomato Gig Plan 1, Plan 2, Blinkit Plan 3 · 0 Financial Accounts',
    description:
      'Works purely in Plans & Policies across Overview, Policy Management, and Claims without ever seeing an Acko VAN account number or CD balance.',
    vanGrants: ['None (0 VANs)'],
    planGrants: ['Zomato Gig Plan 1', 'Zomato Gig Plan 2', 'Blinkit Plan 3'],
    uamExperience:
      'Smaller-User Self-View: Shows active Operational Plans and notes that Financial Accounts are not included in their role.',
    recommendedRoute: 'overview',
  },
  {
    id: 'S6-finance-only-vans',
    tierLabel: 'Tier 6 · Treasury / Finance User (0 Plans)',
    badge: 'S6 · Finance Only (VANs Only)',
    userName: 'Ananya Iyer',
    title: 'Treasury Persona · 3 VANs (A, B, C), Zero Operational Plans',
    topologySummary: 'VAN-1, VAN-2, VAN-3 granted · 0 Operational Plans',
    description:
      'Reconciles CD balances, UTR deposits, and statements across all 3 VAN wallets while operational Policy & Claims PII screens remain restricted.',
    vanGrants: ['VAN-1 (Zomato Gig)', 'VAN-2 (Blinkit)', 'VAN-3 (District)'],
    planGrants: ['None (0 Plans)'],
    uamExperience:
      'Smaller-User Self-View: Shows active Financial Accounts & permissions and notes that Operational Plan PII is restricted.',
    recommendedRoute: 'financials',
  },
  {
    id: 'S7-district-viewer',
    tierLabel: 'Tier 7 · Read-Only Plan & Account Viewer',
    badge: 'S7 · Read-Only Viewer (District)',
    userName: 'Devika Rao',
    title: 'View-Only Access · District VAN C + District Plan 4',
    topologySummary: 'VAN-3 + District Plan 4 · View only (no export, dispute, or admin)',
    description:
      'Smallest access footprint: can view District Plan 4 metrics and VAN-3 balance, but cannot download statements, raise disputes, or manage users.',
    vanGrants: ['VAN-3 (District · View only)'],
    planGrants: ['District Plan 4'],
    uamExperience: 'Smaller-User Self-View: Read-only scope summary with admin contact list.',
    recommendedRoute: 'settings/access-management',
  },
];

export const APPROACH_DEFINITIONS: {
  id: ApproachMode;
  badge: string;
  title: string;
  subtitle: string;
  portalChain: string;
  financeChain: string;
  verdict: string;
}[] = [
  {
    id: 'approach-3',
    badge: 'RECOMMENDED · PRODUCTION UI',
    title: 'Approach 3 · Domain-Split Nomenclature',
    subtitle:
      'Plan selector on Overview & Operations (WG > PLAN) · VAN selector on Financials (WG > VAN)',
    portalChain: 'WG > PLAN > POLICY',
    financeChain: 'WG > VAN > PLAN > POLICY',
    verdict:
      'Production-ready design: Overview filters by Plan for the 5 operational KPIs and places CD Account Balance in a dedicated bar below so shared-VAN balance never freezes inside a Plan KPI card.',
  },
  {
    id: 'approach-1',
    badge: 'ALTERNATIVE 1',
    title: 'Approach 1 · Cascading VAN > Plan Selector + Naming Ceremony',
    subtitle: 'Cascading View: VAN > Plan across Overview + blue dot on VAN-consistent metrics',
    portalChain: 'WG > VAN > PLAN > POLICY',
    financeChain: 'WG > VAN > PLAN > POLICY',
    verdict:
      'Exposes VANs in the primary Overview selector. Requires an upfront VAN Naming Ceremony so non-finance users recognize account numbers.',
  },
  {
    id: 'approach-2',
    badge: 'ALTERNATIVE 2',
    title: 'Approach 2 · Plan-Only Selector + Shared-VAN Info Banner',
    subtitle: 'Flat View: Plan selector + Today’s balance inside 6-card grid + blue info banner',
    portalChain: 'WG > PLAN > POLICY',
    financeChain: 'WG > PLAN > (Derived VAN)',
    verdict:
      'Keeps Today’s balance inside the 6-card grid, requiring a constant blue disclaimer banner explaining why balance stays frozen at ₹2,00,234 when switching between Zomato Gig Plan 1 and Plan 2.',
  },
];

function formatRupees(amountRupees: number): string {
  const abs = Math.abs(Math.round(amountRupees)).toLocaleString('en-IN');
  return amountRupees < 0 ? `-₹${abs}` : `₹${abs}`;
}

function formatRupeesSigned(amountRupees: number): string {
  if (amountRupees === 0) return '₹0';
  const abs = Math.abs(Math.round(amountRupees)).toLocaleString('en-IN');
  return amountRupees < 0 ? `-₹${abs}` : `+₹${abs}`;
}

function getVanPurposeLabel(
  purpose: 'both' | 'deposit-only' | 'issuance-only' | undefined,
): string {
  if (purpose === 'deposit-only') return 'Deposit VAN';
  if (purpose === 'issuance-only') return 'Issuance VAN';
  return 'Deposit & Issuance';
}

/**
 * Clean, production-ready Overview header & Key Metrics section.
 * Contains ZERO simulator controls or debug badges upfront—ready to hand off to PMs & Devs.
 */
function NestedPlanMultiSelectDropdown({
  availablePlans,
  selectedPlanIds,
  onChange,
  multiPartner,
}: {
  availablePlans: V31PlanCatalogItem[];
  selectedPlanIds: string[];
  onChange: (nextIds: string[]) => void;
  multiPartner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [collapsedPartners, setCollapsedPartners] = useState<Record<string, boolean>>({});
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const availableIds = new Set(availablePlans.map((p) => p.id));
  const validSelected = selectedPlanIds.filter((id) => availableIds.has(id));
  const activeIds = validSelected.length > 0 ? validSelected : availablePlans.map((p) => p.id);
  const activeSet = new Set(activeIds);

  const q = query.trim().toLowerCase();
  const filteredPlans = availablePlans.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.partner.toLowerCase().includes(q) ||
      `${p.partner} > ${p.name}`.toLowerCase().includes(q),
  );

  const partnersInScope = Array.from(new Set(filteredPlans.map((p) => p.partner)));

  const toggleSinglePlan = (planId: string) => {
    if (activeSet.has(planId)) {
      if (activeIds.length <= 1) return; // keep at least 1 selected
      onChange(activeIds.filter((id) => id !== planId));
    } else {
      onChange([...activeIds, planId]);
    }
  };

  const togglePartnerGroup = (partnerName: string) => {
    const partnerPlanIds = availablePlans.filter((p) => p.partner === partnerName).map((p) => p.id);
    const allPartnerSelected = partnerPlanIds.every((id) => activeSet.has(id));
    if (allPartnerSelected) {
      const remaining = activeIds.filter((id) => !partnerPlanIds.includes(id));
      if (remaining.length === 0) return; // keep at least 1 plan active
      onChange(remaining);
    } else {
      onChange(Array.from(new Set([...activeIds, ...partnerPlanIds])));
    }
  };

  const singleSelectedPlan =
    activeIds.length === 1 ? availablePlans.find((p) => p.id === activeIds[0]) : null;
  const triggerText =
    activeIds.length === availablePlans.length
      ? `All plans (${availablePlans.length})`
      : singleSelectedPlan
        ? multiPartner
          ? `${singleSelectedPlan.partner} > ${singleSelectedPlan.name}`
          : singleSelectedPlan.name
        : `${activeIds.length} of ${availablePlans.length} plans`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs shadow-2xs transition hover:border-share-recipient-border-active/50"
      >
        <span className="text-muted-foreground">Plan:</span>
        <span className="max-w-[260px] truncate font-semibold text-foreground">{triggerText}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-white p-3 shadow-lg space-y-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${availablePlans.length} plans...`}
              className="h-7 pl-7 text-xs"
            />
          </div>

          <div className="flex items-center justify-between px-1 text-[11px]">
            <span className="text-muted-foreground">
              {activeIds.length} of {availablePlans.length} plans selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="font-medium text-share-policy-primary hover:underline"
                onClick={() => onChange(availablePlans.map((p) => p.id))}
              >
                Select all ({availablePlans.length})
              </button>
              {availablePlans.length > 1 && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground hover:underline"
                  onClick={() => onChange([availablePlans[0].id])}
                >
                  Only first
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {partnersInScope.map((partnerName) => {
              const groupPlans = filteredPlans.filter((p) => p.partner === partnerName);
              const allPartnerPlans = availablePlans.filter((p) => p.partner === partnerName);
              const selectedInPartnerCount = allPartnerPlans.filter((p) =>
                activeSet.has(p.id),
              ).length;
              const isAllPartnerChecked =
                allPartnerPlans.length > 0 && selectedInPartnerCount === allPartnerPlans.length;
              const isCollapsed = Boolean(collapsedPartners[partnerName]) && !q;

              return (
                <div
                  key={partnerName}
                  className="rounded-lg border border-border/80 bg-pagination-background/50 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 bg-pagination-background px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isAllPartnerChecked}
                        onCheckedChange={() => togglePartnerGroup(partnerName)}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedPartners((prev) => ({
                            ...prev,
                            [partnerName]: !prev[partnerName],
                          }))
                        }
                        className="flex items-center gap-1 font-semibold text-foreground"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        )}
                        {partnerName}
                      </button>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {selectedInPartnerCount}/{allPartnerPlans.length} plans
                    </span>
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-border/40 bg-white px-2 py-1">
                      {groupPlans.map((plan) => {
                        const checked = activeSet.has(plan.id);
                        return (
                          <label
                            key={plan.id}
                            className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted/40"
                          >
                            <span className="flex items-center gap-2 text-foreground">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleSinglePlan(plan.id)}
                              />
                              <span>
                                {multiPartner ? (
                                  <>
                                    <span className="text-muted-foreground">
                                      {plan.partner} &gt;{' '}
                                    </span>
                                    <span className="font-medium">{plan.name}</span>
                                  </>
                                ) : (
                                  <span className="font-medium">{plan.name}</span>
                                )}
                              </span>
                            </span>
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              {plan.policiesIssued}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SuggestedApproachOverviewSection() {
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const {
    snapshot,
    view,
    approachMode,
    selectedPlanId,
    setSelectedPlanId,
    vanAliases,
    setSelectedVan,
    activeRoleDefinition,
    setRequestAccessModal,
    vanContributionsRupees,
    vanPurposeMap,
    wgMinThresholdConfig,
    wgPoolBalanceRupees,
    effectiveMinWgBalanceRupees,
    isWgIssuanceBlocked,
    isWgBalanceLow,
    isAckoSuperAdmin,
    setAckoThresholdModalOpen,
    wgGraceStatus,
    wgGraceDaysLeft,
    activePartnerWg,
    selectedPartnersV31,
    selectedPlanIdsV31,
    setSelectedPlanIdsV31,
  } = useFinancialWorkspace();

  const { welcomeSubtitle } = STATIC_OVERVIEW_RESPONSE;
  const firstName = view.actor.label.split(' ')[0] || 'Nikhil';
  const permittedPlans = view.ownPlans;
  const hasOperationalPlans = permittedPlans.length > 0;

  // If the current user has operational plans, ensure selectedPlanId is one of their permitted plans
  const activePlanKey =
    hasOperationalPlans && permittedPlans.some((p) => p.id === selectedPlanId)
      ? selectedPlanId
      : permittedPlans[0]?.id || 'gig-1';

  const currentMetric = PLAN_METRICS[activePlanKey] || PLAN_METRICS['gig-1'];
  const parentVan = snapshot.vans.find((v) => v.id === currentMetric.vanId) || snapshot.vans[0];
  const sharedPlansOnVan = parentVan ? parentVan.plans : [];
  const isSharedVan = sharedPlansOnVan.length > 1;
  const friendlyVanName =
    vanAliases[currentMetric.vanId] || parentVan?.label || currentMetric.vanId;
  const hasVanAccess =
    view.actor.capabilities.includes('view') &&
    view.actor.vanIds.includes(currentMetric.vanId) &&
    ((approachMode !== 'engineering-ready' &&
      approachMode !== 'engineering-ready-v2' &&
      approachMode !== 'engineering-ready-v3') ||
      activeRoleDefinition.permissions.financials !== 'none');

  const hasFinancialsModuleAccess =
    isAckoSuperAdmin ||
    view.actor.internal ||
    (view.actor.capabilities.includes('view') &&
      activeRoleDefinition.permissions.financials !== 'none');

  /* ============================================================================
   * ENGINEERING READY VERSION 3.1:
   * - Top-right Partner multi-select filters the available plans.
   * - Searchable, nested (Partner > Plan) multi-select Plan dropdown supporting 20-30+ plans.
   * - Super Admin Overview displays the expanded APD Balance & VAN breakdown above the KPIs.
   * - Pure Finance user tab & title renamed from "Financial overview" to "Overview".
   * - VANs displayed strictly as numeric VAN numbers (no account alias names).
   * - "WG Pool Balance (Eternal)" renamed to "APD Balance".
   * - Zero low-float indicators or top callout banners.
   * - Respects role subPermissions (Show/Hide per metric) configured in Configure role.
   * ============================================================================ */
  if (approachMode === 'engineering-ready-v3.1') {
    const isPureFinancePersona =
      !hasOperationalPlans ||
      (activeRoleDefinition.permissions.policies === 'none' &&
        activeRoleDefinition.permissions.claims === 'none' &&
        activeRoleDefinition.permissions.financials !== 'none');

    const isSuperAdminRoleV31 =
      isAckoSuperAdmin ||
      activeRoleDefinition.id === 'role-super-admin' ||
      activeRoleDefinition.permissions.settings === 'edit';

    const activeVansInWg = snapshot.vans.slice(0, 3);
    const grantedVanSet = new Set(view.actor.vanIds);
    const isFullWgViewer =
      isAckoSuperAdmin || view.actor.internal || grantedVanSet.size >= activeVansInWg.length;
    const permittedVans = activeVansInWg.filter((v) => isFullWgViewer || grantedVanSet.has(v.id));
    const ungrantedVans = activeVansInWg.filter((v) => !isFullWgViewer && !grantedVanSet.has(v.id));
    const grantedSumRupees = permittedVans.reduce(
      (sum, v) => sum + (vanContributionsRupees[v.id] ?? 0),
      0,
    );
    const ungrantedSumRupees = ungrantedVans.reduce(
      (sum, v) => sum + (vanContributionsRupees[v.id] ?? 0),
      0,
    );
    const thresholdDescription =
      wgMinThresholdConfig.mode === 'fixed'
        ? `Fixed ₹${wgMinThresholdConfig.fixedAmountRupees.toLocaleString('en-IN')}`
        : `${wgMinThresholdConfig.gwpPercentage}% of Monthly GWP Run-rate`;

    const isSubVisible = (subId: string) =>
      activeRoleDefinition.subPermissions?.[`overview:${subId}`] !== false;

    if (isPureFinancePersona) {
      return (
        <div className={`${PAGE_LAYOUT_CLASS} pt-6 pb-2 space-y-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <PageHeading
              title="Overview"
              subtitle={`Summary of financial accounts and APD balance for ${selectedPartnersV31.join(', ')}`}
            />
            <div className="flex items-center gap-2">
              {(isAckoSuperAdmin || view.actor.internal) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 bg-white text-xs text-share-policy-primary"
                  onClick={() => setAckoThresholdModalOpen(true)}
                >
                  <Settings2 className="size-3.5" />
                  Balance threshold
                </Button>
              )}
              <Button
                size="sm"
                className="finance-primary h-8 text-xs"
                onClick={() => router.push(`/${partner}/dashboard/financials`)}
              >
                Open Financials
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* APD Balance + Financial Accounts (VAN Numbers only, no Low float indicator) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="finance-kpi rounded-metric-card border border-metric-card-border bg-white p-5 lg:col-span-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-pagination-text-muted">APD Balance</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'text-metric-card-value font-semibold leading-9 tabular-nums',
                    wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-metric-card-text',
                  )}
                >
                  {formatRupees(wgPoolBalanceRupees)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Min required: {formatRupees(effectiveMinWgBalanceRupees)}
                </span>
              </div>
            </div>

            <div className="rounded-metric-card border border-metric-card-border bg-white p-5 lg:col-span-7 flex flex-col justify-between gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  Your financial accounts ({permittedVans.length})
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {permittedVans.map((van) => {
                  const contrib = vanContributionsRupees[van.id] ?? 0;
                  return (
                    <div
                      key={van.id}
                      onClick={() => {
                        setSelectedVan(van.id);
                        router.push(`/${partner}/dashboard/financials`);
                      }}
                      className="cursor-pointer rounded-lg border border-border bg-pagination-background px-3 py-2.5 text-xs transition hover:border-share-recipient-border-active"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-semibold text-foreground truncate">
                          {formatVanNumberV31(van.id)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {van.maskedAccount}
                        </span>
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            contrib < 0 ? 'text-red-600' : 'text-foreground',
                          )}
                        >
                          {formatRupeesSigned(contrib)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Filter the 24-plan catalog by the currently selected partners in the top-right Partner dropdown
    const activePartnerSet = new Set(
      selectedPartnersV31.length > 0
        ? selectedPartnersV31
        : ['Zomato', 'Blinkit', 'District', 'Hyperpure'],
    );
    const plansForSelectedPartners = V31_PLAN_CATALOG.filter((p) =>
      activePartnerSet.has(p.partner),
    );
    const activePlansList = plansForSelectedPartners.filter((p) =>
      selectedPlanIdsV31.includes(p.id),
    );
    const effectiveSelectedPlans =
      activePlansList.length > 0 ? activePlansList : plansForSelectedPartners;

    const totalPoliciesIssued = effectiveSelectedPlans.reduce((s, p) => s + p.policiesIssued, 0);
    const totalGwpNum = effectiveSelectedPlans.reduce((s, p) => s + p.gwpRupees, 0);
    const avgPremNum = totalPoliciesIssued > 0 ? Math.round(totalGwpNum / totalPoliciesIssued) : 0;
    const avgSiNum =
      effectiveSelectedPlans.length > 0
        ? Math.round(
            effectiveSelectedPlans.reduce((s, p) => s + p.avgSumInsuredRupees, 0) /
              effectiveSelectedPlans.length,
          )
        : 0;
    const avgClaimsRatio =
      effectiveSelectedPlans.length > 0
        ? (
            effectiveSelectedPlans.reduce((s, p) => s + p.claimsRatio, 0) /
            effectiveSelectedPlans.length
          ).toFixed(1)
        : '1.1';

    return (
      <div className={`${PAGE_LAYOUT_CLASS} pt-6 pb-2 space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeading title={`Welcome, ${firstName}`} subtitle={welcomeSubtitle} />

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <NestedPlanMultiSelectDropdown
              availablePlans={plansForSelectedPartners}
              selectedPlanIds={effectiveSelectedPlans.map((p) => p.id)}
              onChange={setSelectedPlanIdsV31}
              multiPartner={activePartnerSet.size > 1}
            />
          </div>
        </div>

        {/* Point 7: For Super Admins on Overview page, show the APD Balance expanded view along with the metrics */}
        {isSuperAdminRoleV31 && isSubVisible('FLOAT_BALANCE') && (
          <div className="rounded-xl border border-border bg-white px-4 py-3.5 shadow-2xs text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-semibold text-sm text-foreground">
                  APD Balance:{' '}
                  <span className={wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-foreground'}>
                    {formatRupees(wgPoolBalanceRupees)}
                  </span>
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => router.push(`/${partner}/dashboard/financials`)}
              >
                Open Financials
                <ArrowRight className="size-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-pagination-background px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-muted-foreground">Account split:</span>
                {isFullWgViewer ? (
                  activeVansInWg.map((v, idx) => (
                    <span key={v.id} className="inline-flex items-center gap-1.5">
                      {idx > 0 && <span className="text-muted-foreground">+</span>}
                      <span className="rounded border border-border bg-white px-2 py-0.5 font-mono font-medium text-foreground">
                        {formatVanNumberV31(v.id)}:{' '}
                        <strong
                          className={
                            (vanContributionsRupees[v.id] ?? 0) < 0
                              ? 'text-red-600'
                              : 'text-foreground'
                          }
                        >
                          {formatRupeesSigned(vanContributionsRupees[v.id] ?? 0)}
                        </strong>
                      </span>
                    </span>
                  ))
                ) : (
                  <>
                    <span className="rounded border border-border bg-white px-2 py-0.5 font-mono font-medium text-foreground">
                      {view.actor.vanIds.map((id) => formatVanNumberV31(id)).join(', ')}:{' '}
                      <strong>{formatRupeesSigned(grantedSumRupees)}</strong>
                    </span>
                    <span className="text-muted-foreground">+</span>
                    <span className="rounded border border-dashed border-border bg-white px-2 py-0.5 font-medium text-muted-foreground">
                      Other accounts ({ungrantedVans.length}):{' '}
                      <strong
                        className={ungrantedSumRupees < 0 ? 'text-red-600' : 'text-foreground'}
                      >
                        {formatRupeesSigned(ungrantedSumRupees)}
                      </strong>
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">=</span>
                <span className="rounded border border-share-recipient-border-active/40 bg-segmented-tab-active-bg px-2 py-0.5 font-semibold text-segmented-tab-active-text">
                  APD Balance: {formatRupees(wgPoolBalanceRupees)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
              <span>
                Min required:{' '}
                <strong className="text-foreground">
                  {formatRupees(effectiveMinWgBalanceRupees)}
                </strong>{' '}
                ({thresholdDescription})
              </span>
              {(isAckoSuperAdmin || view.actor.internal) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setAckoThresholdModalOpen(true)}
                >
                  <Settings2 className="size-3.5 text-share-policy-primary" />
                  Edit threshold
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Plan-Level Operational Metrics (filtered by role subPermissions) */}
        <section className="space-y-3" aria-label="Policy and claim metrics">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold leading-none text-pagination-text">
              Policy and claim metrics · November 2025
            </h2>
            <p className="text-sm text-pagination-text-muted">Updated today, 10:42 AM</p>
          </div>

          <div className="grid w-full gap-4 md:grid-cols-3">
            {isSubVisible('TOTAL_POLICIES_ISSUED') && (
              <ProductionKpiCard
                label="Total policies issued"
                value={totalPoliciesIssued.toLocaleString('en-IN')}
                hideTrend
              />
            )}
            {isSubVisible('GROSS_WRITTEN_PREMIUM') && (
              <ProductionKpiCard
                label="Gross written premium"
                value={`₹${totalGwpNum.toLocaleString('en-IN')}`}
                hideTrend
              />
            )}
            {isSubVisible('AVERAGE_PREMIUM') && (
              <ProductionKpiCard
                label="Avg premium amount"
                value={`₹${avgPremNum.toLocaleString('en-IN')}`}
                hideTrend
              />
            )}
          </div>

          <div className="grid w-full gap-4 md:grid-cols-2">
            {isSubVisible('AVERAGE_SI') && (
              <ProductionKpiCard
                label="Avg sum insured value"
                value={`₹${avgSiNum.toLocaleString('en-IN')}`}
                hideTrend
              />
            )}
            {isSubVisible('CLAIM_SETTLEMENT_RATIO') && (
              <ProductionKpiCard label="Claims settlement ratio" value={avgClaimsRatio} hideTrend />
            )}
          </div>
        </section>
      </div>
    );
  }

  /* ============================================================================
   * ENGINEERING READY VERSION 3.0:
   * 1. Pure Finance User (0 operational plans OR policies/claims = none & financials != none):
   *    Overview becomes "Financial overview" (Global WG Pool Balance + 10-day grace status + Allowed VANs).
   * 2. Operational / Super Admin / Hybrid Persona:
   *    ZERO WG Pool Balance or Σ VANs cards on Overview.
   *    Overview is strictly PLAN-LEVEL ONLY ("All plans" or 1 plan at a time).
   *    10-day grace period allows policy issuance while negative; only pauses on grace-expired.
   * ============================================================================ */
  if (approachMode === 'engineering-ready-v3') {
    const isPureFinancePersona =
      !hasOperationalPlans ||
      (activeRoleDefinition.permissions.policies === 'none' &&
        activeRoleDefinition.permissions.claims === 'none' &&
        activeRoleDefinition.permissions.financials !== 'none');

    const activeVansInWg = snapshot.vans.slice(0, 3);
    const grantedVanSet = new Set(view.actor.vanIds);
    const isFullWgViewer =
      isAckoSuperAdmin || view.actor.internal || grantedVanSet.size >= activeVansInWg.length;
    const permittedVans = activeVansInWg.filter((v) => isFullWgViewer || grantedVanSet.has(v.id));
    const ungrantedVans = activeVansInWg.filter((v) => !isFullWgViewer && !grantedVanSet.has(v.id));
    const grantedSumRupees = permittedVans.reduce(
      (sum, v) => sum + (vanContributionsRupees[v.id] ?? 0),
      0,
    );
    const ungrantedSumRupees = ungrantedVans.reduce(
      (sum, v) => sum + (vanContributionsRupees[v.id] ?? 0),
      0,
    );

    const graceStatusBadgeLabel =
      wgGraceStatus === 'grace-expired'
        ? '10-Day Grace Expired · Issuance Paused'
        : wgGraceStatus === 'grace-active'
          ? `10-Day Grace Active · ${wgGraceDaysLeft}d left`
          : wgGraceStatus === 'low-float'
            ? 'Low Float'
            : 'Healthy';

    if (isPureFinancePersona) {
      return (
        <div className={`${PAGE_LAYOUT_CLASS} pt-6 pb-2 space-y-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <PageHeading
              title="Financial overview"
              subtitle={`Summary of accounts and balances for ${activePartnerWg.wgName}`}
            />
            <div className="flex items-center gap-2">
              {(isAckoSuperAdmin || view.actor.internal) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 bg-white text-xs text-share-policy-primary"
                  onClick={() => setAckoThresholdModalOpen(true)}
                >
                  <Settings2 className="size-3.5" />
                  Balance threshold
                </Button>
              )}
              <Button
                size="sm"
                className="finance-primary h-8 text-xs"
                onClick={() => router.push(`/${partner}/dashboard/financials`)}
              >
                Open Financials
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Global WG Pool Balance + Accounts Card */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="finance-kpi rounded-metric-card border border-metric-card-border bg-white p-5 lg:col-span-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-pagination-text-muted">
                  WG Pool Balance ({activePartnerWg.wgName})
                </span>
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-xs font-medium',
                    wgGraceStatus === 'grace-expired'
                      ? 'finance-danger'
                      : wgGraceStatus === 'grace-active' || wgGraceStatus === 'low-float'
                        ? 'finance-warning'
                        : 'finance-success',
                  )}
                >
                  {graceStatusBadgeLabel}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'text-metric-card-value font-semibold leading-9 tabular-nums',
                    wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-metric-card-text',
                  )}
                >
                  {formatRupees(wgPoolBalanceRupees)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Min required: {formatRupees(effectiveMinWgBalanceRupees)}
                </span>
              </div>
              {wgGraceStatus !== 'healthy' && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {wgGraceStatus === 'grace-active'
                    ? `${wgGraceDaysLeft}d grace remaining. Policy issuance remains active while recharge is in progress.`
                    : wgGraceStatus === 'grace-expired'
                      ? 'Grace period expired. Recharge to resume policy issuance.'
                      : 'Balance is approaching the minimum threshold.'}
                </p>
              )}
            </div>

            <div className="rounded-metric-card border border-metric-card-border bg-white p-5 lg:col-span-7 flex flex-col justify-between gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  Your financial accounts ({permittedVans.length})
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {permittedVans.map((van) => {
                  const contrib = vanContributionsRupees[van.id] ?? 0;
                  const purpose = vanPurposeMap[van.id] || 'both';
                  return (
                    <div
                      key={van.id}
                      onClick={() => {
                        setSelectedVan(van.id);
                        router.push(`/${partner}/dashboard/financials`);
                      }}
                      className="cursor-pointer rounded-lg border border-border bg-pagination-background px-3 py-2.5 text-xs transition hover:border-share-recipient-border-active"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-foreground truncate">
                          {vanAliases[van.id] || van.label}
                        </span>
                        <span className="rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {purpose === 'deposit-only'
                            ? 'Deposits'
                            : purpose === 'issuance-only'
                              ? 'Issuance'
                              : 'Both'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {van.maskedAccount}
                        </span>
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            contrib < 0 ? 'text-red-600' : 'text-foreground',
                          )}
                        >
                          {formatRupeesSigned(contrib)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Operational / Super Admin / Hybrid Persona Overview:
    // Strictly Plan-Level Only ("All plans" or 1 plan at a time). Zero WG/VAN cards on Overview.
    const isAllPlansSelected =
      selectedPlanId === 'all' || !permittedPlans.some((p) => p.id === selectedPlanId);

    const activeMetricsList = isAllPlansSelected
      ? permittedPlans.map((p) => PLAN_METRICS[p.id]).filter(Boolean)
      : [PLAN_METRICS[selectedPlanId] || currentMetric];

    const totalPoliciesIssued = activeMetricsList.reduce((s, m) => s + m.policiesIssued, 0);
    const totalPoliciesPrev = activeMetricsList.reduce((s, m) => s + m.policiesPrev, 0);
    const totalGwpNum = activeMetricsList.reduce((s, m) => s + m.gwpNum, 0);
    const avgPremNum = totalPoliciesIssued > 0 ? Math.round(totalGwpNum / totalPoliciesIssued) : 0;

    const displayMetric = isAllPlansSelected
      ? {
          scopeTitle:
            permittedPlans.length > 1
              ? `All permitted plans (${permittedPlans.length})`
              : permittedPlans[0]?.name || 'Selected plan',
          policiesIssued: String(totalPoliciesIssued),
          policiesPrev: String(totalPoliciesPrev),
          policiesDelta: '28.4%',
          gwp: `₹${totalGwpNum.toLocaleString('en-IN')}`,
          gwpPrev: '₹3,96,720',
          gwpDelta: '26.1%',
          avgPremium: `₹${avgPremNum.toLocaleString('en-IN')}`,
          avgPremiumPrev: '₹11,940',
          avgPremiumDelta: '12.4%',
          avgSumInsured: '₹3,060',
          avgSumInsuredPrev: '₹2,925',
          avgSumInsuredDelta: '8.2%',
          claimsRatio: '1.1',
          claimsRatioPrev: '1.2',
          claimsRatioDelta: '9.5%',
        }
      : {
          scopeTitle: currentMetric.planName,
          policiesIssued: String(currentMetric.policiesIssued),
          policiesPrev: String(currentMetric.policiesPrev),
          policiesDelta: currentMetric.policiesDelta,
          gwp: currentMetric.gwp,
          gwpPrev: currentMetric.gwpPrev,
          gwpDelta: currentMetric.gwpDelta,
          avgPremium: currentMetric.avgPremium,
          avgPremiumPrev: currentMetric.avgPremiumPrev,
          avgPremiumDelta: currentMetric.avgPremiumDelta,
          avgSumInsured: currentMetric.avgSumInsured,
          avgSumInsuredPrev: currentMetric.avgSumInsuredPrev,
          avgSumInsuredDelta: currentMetric.avgSumInsuredDelta,
          claimsRatio: currentMetric.claimsRatio,
          claimsRatioPrev: currentMetric.claimsRatioPrev,
          claimsRatioDelta: currentMetric.claimsRatioDelta,
        };

    const planOptions = [
      ...(permittedPlans.length > 1
        ? [
            {
              value: 'all',
              label: `All plans (${permittedPlans.length})`,
            },
          ]
        : []),
      ...permittedPlans.map((plan) => ({
        value: plan.id,
        label: plan.name,
      })),
    ];

    return (
      <div className={`${PAGE_LAYOUT_CLASS} pt-6 pb-2 space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeading title={`Welcome, ${firstName}`} subtitle={welcomeSubtitle} />

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <BrandInlineSelect
              label="Plan"
              value={isAllPlansSelected && permittedPlans.length > 1 ? 'all' : activePlanKey}
              onChange={setSelectedPlanId}
              options={planOptions}
            />
          </div>
        </div>

        {/* Only show operational pause banner if the 10-day grace window has expired */}
        {wgGraceStatus === 'grace-expired' && (
          <div
            role="alert"
            className="finance-danger flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                <strong>
                  Policy issuance is temporarily paused for {displayMetric.scopeTitle}:
                </strong>{' '}
                New policy issuance is paused pending an account recharge by your Finance team (the
                10-day grace window has elapsed). Existing policies, endorsements, and claims
                continue uninterrupted.
              </span>
            </div>
            {hasFinancialsModuleAccess && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 bg-white text-xs text-foreground"
                onClick={() => router.push(`/${partner}/dashboard/financials`)}
              >
                Open Financials to recharge
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* Plan-Level Operational Metrics Only (Zero WG/VAN cards on Overview) */}
        <section className="space-y-3" aria-label="Policy and claim metrics">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold leading-none text-pagination-text">
              Policy and claim metrics · November 2025
            </h2>
            <p className="text-sm text-pagination-text-muted">Updated today, 10:42 AM</p>
          </div>

          <div className="grid w-full gap-4 md:grid-cols-3">
            <ProductionKpiCard
              label="Total policies issued"
              value={displayMetric.policiesIssued}
              hideTrend
            />
            <ProductionKpiCard label="Gross written premium" value={displayMetric.gwp} hideTrend />
            <ProductionKpiCard
              label="Avg premium amount"
              value={displayMetric.avgPremium}
              hideTrend
            />
          </div>

          <div className="grid w-full gap-4 md:grid-cols-2">
            <ProductionKpiCard
              label="Avg sum insured value"
              value={displayMetric.avgSumInsured}
              hideTrend
            />
            <ProductionKpiCard
              label="Claims settlement ratio"
              value={displayMetric.claimsRatio}
              hideTrend
            />
          </div>
        </section>
      </div>
    );
  }

  // Finance-only user (0 operational plans, >0 financial accounts) for Approach 1/2/3/v1/v2
  if (!hasOperationalPlans) {
    return (
      <div className={`${PAGE_LAYOUT_CLASS} pt-6 pb-2`}>
        <PageHeading title={`Welcome, ${firstName}`} subtitle={welcomeSubtitle} />
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold leading-none text-pagination-text">
              Financial accounts overview
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/${partner}/dashboard/financials`)}
            >
              Open financials
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
          {view.balances.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {view.balances.map((b) => (
                <div
                  key={b.van.id}
                  className="rounded-xl border border-border bg-white p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {vanAliases[b.van.id] || b.van.label}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {b.van.id} · {b.van.maskedAccount}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Available balance</p>
                  <p
                    className={cn(
                      'mt-1 text-2xl font-bold tabular-nums',
                      b.available < 0 ? 'text-red-600' : 'text-slate-900',
                    )}
                  >
                    {money(b.available)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No operational plans or financial accounts are assigned to your profile.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ============================================================================
   * ENGINEERING READY VERSION 2.0:
   * Separated "WG Pool Balance" (Top) + Contextual Solvency/VAN Banners +
   * "Policy and claim metrics · November 2025" with VAN > Plan selector (Bottom)
   * ZERO "Request access" CTAs anywhere.
   * ============================================================================ */
  if (approachMode === 'engineering-ready-v2') {
    const selectedVanContribution = vanContributionsRupees[currentMetric.vanId] ?? 0;
    const selectedVanPurpose = vanPurposeMap[currentMetric.vanId] || 'both';
    const shortfallRupees = Math.max(effectiveMinWgBalanceRupees - wgPoolBalanceRupees, 0);
    const thresholdDescription =
      wgMinThresholdConfig.mode === 'fixed'
        ? `Fixed ₹${wgMinThresholdConfig.fixedAmountRupees.toLocaleString('en-IN')} floor`
        : `${wgMinThresholdConfig.gwpPercentage}% of Monthly GWP Run-rate (₹${wgMinThresholdConfig.monthlyGwpRunRateRupees.toLocaleString('en-IN')})`;

    const activeVansInWg = snapshot.vans.slice(0, 3);
    const grantedVanSet = new Set(view.actor.vanIds);
    const isFullWgViewer =
      isAckoSuperAdmin || view.actor.internal || grantedVanSet.size >= activeVansInWg.length;
    const ungrantedVans = activeVansInWg.filter((v) => !grantedVanSet.has(v.id));
    const ungrantedSumRupees = ungrantedVans.reduce(
      (sum, v) => sum + (vanContributionsRupees[v.id] ?? 0),
      0,
    );

    const wgStatusLabel = isWgIssuanceBlocked
      ? 'Issuance Paused'
      : isWgBalanceLow
        ? 'Low'
        : 'Healthy';

    return (
      <div className={`${PAGE_LAYOUT_CLASS} pt-6 pb-2 space-y-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeading title={`Welcome, ${firstName}`} subtitle={welcomeSubtitle} />
          {(isAckoSuperAdmin || view.actor.internal) && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 bg-white text-xs text-share-policy-primary"
              onClick={() => setAckoThresholdModalOpen(true)}
            >
              <Settings2 className="size-3.5" />
              ACKO Admin · Configure Min WG Balance
            </Button>
          )}
        </div>

        {/* TOP SECTION: WG Pool Balance (Hidden cleanly when user has Financials = No Access; ZERO Request Access CTA) */}
        {hasFinancialsModuleAccess && (
          <section className="space-y-3" aria-label="WG Pool Balance">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold leading-none text-pagination-text">
                WG Pool Balance
              </h2>
              <p className="text-sm text-pagination-text-muted">Last updated today at 9:00 AM</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Wireframe Today's Balance Card (Left 4 cols) */}
              <div className="finance-kpi rounded-metric-card border border-metric-card-border bg-white p-5 lg:col-span-4 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm leading-5 text-pagination-text-muted">
                    Today’s balance
                  </span>
                  <span
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-xs font-medium',
                      isWgIssuanceBlocked || isWgBalanceLow ? 'finance-danger' : 'finance-success',
                    )}
                  >
                    {wgStatusLabel}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      'text-metric-card-value font-semibold leading-9 tabular-nums',
                      wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-metric-card-text',
                    )}
                  >
                    {formatRupees(wgPoolBalanceRupees)}
                  </span>
                </div>
              </div>

              {/* Companion VAN Contribution Split & Minimum WG Guardrail Card (Right 8 cols) */}
              <div className="rounded-metric-card border border-metric-card-border bg-white p-5 lg:col-span-8 flex flex-col justify-between gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Wallet Group Contribution Split ({snapshot.groupName} · Σ All VANs)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Policy issuance across all plans depends on the central WG Pool staying above
                      the minimum required balance.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium',
                        isWgIssuanceBlocked ? 'finance-danger' : 'finance-neutral',
                      )}
                    >
                      Min WG Required: <strong>{formatRupees(effectiveMinWgBalanceRupees)}</strong>{' '}
                      <span className="text-[11px] opacity-85">({thresholdDescription})</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setAckoThresholdModalOpen(true)}
                    >
                      {isAckoSuperAdmin || view.actor.internal
                        ? 'Edit threshold'
                        : 'Threshold details'}
                    </Button>
                  </div>
                </div>

                {/* Individual VAN Contributions (with automatic masking for scoped users) */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {activeVansInWg.map((van) => {
                    const isGranted = isFullWgViewer || grantedVanSet.has(van.id);
                    if (!isGranted) return null;
                    const contrib = vanContributionsRupees[van.id] ?? 0;
                    const purpose = vanPurposeMap[van.id] || 'both';
                    const isSelectedVan = van.id === currentMetric.vanId;
                    return (
                      <div
                        key={van.id}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-xs transition',
                          isSelectedVan
                            ? 'border-share-recipient-border-active bg-segmented-tab-active-bg/35'
                            : 'border-border bg-pagination-background',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-foreground truncate">
                            {vanAliases[van.id] || van.label}
                          </span>
                          <span className="rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {getVanPurposeLabel(purpose)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {van.id} ({van.maskedAccount})
                          </span>
                          <span
                            className={cn(
                              'font-semibold tabular-nums',
                              contrib < 0 ? 'text-red-600' : 'text-foreground',
                            )}
                          >
                            {formatRupeesSigned(contrib)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {!isFullWgViewer && ungrantedVans.length > 0 && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-muted-foreground">
                          Other VANs in WG ({ungrantedVans.length})
                        </span>
                        <span className="rounded border border-border bg-white px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Restricted details
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-[11px] text-muted-foreground">Net pool impact</span>
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            ungrantedSumRupees < 0 ? 'text-red-600' : 'text-foreground',
                          )}
                        >
                          {formatRupeesSigned(ungrantedSumRupees)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CONTEXTUAL BANNERS WHEN MOVING AROUND SELECTIONS */}
        {isWgIssuanceBlocked ? (
          hasFinancialsModuleAccess ? (
            <div
              role="alert"
              className="finance-danger flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">
                    Policy issuance is paused across all VANs in {snapshot.groupName} (WG Pool:{' '}
                    {formatRupees(wgPoolBalanceRupees)} &lt; Min Required:{' '}
                    {formatRupees(effectiveMinWgBalanceRupees)})
                  </p>
                  <p className="leading-relaxed">
                    {selectedVanContribution > 0 ? (
                      <>
                        Even though selected{' '}
                        <strong>
                          {friendlyVanName} ({currentMetric.vanId})
                        </strong>{' '}
                        has a positive net contribution of{' '}
                        <strong>{formatRupeesSigned(selectedVanContribution)}</strong>, policy
                        issuance is governed by the central Wallet Group Pool. Recharge at least{' '}
                        <strong>{formatRupees(shortfallRupees)}</strong> to resume issuing policies
                        for <strong>{currentMetric.planName}</strong>.
                      </>
                    ) : (
                      <>
                        Overall Wallet Group Pool balance is below the minimum threshold (
                        {thresholdDescription}). Recharge at least{' '}
                        <strong>{formatRupees(shortfallRupees)}</strong> to resume policy issuance.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 bg-white text-xs text-foreground"
                onClick={() => {
                  setSelectedVan(currentMetric.vanId);
                  router.push(`/${partner}/dashboard/financials`);
                }}
              >
                Recharge in Financials
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          ) : (
            /* Pure Operations user (Financials = No Access): Operational pause banner with ZERO financial numbers and ZERO Request Access CTA */
            <div
              role="status"
              className="finance-warning flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs"
            >
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                <strong>Policy issuance temporarily paused for {currentMetric.planName}:</strong>{' '}
                New policies cannot be issued right now because the central Wallet Group balance is
                awaiting a recharge by your Finance team. Existing policies, endorsements, and
                claims remain active.
              </span>
            </div>
          )
        ) : (
          /* When WG Pool is healthy/above threshold, explain negative/drawdown VANs or shared VANs when selected */
          hasFinancialsModuleAccess &&
          (selectedVanContribution < 0 || selectedVanPurpose === 'issuance-only') && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-upload-required-banner-border bg-upload-required-banner-bg px-4 py-3 text-xs text-upload-required-banner-title"
            >
              <div className="flex items-center gap-2.5">
                <Info className="size-4 shrink-0 text-upload-required-banner-title" />
                <span>
                  <strong>
                    {friendlyVanName} ({currentMetric.vanId}) shows a net issuance drawdown of{' '}
                    {formatRupeesSigned(selectedVanContribution)}:
                  </strong>{' '}
                  Policies under <strong>{currentMetric.planName}</strong> draw from the central{' '}
                  <strong>WG Pool Balance ({formatRupees(wgPoolBalanceRupees)})</strong>. Because
                  the overall WG Pool exceeds the minimum requirement (
                  {formatRupees(effectiveMinWgBalanceRupees)}), policy issuance remains{' '}
                  <strong>Active</strong>.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 bg-white text-xs text-foreground"
                onClick={() => {
                  setSelectedVan(currentMetric.vanId);
                  router.push(`/${partner}/dashboard/financials`);
                }}
              >
                View VAN ledger
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )
        )}

        {/* BOTTOM SECTION: Policy and claim metrics · November 2025 + VAN > Plan Selector + 5-Card Grid */}
        <section className="space-y-3" aria-label="Policy and claim metrics">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold leading-none text-pagination-text">
              Policy and claim metrics · November 2025
            </h2>

            <BrandInlineSelect
              label="VAN"
              value={activePlanKey}
              onChange={setSelectedPlanId}
              options={permittedPlans.flatMap((plan) => {
                const m = PLAN_METRICS[plan.id];
                if (!m) return [];
                const vanObj = snapshot.vans.find((v) => v.id === m.vanId);
                const alias = vanAliases[m.vanId] || m.vanCode;
                const masked = vanObj?.maskedAccount ? ` (${vanObj.maskedAccount})` : '';
                return [
                  {
                    value: plan.id,
                    label: `View: ${alias}${masked} > ${plan.name}`,
                  },
                ];
              })}
            />
          </div>

          {/* Row 1: 3 Cards matching wireframe */}
          <div className="grid w-full gap-4 md:grid-cols-3">
            <ProductionKpiCard
              label="Total policies issued"
              value={String(currentMetric.policiesIssued)}
              prev={String(currentMetric.policiesPrev)}
              delta={currentMetric.policiesDelta}
            />
            <ProductionKpiCard
              label="Gross written premium"
              value={currentMetric.gwp}
              prev={currentMetric.gwpPrev}
              delta={currentMetric.gwpDelta}
            />
            <ProductionKpiCard
              label="Avg premium amount"
              value={currentMetric.avgPremium}
              prev={currentMetric.avgPremiumPrev}
              delta={currentMetric.avgPremiumDelta}
            />
          </div>

          {/* Row 2: 2 Cards matching wireframe */}
          <div className="grid w-full gap-4 md:grid-cols-2">
            <ProductionKpiCard
              label="Avg sum insured value"
              value={currentMetric.avgSumInsured}
              prev={currentMetric.avgSumInsuredPrev}
              delta={currentMetric.avgSumInsuredDelta}
            />
            <ProductionKpiCard
              label="Claims settlement ratio"
              value={currentMetric.claimsRatio}
              prev={currentMetric.claimsRatioPrev}
              delta={currentMetric.claimsRatioDelta}
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`${PAGE_LAYOUT_CLASS} pt-6 pb-2`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title={`Welcome, ${firstName}`} subtitle={welcomeSubtitle} />

        {/* Clean Production Scope Selector using Partner Portal BrandInlineSelect */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {approachMode === 'approach-1' || approachMode === 'engineering-ready' ? (
            <>
              <BrandInlineSelect
                label="View"
                value={activePlanKey}
                onChange={setSelectedPlanId}
                options={permittedPlans.flatMap((plan) => {
                  const m = PLAN_METRICS[plan.id];
                  if (!m) return [];
                  const vanObj = snapshot.vans.find((v) => v.id === m.vanId);
                  const alias = vanAliases[m.vanId] || m.vanCode;
                  const masked = vanObj?.maskedAccount ? ` (${vanObj.maskedAccount})` : '';
                  return [
                    {
                      value: plan.id,
                      label: `${alias}${masked} > ${plan.name}`,
                    },
                  ];
                })}
              />
              <span className="inline-flex items-center gap-1.5 text-xs text-pagination-text-muted">
                <span className="size-2 rounded-full bg-share-policy-primary" />
                Metrics stays consistent on VAN level
              </span>
            </>
          ) : (
            <BrandInlineSelect
              label="View"
              value={activePlanKey}
              onChange={setSelectedPlanId}
              options={permittedPlans.map((plan) => ({
                value: plan.id,
                label: plan.name,
              }))}
            />
          )}
        </div>
      </div>

      {/* Approach 2 Shared-VAN Info Banner (matches wireframe cleanly) */}
      {approachMode === 'approach-2' && isSharedVan && hasVanAccess && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-upload-required-banner-border bg-upload-required-banner-bg px-4 py-2.5 text-xs text-upload-required-banner-title"
        >
          <Info className="size-4 shrink-0 text-upload-required-banner-title" />
          <span>
            Financials metrics remains the same as selected plan shares a common VAN across{' '}
            {sharedPlansOnVan.length} plans
          </span>
        </div>
      )}

      {/* Key Metrics Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-none text-pagination-text">
            Key metrics · October 2026
          </h2>
          <p className="text-sm text-pagination-text-muted">Updated today, 10:42 AM</p>
        </div>

        {approachMode === 'approach-3' ? (
          <>
            {/* Approach 3 Production Layout: 5 Plan-scoped KPI Cards + Separate CD Account Strip */}
            <div className="grid w-full gap-4 md:grid-cols-3 xl:grid-cols-5">
              <ProductionKpiCard
                label="Total policies issued"
                value={String(currentMetric.policiesIssued)}
                prev={String(currentMetric.policiesPrev)}
                delta={currentMetric.policiesDelta}
              />
              <ProductionKpiCard
                label="Gross written premium"
                value={currentMetric.gwp}
                prev={currentMetric.gwpPrev}
                delta={currentMetric.gwpDelta}
              />
              <ProductionKpiCard
                label="Avg premium amount"
                value={currentMetric.avgPremium}
                prev={currentMetric.avgPremiumPrev}
                delta={currentMetric.avgPremiumDelta}
              />
              <ProductionKpiCard
                label="Avg sum insured value"
                value={currentMetric.avgSumInsured}
                prev={currentMetric.avgSumInsuredPrev}
                delta={currentMetric.avgSumInsuredDelta}
              />
              <ProductionKpiCard
                label="Claims settlement ratio"
                value={currentMetric.claimsRatio}
                prev={currentMetric.claimsRatioPrev}
                delta={currentMetric.claimsRatioDelta}
              />
            </div>

            {/* Clean Production CD Account Balance Strip (shown only if user has financial account access) */}
            {hasVanAccess && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-metric-card border border-metric-card-border bg-white px-5 py-3.5 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-icon-select-accent-bg text-share-policy-primary">
                    <Wallet className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        Today’s balance · {friendlyVanName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({currentMetric.vanId} · {parentVan?.maskedAccount})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isSharedVan
                        ? `Shared CD account funding ${sharedPlansOnVan
                            .map((p) =>
                              permittedPlans.some((op) => op.id === p.id) ? p.name : '1 other plan',
                            )
                            .join(' & ')}`
                        : `Dedicated CD account funding ${currentMetric.planName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold tabular-nums text-metric-card-text">
                      {currentMetric.vanBalanceDisplay}
                    </span>
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-xs font-medium',
                        currentMetric.vanBalanceStatus === 'Low'
                          ? 'finance-danger'
                          : 'finance-success',
                      )}
                    >
                      {currentMetric.vanBalanceStatus}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedVan(currentMetric.vanId);
                      router.push(`/${partner}/dashboard/financials`);
                    }}
                  >
                    View financials
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Approach 1 & Approach 2 Production 6-Card Grid (matching Partner Portal MetricCard tokens) */
          <div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ProductionKpiCard
              label="Total policies issued"
              value={String(currentMetric.policiesIssued)}
              prev={String(currentMetric.policiesPrev)}
              delta={currentMetric.policiesDelta}
            />
            <ProductionKpiCard
              label="Gross written premium"
              value={currentMetric.gwp}
              prev={currentMetric.gwpPrev}
              delta={currentMetric.gwpDelta}
            />
            <ProductionKpiCard
              label="Avg premium amount"
              value={currentMetric.avgPremium}
              prev={currentMetric.avgPremiumPrev}
              delta={currentMetric.avgPremiumDelta}
            />
            <div className="finance-kpi rounded-metric-card border border-metric-card-border bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm leading-5 text-pagination-text-muted">
                  Today’s balance
                </span>
                {(approachMode === 'approach-1' || approachMode === 'engineering-ready') && (
                  <span
                    title="Metric stays consistent on VAN level"
                    className="size-2.5 rounded-full bg-share-policy-primary"
                  />
                )}
              </div>
              {hasVanAccess ? (
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-metric-card-value font-semibold leading-9 tabular-nums text-metric-card-text">
                    {currentMetric.vanBalanceDisplay}
                  </span>
                  <span
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-xs font-medium',
                      currentMetric.vanBalanceStatus === 'Low'
                        ? 'finance-danger'
                        : 'finance-success',
                    )}
                  >
                    {currentMetric.vanBalanceStatus}
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-pagination-text-muted">
                    Financials view access required
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      setRequestAccessModal({
                        open: true,
                        defaultModule: 'financials',
                        defaultLevel: 'view',
                        triggerContext: `Triggered from Overview → Today's balance (${friendlyVanName} · ${currentMetric.vanId})`,
                      })
                    }
                  >
                    Request access
                  </Button>
                </div>
              )}
            </div>
            <ProductionKpiCard
              label="Avg sum insured value"
              value={currentMetric.avgSumInsured}
              prev={currentMetric.avgSumInsuredPrev}
              delta={currentMetric.avgSumInsuredDelta}
            />
            <ProductionKpiCard
              label="Claims settlement ratio"
              value={currentMetric.claimsRatio}
              prev={currentMetric.claimsRatioPrev}
              delta={currentMetric.claimsRatioDelta}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ProductionKpiCard({
  label,
  value,
  prev,
  delta,
  hideTrend = false,
}: {
  label: string;
  value: string;
  prev?: string;
  delta?: string;
  hideTrend?: boolean;
}) {
  return (
    <div className="finance-kpi rounded-metric-card border border-metric-card-border bg-white p-5">
      <p className="text-sm leading-5 text-pagination-text-muted">{label}</p>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-metric-card-value font-semibold leading-9 tabular-nums text-metric-card-text">
            {value}
          </span>
          {!hideTrend && prev && (
            <span className="text-xs text-pagination-text-muted">vs {prev}</span>
          )}
        </div>
        {!hideTrend && delta && (
          <span className="finance-success inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium">
            ↑ {delta}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Clean production helper strip on Financials showing which operational plans are linked to the selected VAN.
 * Zero simulator controls upfront.
 */
export function SuggestedApproachFinancialsBar({ activeVanId }: { activeVanId: string }) {
  const {
    snapshot,
    view,
    vanAliases,
    approachMode,
    vanContributionsRupees,
    vanPurposeMap,
    wgMinThresholdConfig,
    wgPoolBalanceRupees,
    effectiveMinWgBalanceRupees,
    isWgIssuanceBlocked,
    isAckoSuperAdmin,
    setAckoThresholdModalOpen,
    wgGraceStatus,
    wgGraceDaysLeft,
    activePartnerWg,
    selectedPartnersV31,
    selectedPlanIdsV31,
    setSelectedPlanIdsV31,
  } = useFinancialWorkspace();
  const [expandedV3, setExpandedV3] = useState(false);

  const targetVan = snapshot.vans.find((v) => v.id === activeVanId) || snapshot.vans[0];
  if (!targetVan) return null;

  const alias = vanAliases[targetVan.id] || targetVan.label;
  const permittedPlanSet = new Set(view.actor.planIds);

  if (approachMode === 'engineering-ready-v3' || approachMode === 'engineering-ready-v3.1') {
    const isV31 = approachMode === 'engineering-ready-v3.1';
    const activeVansInWg = snapshot.vans.slice(0, 3);
    const grantedVanSet = new Set(view.actor.vanIds);
    const isFullWgViewer =
      isAckoSuperAdmin || view.actor.internal || grantedVanSet.size >= activeVansInWg.length;
    const grantedSumRupees = activeVansInWg
      .filter((v) => isFullWgViewer || grantedVanSet.has(v.id))
      .reduce((sum, v) => sum + (vanContributionsRupees[v.id] ?? 0), 0);
    const ungrantedVans = activeVansInWg.filter((v) => !isFullWgViewer && !grantedVanSet.has(v.id));
    const ungrantedSumRupees = ungrantedVans.reduce(
      (sum, v) => sum + (vanContributionsRupees[v.id] ?? 0),
      0,
    );
    const selectedVanContribution = vanContributionsRupees[targetVan.id] ?? 0;
    const selectedVanPurpose = vanPurposeMap[targetVan.id] || 'both';
    const thresholdDescription =
      wgMinThresholdConfig.mode === 'fixed'
        ? `Fixed ₹${wgMinThresholdConfig.fixedAmountRupees.toLocaleString('en-IN')}`
        : `${wgMinThresholdConfig.gwpPercentage}% of Monthly GWP Run-rate`;

    const v3StatusLabel =
      wgGraceStatus === 'grace-expired'
        ? 'Issuance paused'
        : wgGraceStatus === 'grace-active'
          ? `10-day grace (${wgGraceDaysLeft}d left)`
          : wgGraceStatus === 'low-float'
            ? 'Low float'
            : 'Healthy';

    return (
      <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-2xs text-xs">
        {/* Compact single-line header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-sm text-foreground">
              {isV31 ? 'APD Balance:' : `WG Pool Balance (${activePartnerWg.wgName}):`}{' '}
              <span className={wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-foreground'}>
                {formatRupees(wgPoolBalanceRupees)}
              </span>
            </span>
            {!isV31 && (
              <span
                className={cn(
                  'rounded-md border px-2 py-0.5 text-[11px] font-medium',
                  wgGraceStatus === 'grace-expired'
                    ? 'finance-danger'
                    : wgGraceStatus === 'grace-active' || wgGraceStatus === 'low-float'
                      ? 'finance-warning'
                      : 'finance-success',
                )}
              >
                {v3StatusLabel}
              </span>
            )}
            <span className="text-muted-foreground font-mono">
              · {isV31 ? formatVanNumberV31(targetVan.id) : alias} ({targetVan.maskedAccount})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setExpandedV3((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-share-policy-primary transition hover:bg-muted/50"
          >
            {expandedV3 ? (
              <>
                {isV31 ? 'Hide breakdown' : 'Hide pool breakdown'}
                <ChevronUp className="size-3.5" />
              </>
            ) : (
              <>
                {isV31 ? 'View breakdown' : 'View pool breakdown'}
                <ChevronDown className="size-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Expandable details on need basis */}
        {expandedV3 && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {!isV31 && wgGraceStatus === 'grace-active' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-amber-950">
                <strong>10-day grace active ({wgGraceDaysLeft} days left):</strong> Policy issuance
                continues uninterrupted while recharge is in progress.
              </div>
            )}

            {/* Pool Breakdown across VANs */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-pagination-background px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-muted-foreground">Account split:</span>
                {isFullWgViewer ? (
                  activeVansInWg.map((v, idx) => (
                    <span key={v.id} className="inline-flex items-center gap-1.5">
                      {idx > 0 && <span className="text-muted-foreground">+</span>}
                      <span
                        className={cn(
                          'rounded border border-border bg-white px-2 py-0.5 font-medium text-foreground',
                          isV31 && 'font-mono',
                        )}
                      >
                        {isV31 ? formatVanNumberV31(v.id) : vanAliases[v.id] || v.id}:{' '}
                        <strong
                          className={
                            (vanContributionsRupees[v.id] ?? 0) < 0
                              ? 'text-red-600'
                              : 'text-foreground'
                          }
                        >
                          {formatRupeesSigned(vanContributionsRupees[v.id] ?? 0)}
                        </strong>
                      </span>
                    </span>
                  ))
                ) : (
                  <>
                    <span className="rounded border border-border bg-white px-2 py-0.5 font-medium text-foreground">
                      Your accounts (
                      {view.actor.vanIds
                        .map((id) => (isV31 ? formatVanNumberV31(id) : id))
                        .join(', ')}
                      ): <strong>{formatRupeesSigned(grantedSumRupees)}</strong>
                    </span>
                    <span className="text-muted-foreground">+</span>
                    <span className="rounded border border-dashed border-border bg-white px-2 py-0.5 font-medium text-muted-foreground">
                      Other group accounts ({ungrantedVans.length}):{' '}
                      <strong
                        className={ungrantedSumRupees < 0 ? 'text-red-600' : 'text-foreground'}
                      >
                        {formatRupeesSigned(ungrantedSumRupees)}
                      </strong>
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">=</span>
                <span className="rounded border border-share-recipient-border-active/40 bg-segmented-tab-active-bg px-2 py-0.5 font-semibold text-segmented-tab-active-text">
                  {isV31 ? 'APD Balance:' : 'WG Pool:'} {formatRupees(wgPoolBalanceRupees)}
                </span>
              </div>
            </div>

            {/* Selected Account Details & Min Threshold */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">
                  Account usage:{' '}
                  <strong className="text-foreground">
                    {getVanPurposeLabel(selectedVanPurpose)}
                  </strong>{' '}
                  ({formatRupeesSigned(selectedVanContribution)})
                </span>
                <span className="text-muted-foreground">· Linked plans:</span>
                {targetVan.plans.map((p) => {
                  const hasPlan = permittedPlanSet.has(p.id);
                  return (
                    <span
                      key={p.id}
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-medium',
                        hasPlan
                          ? 'border-border bg-muted/50 text-foreground'
                          : 'border-amber-200 bg-amber-50 text-amber-900',
                      )}
                    >
                      {hasPlan ? p.name : 'Shared plan (restricted)'}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Min required:{' '}
                  <strong className="text-foreground">
                    {formatRupees(effectiveMinWgBalanceRupees)}
                  </strong>{' '}
                  ({thresholdDescription})
                </span>
                {(isAckoSuperAdmin || view.actor.internal) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setAckoThresholdModalOpen(true)}
                  >
                    <Settings2 className="size-3.5 text-share-policy-primary" />
                    Edit threshold
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (approachMode === 'engineering-ready-v2') {
    const activeVansInWg = snapshot.vans.slice(0, 3);
    const grantedVanSet = new Set(view.actor.vanIds);
    const isFullWgViewer =
      isAckoSuperAdmin || view.actor.internal || grantedVanSet.size >= activeVansInWg.length;
    const grantedSumRupees = activeVansInWg
      .filter((v) => isFullWgViewer || grantedVanSet.has(v.id))
      .reduce((sum, v) => sum + (vanContributionsRupees[v.id] ?? 0), 0);
    const ungrantedVans = activeVansInWg.filter((v) => !isFullWgViewer && !grantedVanSet.has(v.id));
    const ungrantedSumRupees = ungrantedVans.reduce(
      (sum, v) => sum + (vanContributionsRupees[v.id] ?? 0),
      0,
    );
    const selectedVanContribution = vanContributionsRupees[targetVan.id] ?? 0;
    const selectedVanPurpose = vanPurposeMap[targetVan.id] || 'both';
    const thresholdDescription =
      wgMinThresholdConfig.mode === 'fixed'
        ? `Fixed ₹${wgMinThresholdConfig.fixedAmountRupees.toLocaleString('en-IN')}`
        : `${wgMinThresholdConfig.gwpPercentage}% of Monthly GWP Run-rate (₹${wgMinThresholdConfig.monthlyGwpRunRateRupees.toLocaleString('en-IN')})`;

    return (
      <div className="space-y-3">
        {/* WG Pool vs. VAN Net Contribution Reconciliation Banner */}
        <div className="rounded-xl border border-border bg-white p-4 shadow-2xs space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-sm text-foreground">
                Global WG Pool Balance ({snapshot.groupName}):{' '}
                <span className={wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-foreground'}>
                  {formatRupees(wgPoolBalanceRupees)}
                </span>
              </span>
              <span
                className={cn(
                  'rounded-md border px-2 py-0.5 font-medium',
                  isWgIssuanceBlocked ? 'finance-danger' : 'finance-success',
                )}
              >
                {isWgIssuanceBlocked
                  ? 'Policy Issuance Paused (Below Min WG Threshold)'
                  : 'Policy Issuance Active'}
              </span>
              <span className="rounded-md border border-border bg-pagination-background px-2.5 py-0.5 font-medium text-foreground">
                Min WG Required: <strong>{formatRupees(effectiveMinWgBalanceRupees)}</strong> (
                {thresholdDescription})
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setAckoThresholdModalOpen(true)}
            >
              <Settings2 className="size-3.5 text-share-policy-primary" />
              {isAckoSuperAdmin || view.actor.internal
                ? 'ACKO Admin · Edit Min WG Threshold'
                : 'View Min WG Threshold Rule'}
            </Button>
          </div>

          {/* Scoped vs Full WG Reconciliation Formula */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-pagination-background px-3.5 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-muted-foreground">Pool Reconciliation:</span>
              {isFullWgViewer ? (
                activeVansInWg.map((v, idx) => (
                  <span key={v.id} className="inline-flex items-center gap-1.5">
                    {idx > 0 && <span className="text-muted-foreground">+</span>}
                    <span className="rounded border border-border bg-white px-2 py-0.5 font-medium text-foreground">
                      {vanAliases[v.id] || v.id} ({v.id}):{' '}
                      <strong
                        className={
                          (vanContributionsRupees[v.id] ?? 0) < 0
                            ? 'text-red-600'
                            : 'text-foreground'
                        }
                      >
                        {formatRupeesSigned(vanContributionsRupees[v.id] ?? 0)}
                      </strong>
                    </span>
                  </span>
                ))
              ) : (
                <>
                  <span className="rounded border border-border bg-white px-2 py-0.5 font-medium text-foreground">
                    Your Granted VANs ({view.actor.vanIds.join(', ')}):{' '}
                    <strong>{formatRupeesSigned(grantedSumRupees)}</strong>
                  </span>
                  <span className="text-muted-foreground">+</span>
                  <span className="rounded border border-dashed border-border bg-white px-2 py-0.5 font-medium text-muted-foreground">
                    Other VANs in Wallet Group ({ungrantedVans.length} restricted):{' '}
                    <strong className={ungrantedSumRupees < 0 ? 'text-red-600' : 'text-foreground'}>
                      {formatRupeesSigned(ungrantedSumRupees)}
                    </strong>
                  </span>
                </>
              )}
              <span className="text-muted-foreground">=</span>
              <span className="rounded border border-share-recipient-border-active/40 bg-segmented-tab-active-bg px-2 py-0.5 font-semibold text-segmented-tab-active-text">
                WG Pool: {formatRupees(wgPoolBalanceRupees)}
              </span>
            </div>
          </div>

          {/* Selected VAN Role & Linked Plans Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">
                Selected Account: {targetVan.id} · {alias} ({targetVan.maskedAccount})
              </span>
              <span className="rounded border border-border bg-pagination-background px-2 py-0.5 font-medium text-foreground">
                Role: {getVanPurposeLabel(selectedVanPurpose)} · Net Contribution:{' '}
                <strong
                  className={selectedVanContribution < 0 ? 'text-red-600' : 'text-foreground'}
                >
                  {formatRupeesSigned(selectedVanContribution)}
                </strong>
              </span>
              <span className="text-muted-foreground">· Linked plans:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {targetVan.plans.map((p) => {
                  const hasPlan = permittedPlanSet.has(p.id);
                  return (
                    <span
                      key={p.id}
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-medium',
                        hasPlan
                          ? 'border-border bg-muted/50 text-foreground'
                          : 'border-amber-200 bg-amber-50 text-amber-900',
                      )}
                    >
                      {hasPlan ? p.name : 'Other partner/plan on shared VAN (restricted)'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-2.5 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">
          {targetVan.id} · {alias} ({targetVan.maskedAccount})
        </span>
        <span className="text-muted-foreground">· Linked plans:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {targetVan.plans.map((p) => {
            const hasPlan = permittedPlanSet.has(p.id);
            return (
              <span
                key={p.id}
                className={cn(
                  'rounded-md border px-2 py-0.5 font-medium',
                  hasPlan
                    ? 'border-border bg-muted/50 text-foreground'
                    : 'border-amber-200 bg-amber-50 text-amber-900',
                )}
              >
                {hasPlan ? p.name : 'Other partner/plan on shared VAN (restricted)'}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * All scenario controls, Approach 3 vs 1 vs 2 switcher, and UAM Persona views live EXCLUSIVELY
 * inside the Simulator drawer under the "Approach 3" tab.
 */
export function SuggestedApproachStudio({ onClose }: { onClose?: () => void }) {
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const {
    snapshot,
    view,
    approachMode,
    setApproachMode,
    vanAliases,
    setVanAlias,
    activeSuggestedScenario,
    applySuggestedScenario,
  } = useFinancialWorkspace();

  return (
    <div className="space-y-6 text-foreground">
      {/* Section 1: Active State & Quick Jump */}
      <div className="rounded-xl border border-share-recipient-border-active/30 bg-icon-select-accent-bg/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="finance-primary inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            Approach 3 &amp; Modular UAM Controls
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Viewing as: <strong className="text-foreground">{view.actor.label}</strong> (
            {view.actor.vanIds.length} VANs · {view.ownPlans.length} Plans)
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          All simulator controls live here so the pages themselves (
          <strong className="text-foreground">Overview</strong>,{' '}
          <strong className="text-foreground">Financials</strong>, and{' '}
          <strong className="text-foreground">Settings &gt; Access management</strong>) render clean
          production UI ready for development handoff.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="finance-primary text-xs"
            onClick={() => {
              onClose?.();
              router.push(`/${partner}/dashboard/overview`);
            }}
          >
            <Eye className="size-3.5" />
            View Clean Overview UI
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              onClose?.();
              router.push(`/${partner}/dashboard/settings/access-management`);
            }}
          >
            <Users className="size-3.5" />
            View Clean UAM UI
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              onClose?.();
              router.push(`/${partner}/dashboard/financials`);
            }}
          >
            <FileSpreadsheet className="size-3.5" />
            View Clean Financials UI
          </Button>
        </div>
      </div>

      {/* Section 2: Switch Overview UI Implementation (Approach 3 vs Approach 1 vs Approach 2) */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          1. Overview UI Implementation (Switch to Compare)
        </h4>
        <div className="grid grid-cols-1 gap-2.5">
          {APPROACH_DEFINITIONS.map((app) => {
            const active = approachMode === app.id;
            return (
              <div
                key={app.id}
                onClick={() => setApproachMode(app.id)}
                className={cn(
                  'cursor-pointer rounded-xl border p-3.5 transition',
                  active
                    ? 'border-share-recipient-border-active bg-segmented-tab-active-bg/40 ring-2 ring-share-policy-primary/15'
                    : 'border-border bg-white hover:border-share-recipient-border-active/50',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded border px-2 py-0.5 text-[10px] font-semibold',
                        app.id === 'approach-3' ? 'finance-success' : 'finance-neutral',
                      )}
                    >
                      {app.badge}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{app.title}</span>
                  </div>
                  <CheckCircle2
                    className={cn(
                      'size-4',
                      active ? 'text-share-policy-primary' : 'text-transparent',
                    )}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{app.verdict}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: UAM & Portal Access Hierarchy (Super Admin -> Sub-Admin -> Smaller Access Users) */}
      <div className="space-y-2.5">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            2. Preview Access Views: Super Admin → Sub-Admin → Smaller Access Users
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            1 WG (Eternal) · 3 VANs (VAN-1 has 2 Plans: Zom Gig 1 &amp; 2 · VAN-2 has 1 Plan:
            Blinkit · VAN-3 has 1 Plan: District)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {SUGGESTED_SCENARIOS.map((sc) => {
            const isSelected = activeSuggestedScenario === sc.id;
            return (
              <div
                key={sc.id}
                className={cn(
                  'rounded-xl border p-3.5 transition',
                  isSelected
                    ? 'border-share-recipient-border-active bg-segmented-tab-active-bg/30 shadow-2xs'
                    : 'border-border bg-white',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-segmented-tab-active-bg px-2 py-0.5 text-[11px] font-semibold text-segmented-tab-active-text">
                        {sc.tierLabel}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {sc.userName}
                      </span>
                    </div>
                    <h5 className="mt-1 text-sm font-semibold text-foreground">{sc.title}</h5>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn('h-7 text-xs', isSelected && 'finance-primary')}
                      onClick={() => {
                        applySuggestedScenario(sc.id);
                        onClose?.();
                        router.push(`/${partner}/dashboard/overview`);
                      }}
                    >
                      Overview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        applySuggestedScenario(sc.id);
                        onClose?.();
                        router.push(`/${partner}/dashboard/settings/access-management`);
                      }}
                    >
                      UAM View
                    </Button>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{sc.description}</p>
                <p className="mt-1 text-[11px] font-medium text-share-policy-primary">
                  <strong>UAM View:</strong> {sc.uamExperience}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: VAN Naming Ceremony (Account Aliases) */}
      <div className="rounded-xl border border-border bg-pagination-background p-4 space-y-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag className="size-3.5 text-share-policy-primary" />
            3. VAN Naming Ceremony (Custom Account Names)
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Customize how VAN-1, VAN-2, and VAN-3 are named across Overview, Financials, and UAM.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {snapshot.vans.slice(0, 3).map((v) => (
            <label
              key={v.id}
              className="rounded-lg border border-border bg-white p-2.5 text-xs space-y-1"
            >
              <span className="block font-medium text-foreground">
                {v.id} ({v.maskedAccount})
              </span>
              <Input
                value={vanAliases[v.id] || ''}
                onChange={(e) => setVanAlias(v.id, e.target.value)}
                className="h-7 text-xs"
              />
              <span className="block text-[10px] text-muted-foreground">
                {v.plans.length} {v.plans.length === 1 ? 'Plan' : 'Plans'}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Optional standalone dialog if VAN Naming Ceremony is opened directly. */
export function SuggestedApproachGlobalDialogs() {
  const { snapshot, vanAliases, setVanAlias, namingCeremonyOpen, setNamingCeremonyOpen } =
    useFinancialWorkspace();

  return (
    <Dialog open={namingCeremonyOpen} onOpenChange={setNamingCeremonyOpen}>
      <DialogContent className="max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-share-policy-primary" />
            Account Naming
          </DialogTitle>
          <DialogDescription>
            Assign business-friendly names to your CD accounts (VANs).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {snapshot.vans.slice(0, 3).map((v) => (
            <div key={v.id} className="rounded-xl border border-border p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {v.id} ({v.maskedAccount})
                </span>
                <span className="text-muted-foreground">
                  Linked plans: {v.plans.map((p) => p.name).join(', ')}
                </span>
              </div>
              <Input
                value={vanAliases[v.id] || ''}
                onChange={(e) => setVanAlias(v.id, e.target.value)}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button className="finance-primary" onClick={() => setNamingCeremonyOpen(false)}>
            <ShieldCheck className="size-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
