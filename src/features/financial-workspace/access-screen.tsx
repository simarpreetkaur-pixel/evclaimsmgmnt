'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Plus,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeading, PAGE_LAYOUT_CLASS } from '@/components/molecules/PageHeading';
import DataTable from '@/components/molecules/DataTable';
import SegmentedTabs from '@/components/molecules/SegmentedTabs';
import UnderlineTabs from '@/components/molecules/UnderlineTabs';
import { cn } from '@/lib/utils';
import { BrandSegmentedControl, Picker, StatusPill } from './common';
import {
  formatVanNumberV31,
  useFinancialWorkspace,
  V31_MODULE_SUBSECTIONS,
  V31_PLAN_CATALOG,
  V31_VAN_CATALOG,
  type AccessLevel,
  type ModuleId,
  type PartnerRoleDefinition,
  type VanPurpose,
} from './provider';
import { AckoMinWgBalancePanel, detectRoleConflicts, MODULE_METADATA } from './engineering-ready';
import type { AccessUser, Capability } from './domain';

const PERMISSION_LABELS: Partial<Record<Capability, string>> = {
  view: 'View balances and statements',
  export: 'Download statements',
  dispute: 'Raise disputes',
  'manage-access': 'Manage users within granted scope',
};

const ACCESS_ROLE_PRESETS: {
  id: string;
  label: string;
  description: string;
  mode: 'full' | 'ops-only' | 'finance-only' | 'view-only';
}[] = [
  {
    id: 'full',
    label: 'Full access (Accounts & plans)',
    description: 'All financial accounts and operational plans in your scope',
    mode: 'full',
  },
  {
    id: 'ops-only',
    label: 'Operations only (Plans & policies)',
    description: 'Operational plans only, without financial account balances',
    mode: 'ops-only',
  },
  {
    id: 'finance-only',
    label: 'Finance only (Accounts & ledger)',
    description: 'Financial accounts and statements only, without policy or claim PII',
    mode: 'finance-only',
  },
  {
    id: 'view-only',
    label: 'Read-only viewer',
    description: 'View balances and plans without export or dispute permissions',
    mode: 'view-only',
  },
];

function getRoleBadgeLabel(u: AccessUser): { label: string; className: string } {
  if (u.capabilities.includes('manage-access') && u.vanIds.length >= 3) {
    return {
      label: 'Super Admin',
      className:
        'bg-segmented-tab-active-bg text-segmented-tab-active-text border-share-recipient-border-active/30',
    };
  }
  if (u.capabilities.includes('manage-access')) {
    return {
      label: 'Sub-Admin',
      className:
        'bg-icon-select-accent-bg text-share-policy-primary border-share-recipient-border-active/25',
    };
  }
  if (u.vanIds.length > 0 && u.planIds.length === 0) {
    return { label: 'Finance only', className: 'finance-warning' };
  }
  if (u.planIds.length > 0 && u.vanIds.length === 0) {
    return { label: 'Operations only', className: 'finance-success' };
  }
  if (
    u.capabilities.includes('view') &&
    !u.capabilities.includes('export') &&
    !u.capabilities.includes('dispute')
  ) {
    return { label: 'Viewer', className: 'finance-neutral' };
  }
  return { label: 'Finance & Ops', className: 'finance-neutral' };
}

export function AccessManagement() {
  const {
    snapshot,
    view,
    execute,
    pending,
    error,
    clearError,
    unknownOutcome,
    checkOutcome,
    vanAliases,
    setVanAlias,
    vanPurposeMap,
    setVanPurpose,
    approachMode,
    partnerRoles,
    savePartnerRole,
    userRoleAssignments,
    activeRoleDefinition,
    assignUserRoleAndScope,
    revokeUserAccess,
    bulkOnboardUsers,
    accessRequests,
    resolveAccessRequest,
    setRequestAccessModal,
    uamActiveTab,
    setUamActiveTab,
    isAckoSuperAdmin,
    activePartnerWg,
    setManagePartnersViewActive,
  } = useFinancialWorkspace();
  const { partner } = useParams<{ partner: string }>();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<AccessUser | null>(null);
  const [draftRoleId, setDraftRoleId] = useState<string>('role-operations');
  const [reason, setReason] = useState('');
  const [review, setReview] = useState(false);
  const [vanSearchV31, setVanSearchV31] = useState('');
  const [planSearchV31, setPlanSearchV31] = useState('');

  // Role Builder state (for Engineering Ready Version)
  const [editingRole, setEditingRole] = useState<PartnerRoleDefinition | null>(null);

  // Bulk Upload state (for Engineering Ready Version)
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'batch-emails' | 'csv-multi'>('batch-emails');
  const [bulkRoleId, setBulkRoleId] = useState<string>('role-operations');
  const [bulkVans, setBulkVans] = useState<string[]>(['VAN-1']);
  const [bulkPlans, setBulkPlans] = useState<string[]>(['gig-1', 'gig-2']);
  const [bulkEmailsText, setBulkEmailsText] = useState<string>(
    'aditi.verma@zomato.com\nrohan.kulkarni@zomato.com\npriya.nair@zomato.com\nsiddharth.joshi@zomato.com\nkavita.reddy@zomato.com',
  );
  const [bulkSimOutcome, setBulkSimOutcome] = useState<'all-valid' | 'partial' | 'all-fail'>(
    'all-valid',
  );

  const canManage = view.actor.capabilities.includes('manage-access') || isAckoSuperAdmin;
  const isEngV31 = approachMode === 'engineering-ready-v3.1';
  const isEngV3 = approachMode === 'engineering-ready-v3' || isEngV31;
  const isEngReady =
    approachMode === 'engineering-ready' || approachMode === 'engineering-ready-v2' || isEngV3;
  const isEngV2 = approachMode === 'engineering-ready-v2' || isEngV3;
  const pendingRequestsCount = accessRequests.filter((r) => r.status === 'pending').length;

  const allPlanLookup = new Map(
    snapshot.vans.flatMap((v) => v.plans.map((p) => [p.id, { plan: p, van: v }])),
  );

  const users = snapshot.users.filter(
    (u) =>
      !['reconciliation', 'approver'].includes(u.id) &&
      (!search || `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())),
  );

  const isWithinAdminScope = (target: AccessUser) =>
    isAckoSuperAdmin ||
    (target.vanIds.every((id) => view.actor.vanIds.includes(id)) &&
      target.planIds.every((id) => view.actor.planIds.includes(id)));

  const toggle = (field: 'vanIds' | 'planIds' | 'capabilities', id: string, on: boolean) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            [field]: on ? [...new Set([...d[field], id])] : d[field].filter((v) => v !== id),
          }
        : d,
    );

  const applyPreset = (mode: 'full' | 'ops-only' | 'finance-only' | 'view-only') => {
    if (!draft) return;
    const myVans = snapshot.vans.filter((v) => view.actor.vanIds.includes(v.id)).map((v) => v.id);
    const myPlans = view.ownPlans.map((p) => p.id);
    if (mode === 'full') {
      setDraft({
        ...draft,
        vanIds: myVans,
        planIds: myPlans,
        capabilities: (['view', 'export', 'dispute'] as Capability[]).filter((c) =>
          view.actor.capabilities.includes(c),
        ),
      });
    } else if (mode === 'ops-only') {
      setDraft({
        ...draft,
        vanIds: [],
        planIds: myPlans,
        capabilities: [],
      });
    } else if (mode === 'finance-only') {
      setDraft({
        ...draft,
        vanIds: myVans,
        planIds: [],
        capabilities: (['view', 'export', 'dispute'] as Capability[]).filter((c) =>
          view.actor.capabilities.includes(c),
        ),
      });
    } else if (mode === 'view-only') {
      setDraft({
        ...draft,
        vanIds: myVans.slice(0, 1),
        planIds: myPlans.slice(0, 1),
        capabilities: view.actor.capabilities.includes('view') ? ['view'] : [],
      });
    }
  };

  const edit = (user: AccessUser) => {
    clearError();
    setDraft(structuredClone(user));
    setDraftRoleId(userRoleAssignments[user.id] || 'role-operations');
    setReview(false);
    setReason('');
  };

  const sharedVanWarnings = draft
    ? snapshot.vans
        .filter((v) => draft.vanIds.includes(v.id) && v.plans.length > 1)
        .map((v) => {
          const grantedPlans = v.plans.filter((p) => draft.planIds.includes(p.id));
          const omittedPlans = v.plans.filter((p) => !draft.planIds.includes(p.id));
          return { van: v, grantedPlans, omittedPlans };
        })
        .filter((item) => item.omittedPlans.length > 0)
    : [];

  const currentUserRecord = snapshot.users.find((u) => u.id === view.actor.id);
  const orgAdmins = snapshot.users.filter((u) => u.capabilities.includes('manage-access'));
  const selectedDraftRole = partnerRoles.find((r) => r.id === draftRoleId) || partnerRoles[0];
  const draftRoleConflicts = detectRoleConflicts(selectedDraftRole.permissions, approachMode);

  const parsedBulkEmails = bulkEmailsText
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <div className={`${PAGE_LAYOUT_CLASS} pt-6 pb-10`}>
      <PageHeading
        title={isEngReady && !canManage ? 'My access' : 'Settings'}
        subtitle={
          isEngV3
            ? canManage
              ? 'Manage team members, roles, and account settings.'
              : 'View your assigned role and permitted accounts.'
            : canManage
              ? isEngV2
                ? 'Define partner roles, map WG > VAN > PLAN scopes, bulk-onboard users and inspect WG issuance thresholds.'
                : 'Define partner roles, map WG > VAN > PLAN scopes, bulk-onboard users and review access requests.'
              : isEngV2
                ? 'View your assigned role, module permissions, WG > VAN > PLAN scope and organization administrators.'
                : 'View your assigned role, module permissions, WG > VAN > PLAN scope and request additional access.'
        }
      />
      <nav className="flex gap-6 border-b border-border pb-3 text-sm">
        <strong className="text-share-policy-primary">Access management</strong>
        {canManage && (!isEngV31 || isAckoSuperAdmin) && (
          <Link href={`/${partner}/dashboard/settings/configure-metrics`}>Configure metrics</Link>
        )}
      </nav>

      {!canManage ? (
        /* ============================================================================
         * SMALLER-ACCESS USER SELF-SERVICE VIEW (Zero Request Access CTAs in v2.0)
         * ============================================================================ */
        <div className="space-y-6">
          {/* User Profile & Role Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-metric-card border border-border bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-icon-select-accent-bg text-sm font-semibold text-share-policy-primary">
                {view.actor.label.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base font-semibold text-foreground">{view.actor.label}</h2>
                  <span className="rounded-md border border-share-recipient-border-active/30 bg-segmented-tab-active-bg px-2.5 py-0.5 text-xs font-medium text-segmented-tab-active-text">
                    Role: {activeRoleDefinition.name}
                  </span>
                  <StatusPill status="active" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {currentUserRecord?.email || `${view.actor.id}@eternal.com`} ·{' '}
                  {snapshot.groupName} wallet group
                </p>
              </div>
            </div>
            {!isEngV2 && (
              <div className="flex items-center gap-3">
                <Button
                  className="finance-primary text-xs"
                  onClick={() =>
                    setRequestAccessModal({
                      open: true,
                      defaultModule:
                        activeRoleDefinition.permissions.financials === 'none'
                          ? 'financials'
                          : 'manual-refunds',
                      defaultLevel: 'edit',
                      triggerContext: 'Requested from My Access & Permissions page',
                    })
                  }
                >
                  <Lock className="size-3.5" />
                  Request additional access
                </Button>
              </div>
            )}
          </div>

          {/* Module-by-Module Permission Matrix for Current Role */}
          {isEngReady && (
            <section className="rounded-metric-card border border-border bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Module permissions for your role ({activeRoleDefinition.name})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Modules marked &ldquo;No access&rdquo; are hidden from your sidebar navigation.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-4">
                {MODULE_METADATA.map((mod) => {
                  const lvl = activeRoleDefinition.permissions[mod.id];
                  return (
                    <div
                      key={mod.id}
                      className={cn(
                        'rounded-lg border p-3 text-xs',
                        lvl === 'none'
                          ? 'border-dashed border-border bg-muted/40 text-muted-foreground'
                          : 'border-border bg-white text-foreground',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{mod.label}</span>
                        <span
                          className={cn(
                            'rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase',
                            lvl === 'edit'
                              ? 'border-share-recipient-border-active/30 bg-segmented-tab-active-bg text-segmented-tab-active-text'
                              : lvl === 'view'
                                ? 'finance-success'
                                : 'finance-neutral',
                          )}
                        >
                          {lvl === 'edit'
                            ? 'View & Edit'
                            : lvl === 'view'
                              ? 'View Only'
                              : 'No Access'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {lvl === 'edit'
                          ? mod.editLabel
                          : lvl === 'view'
                            ? mod.viewLabel
                            : 'Hidden from sidebar'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 2-Column Breakdown: Operational Plans vs Financial Accounts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Assigned WG &gt; VAN &gt; PLAN scope
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Plans enabled for your operational workflows
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                  {view.ownPlans.length} {view.ownPlans.length === 1 ? 'plan' : 'plans'}
                </span>
              </div>

              {view.ownPlans.length > 0 ? (
                <div className="space-y-2.5">
                  {view.ownPlans.map((plan) => {
                    const parentVan = snapshot.vans.find((v) =>
                      v.plans.some((vp) => vp.id === plan.id),
                    );
                    const vanAlias = parentVan ? vanAliases[parentVan.id] || parentVan.label : '';
                    return (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3.5 text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {parentVan
                                ? `${vanAlias} (${parentVan.maskedAccount}) > ${plan.name}`
                                : `Partner: ${plan.partner}`}
                            </p>
                          </div>
                        </div>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <Lock className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">No operational plans assigned</p>
                      <p className="mt-0.5">
                        Your account is configured for financial ledger operations only.
                      </p>
                    </div>
                  </div>
                  {!isEngV2 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 text-xs"
                      onClick={() =>
                        setRequestAccessModal({
                          open: true,
                          defaultModule: 'policies',
                          defaultLevel: 'view',
                          triggerContext: 'Requesting Operational Plan access',
                        })
                      }
                    >
                      Request plans
                    </Button>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-metric-card border border-border bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-icon-select-accent-bg text-share-policy-primary">
                    <Wallet className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Financial accounts (VANs)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      CD accounts enabled for balance &amp; ledger visibility
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                  {view.actor.vanIds.length}{' '}
                  {view.actor.vanIds.length === 1 ? 'account' : 'accounts'}
                </span>
              </div>

              {view.actor.vanIds.length > 0 ? (
                <div className="space-y-3">
                  {snapshot.vans
                    .filter((v) => view.actor.vanIds.includes(v.id))
                    .map((van) => {
                      const alias = vanAliases[van.id] || van.label;
                      const ungrantedPlansOnVan = van.plans.filter(
                        (p) => !view.actor.planIds.includes(p.id),
                      );
                      return (
                        <div
                          key={van.id}
                          className="rounded-lg border border-border p-3.5 text-sm space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="size-4 text-share-policy-primary shrink-0" />
                              <span className="font-medium text-foreground">
                                {alias} ({van.maskedAccount})
                              </span>
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">
                              {van.id}
                            </span>
                          </div>
                          {ungrantedPlansOnVan.length > 0 && view.ownPlans.length > 0 && (
                            <p className="finance-warning rounded border px-2.5 py-1.5 text-xs">
                              Shared account: {van.id} also funds {ungrantedPlansOnVan.length} other{' '}
                              {ungrantedPlansOnVan.length === 1 ? 'plan' : 'plans'} outside your
                              operational scope.
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <Lock className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">No financial accounts assigned</p>
                      <p className="mt-0.5">
                        CD account balances and ledger statements are not included in your role.
                      </p>
                    </div>
                  </div>
                  {!isEngV2 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 text-xs"
                      onClick={() =>
                        setRequestAccessModal({
                          open: true,
                          defaultModule: 'financials',
                          defaultLevel: 'view',
                          triggerContext: 'Requesting Financial VAN balance visibility',
                        })
                      }
                    >
                      Request access
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Your Submitted Access Requests (Shown only in v1.0; v2.0 has zero Request Access flows) */}
          {isEngReady && !isEngV2 && (
            <section className="rounded-xl border border-border bg-white p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Your access requests</h3>
              {accessRequests.filter((r) => r.requesterId === view.actor.id).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  You have not submitted any access requests yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {accessRequests
                    .filter((r) => r.requesterId === view.actor.id)
                    .map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{req.id}</span> · Requested{' '}
                          <strong>
                            {req.requestedModules.map((m) => `${m.module} (${m.level})`).join(', ')}
                          </strong>{' '}
                          on {req.requestedVanIds.join(', ')}
                          <p className="mt-0.5 text-muted-foreground">{req.reason}</p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 font-semibold capitalize',
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : req.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800',
                          )}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}

          {/* Organization Administrators Contact List */}
          <section className="rounded-xl border border-border bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <UserCheck className="size-4 text-share-policy-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {isEngV2
                  ? 'Organization administrators who manage your role & scope'
                  : 'Administrators who can approve your requests'}
              </h3>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {orgAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-foreground">{admin.name}</p>
                    <p className="text-muted-foreground">{admin.email}</p>
                  </div>
                  <span className="rounded border border-border bg-muted/40 px-2 py-0.5 font-medium">
                    {admin.vanIds.length} VANs · {admin.planIds.length} plans
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ============================================================================
         * SUPER ADMIN & DELEGATED SUB-ADMIN VIEW
         * ============================================================================ */
        <>
          {isEngV3 && isAckoSuperAdmin && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-share-recipient-border-active/40 bg-segmented-tab-active-bg/35 px-5 py-3 text-xs text-foreground">
              <div className="flex items-center gap-2.5">
                <Building2 className="size-4 text-share-policy-primary shrink-0" />
                <span>
                  <strong>
                    ACKO Super Admin · Managing {activePartnerWg.wgName} ({activePartnerWg.wgId})
                  </strong>
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 bg-white text-xs"
                onClick={() => setManagePartnersViewActive(true)}
              >
                Switch partner
              </Button>
            </div>
          )}

          {/* Admin Scope Strip (Hidden in v3.0 to keep Settings clean and uncluttered) */}
          {!isEngV3 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-5 py-3.5 text-sm shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Shield className="size-4 text-share-policy-primary shrink-0" />
                <span>
                  <strong>Your administrative scope:</strong>{' '}
                  {view.actor.vanIds.length >= 3
                    ? `Full organization workspace (${view.actor.vanIds.length} financial accounts · ${view.ownPlans.length} operational plans)`
                    : `Delegated scope (${view.actor.vanIds
                        .map((id) => `${vanAliases[id] || id} (${id})`)
                        .join(', ')} · ${view.ownPlans.map((p) => p.name).join(', ')})`}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                You can grant or edit access only within your own assigned accounts and plans.
              </span>
            </div>
          )}

          {/* Engineering-Ready UAM Sub-Tabs using Partner Portal UnderlineTabs */}
          {isEngReady && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-metric-card border border-border bg-white px-4">
              <UnderlineTabs
                variant="flush"
                value={
                  isEngV31 && uamActiveTab === 'van-naming'
                    ? 'users'
                    : isEngV2 && uamActiveTab === 'requests'
                      ? 'wg-threshold'
                      : uamActiveTab
                }
                onValueChange={(v) =>
                  setUamActiveTab(
                    v as 'users' | 'roles' | 'requests' | 'van-naming' | 'wg-threshold',
                  )
                }
                tabs={
                  isEngV31
                    ? [
                        { value: 'users', label: `Team members (${users.length})` },
                        { value: 'roles', label: `Roles (${partnerRoles.length})` },
                        ...(isAckoSuperAdmin
                          ? [
                              {
                                value: 'wg-threshold',
                                label: 'Balance threshold',
                              },
                            ]
                          : []),
                      ]
                    : isEngV3
                      ? [
                          { value: 'users', label: `Team members (${users.length})` },
                          { value: 'roles', label: `Roles (${partnerRoles.length})` },
                          { value: 'van-naming', label: 'Account names' },
                          ...(isAckoSuperAdmin
                            ? [
                                {
                                  value: 'wg-threshold',
                                  label: 'Balance threshold',
                                },
                              ]
                            : []),
                        ]
                      : isEngV2
                        ? [
                            { value: 'users', label: `Users & Scope (${users.length})` },
                            {
                              value: 'roles',
                              label: `Roles & Permissions (${partnerRoles.length})`,
                            },
                            { value: 'van-naming', label: 'Account Naming & VAN Purpose' },
                            {
                              value: 'wg-threshold',
                              label: 'WG Issuance Threshold (ACKO Admin)',
                            },
                          ]
                        : [
                            { value: 'users', label: `Users & Scope (${users.length})` },
                            {
                              value: 'roles',
                              label: `Roles & Permissions (${partnerRoles.length})`,
                            },
                            {
                              value: 'requests',
                              label: `Access Requests (${pendingRequestsCount} pending)`,
                            },
                            { value: 'van-naming', label: 'Account Naming (VAN Setup)' },
                          ]
                }
              />
              <div className="flex items-center gap-2 py-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 bg-white text-xs"
                  onClick={() => setBulkOpen(true)}
                >
                  <Upload className="size-3.5" />
                  {isEngV3 ? 'Bulk upload' : 'Bulk upload users (Up to 200)'}
                </Button>
                <Button
                  size="sm"
                  className="h-8 finance-primary text-xs"
                  onClick={() =>
                    edit({
                      id: `user-${snapshot.revision}`,
                      name: '',
                      email: '',
                      status: 'active',
                      vanIds: ['VAN-1'],
                      planIds: ['gig-1'],
                      capabilities: ['view'],
                    })
                  }
                >
                  <Plus className="size-3.5" />
                  Invite user
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: ROLES & PERMISSIONS BUILDER + CONFLICT ENGINE */}
          {isEngReady && uamActiveTab === 'roles' ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-metric-card border border-border bg-white p-5">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {isEngV3
                      ? 'User roles'
                      : 'Step 1: Define Reusable Partner Roles & Module Permissions'}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isEngV3
                      ? 'Choose what each role can view or edit across the portal.'
                      : 'Each role defines No Access, View Only, or View & Edit per module. When mapping users (Step 2), you assign a Role + their permitted WG > VAN > PLAN scope.'}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="finance-primary text-xs"
                  onClick={() =>
                    setEditingRole({
                      id: `role-custom-${Date.now()}`,
                      name: 'Custom Role',
                      description: 'Custom role for team members.',
                      userCount: 0,
                      permissions: {
                        overview: 'view',
                        policies: 'edit',
                        claims: 'edit',
                        financials: 'none',
                        'manual-refunds': 'none',
                        reports: 'none',
                        settings: 'none',
                      },
                      updatedAt: 'Just now',
                    })
                  }
                >
                  <Plus className="size-3.5" />
                  Create custom role
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {partnerRoles.map((rDef) => {
                  const conflicts = detectRoleConflicts(rDef.permissions, approachMode);
                  return (
                    <div
                      key={rDef.id}
                      className="flex flex-col justify-between rounded-metric-card border border-border bg-white p-5 shadow-2xs space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-foreground">{rDef.name}</h3>
                              {rDef.isSystemTemplate && !isEngV3 && (
                                <span className="finance-neutral rounded border px-2 py-0.5 text-[10px] font-medium">
                                  Default template
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {rDef.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setEditingRole(structuredClone(rDef))}
                          >
                            {isEngV3 ? 'Configure role' : 'Configure matrix'}
                          </Button>
                        </div>

                        {/* Module Permission Pills */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2">
                          {MODULE_METADATA.map((m) => {
                            const lvl = rDef.permissions[m.id];
                            return (
                              <div
                                key={m.id}
                                className="flex items-center justify-between rounded-md border border-border bg-pagination-background px-2.5 py-1 text-[11px]"
                              >
                                <span className="text-foreground truncate">{m.label}</span>
                                <span
                                  className={cn(
                                    'font-medium',
                                    lvl === 'edit'
                                      ? 'text-share-policy-primary'
                                      : lvl === 'view'
                                        ? 'text-endorse-policy-badge-success-text'
                                        : 'text-muted-foreground',
                                  )}
                                >
                                  {lvl === 'edit'
                                    ? 'View & Edit'
                                    : lvl === 'view'
                                      ? 'View'
                                      : 'No access'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Conflict Detection Banner on Card (Hidden in v3.1) */}
                        {!isEngV31 && conflicts.length > 0 && (
                          <div className="finance-warning rounded-lg border p-3 text-xs space-y-1">
                            <p className="font-semibold flex items-center gap-1.5">
                              <AlertTriangle className="size-3.5 shrink-0" />
                              {conflicts.length} workflow{' '}
                              {conflicts.length === 1 ? 'note' : 'notes'}
                            </p>
                            <p className="text-[11px] leading-relaxed">
                              {conflicts[0].title} — click{' '}
                              <strong>{isEngV3 ? 'Configure role' : 'Configure matrix'}</strong> to
                              review.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>Updated {rDef.updatedAt}</span>
                        <span>
                          Assigned to{' '}
                          <strong className="text-foreground">
                            {
                              Object.values(userRoleAssignments).filter((id) => id === rDef.id)
                                .length
                            }{' '}
                            users
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isEngReady && uamActiveTab === 'requests' ? (
            /* TAB 3: ACCESS REQUESTS & APPROVAL QUEUE */
            <div className="space-y-4">
              <div className="rounded-metric-card border border-border bg-white p-5">
                <h2 className="text-base font-semibold text-foreground">
                  Access Requests Queue ({pendingRequestsCount} Pending Approval)
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Review requests raised when users encounter a restricted module or need View &amp;
                  Edit permissions across VANs and Plans.
                </p>
              </div>

              <div className="space-y-3">
                {accessRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-metric-card border border-border bg-white p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-segmented-tab-active-bg px-2 py-0.5 font-mono text-xs font-semibold text-segmented-tab-active-text">
                            {req.id}
                          </span>
                          <h3 className="text-sm font-semibold text-foreground">
                            {req.requesterName}{' '}
                            <span className="font-normal text-muted-foreground">
                              ({req.requesterEmail})
                            </span>
                          </h3>
                          <span className="finance-neutral rounded border px-2 py-0.5 text-[11px] font-medium">
                            Current Role: {req.currentRoleName}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-share-policy-primary font-medium">
                          {req.triggerContext} · {req.createdAt}
                        </p>
                      </div>

                      <StatusPill
                        status={
                          req.status === 'pending'
                            ? 'pending'
                            : req.status === 'rejected'
                              ? 'rejected'
                              : 'approved'
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-pagination-background p-3.5 text-xs md:grid-cols-3">
                      <div>
                        <span className="block font-semibold text-foreground">
                          Requested Modules &amp; Level:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {req.requestedModules.map((m) => (
                            <span
                              key={m.module}
                              className="rounded border border-share-recipient-border-active/30 bg-segmented-tab-active-bg px-2 py-0.5 text-[11px] font-medium text-segmented-tab-active-text"
                            >
                              {m.module} ({m.level === 'edit' ? 'View & Edit' : 'View Only'})
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="block font-semibold text-foreground">
                          Requested WG &gt; VAN &gt; PLAN Scope:
                        </span>
                        <p className="mt-1 text-foreground">
                          VANs:{' '}
                          {req.requestedVanIds
                            .map((id) => `${vanAliases[id] || id} (${id})`)
                            .join(', ')}{' '}
                          · Plans: {req.requestedPlanIds.join(', ')}
                        </p>
                      </div>
                      <div>
                        <span className="block font-semibold text-foreground">
                          Business Justification:
                        </span>
                        <p className="mt-1 text-muted-foreground italic">
                          &ldquo;{req.reason}&rdquo;
                        </p>
                      </div>
                    </div>

                    {req.status === 'pending' ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">
                          Approving will immediately update {req.requesterName}’s module matrix and
                          VAN/Plan scope.
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="finance-primary text-xs"
                            onClick={() =>
                              resolveAccessRequest(
                                req.id,
                                'approved',
                                'Approved full requested module and VAN/Plan access.',
                              )
                            }
                          >
                            <Check className="size-3.5" />
                            Approve as requested
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() =>
                              resolveAccessRequest(
                                req.id,
                                'modified',
                                'Modified to View-only access on requested modules.',
                              )
                            }
                          >
                            Modify &amp; Approve (View Only)
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            onClick={() =>
                              resolveAccessRequest(
                                req.id,
                                'rejected',
                                'Declined: Please route refund bank changes through Finance team.',
                              )
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Resolved by <strong className="text-foreground">{req.resolvedBy}</strong>:{' '}
                        {req.resolutionNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : isEngV2 && (uamActiveTab === 'wg-threshold' || uamActiveTab === 'requests') ? (
            /* TAB 4 (v2.0): ACKO SUPER ADMIN MINIMUM WG BALANCE REQUIREMENT */
            <div className="rounded-metric-card border border-border bg-white p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Minimum Wallet Group (WG) Balance Requirement · ACKO Super Admin Guardrail
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  In Engineering Ready v2.0, all VANs contribute to and draw from the central{' '}
                  <strong>WG Pool Balance</strong>. ACKO Super Admin defines the minimum WG balance
                  requirement as either a <strong>% of Monthly GWP Run-rate</strong> or a{' '}
                  <strong>Fixed ₹ Amount</strong> beyond which policy issuance is paused across all
                  VANs until recharged.
                </p>
              </div>
              <AckoMinWgBalancePanel />
            </div>
          ) : isEngReady && uamActiveTab === 'van-naming' ? (
            /* TAB 3/4: ACCOUNT NAMES & PURPOSE SETUP */
            <div className="rounded-metric-card border border-border bg-white p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {isEngV3 ? 'Account names' : 'Account Naming & WG > VAN > PLAN Hierarchy Setup'}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isEngV3
                    ? 'Set display names and usage for your financial accounts.'
                    : `Standardizing on WG > VAN > PLAN > POLICY across the Partner Portal requires relatable business names for each Acko Virtual Account Number (VAN). Every selector displays Friendly Name (•••• 1041) > Plan Name.${
                        isEngV2
                          ? ' You can also tag whether a VAN is used for Deposits, Policy Issuance, or both.'
                          : ''
                      }`}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {snapshot.vans.slice(0, 3).map((v, idx) => (
                  <div
                    key={v.id}
                    className="rounded-xl border border-border bg-pagination-background p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded bg-segmented-tab-active-bg px-2 py-0.5 font-mono font-semibold text-segmented-tab-active-text">
                        {v.id} · {v.maskedAccount}
                      </span>
                      <span className="font-medium text-muted-foreground">
                        {idx === 0 ? '2 linked plans' : '1 linked plan'}
                      </span>
                    </div>
                    <label className="block text-xs font-medium text-foreground">
                      {isEngV3 ? 'Account display name' : 'Friendly Wallet Name'}
                      <Input
                        className="mt-1 bg-white text-sm"
                        value={vanAliases[v.id] || ''}
                        onChange={(e) => setVanAlias(v.id, e.target.value)}
                      />
                    </label>
                    {isEngV2 && (
                      <div className="space-y-1 text-xs">
                        <span className="block font-medium text-foreground">
                          {isEngV3 ? 'Used for' : 'VAN Operational Role in WG Pool'}
                        </span>
                        <BrandSegmentedControl<VanPurpose>
                          value={vanPurposeMap[v.id] || 'both'}
                          onChange={(purpose) => setVanPurpose(v.id, purpose)}
                          options={[
                            { value: 'both', label: 'Both' },
                            {
                              value: 'deposit-only',
                              label: isEngV3 ? 'Deposits' : 'Deposit VAN',
                            },
                            {
                              value: 'issuance-only',
                              label: isEngV3 ? 'Issuance' : 'Issuance VAN',
                            },
                          ]}
                        />
                      </div>
                    )}
                    {isEngV3 ? (
                      <p className="text-[11px] text-muted-foreground">
                        Linked plans: {v.plans.map((p) => p.name).join(', ')}
                      </p>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Selector preview:</span>
                        {v.plans.map((p) => (
                          <p
                            key={p.id}
                            className="mt-1 rounded border border-border bg-white px-2.5 py-1 font-medium text-foreground"
                          >
                            {vanAliases[v.id] || v.label} ({v.maskedAccount}) &gt; {p.name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* TAB 1 (AND DEFAULT FOR APPROACH 1/2/3): USERS & SCOPE DIRECTORY */
            <>
              {!isEngReady && (
                <>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {[
                      [
                        'Financial access',
                        'Wallet group → specific VANs → view, export or dispute.',
                      ],
                      [
                        'Operational access',
                        'Specific plans → policy, claims and manual refund records.',
                      ],
                      [
                        'Administration',
                        'Grant only your own scope. A different admin must change your access.',
                      ],
                    ].map(([title, body]) => (
                      <div className="rounded-lg border border-border bg-white p-4" key={title}>
                        <h2 className="font-semibold">{title}</h2>
                        <p className="mt-2 text-muted-foreground">{body}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between gap-3">
                    <Input
                      placeholder="Search people"
                      aria-label="Search people"
                      className="max-w-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button
                      className="finance-primary"
                      onClick={() =>
                        edit({
                          id: `user-${snapshot.revision}`,
                          name: '',
                          email: '',
                          status: 'active',
                          vanIds: [],
                          planIds: [],
                          capabilities: [],
                        })
                      }
                    >
                      Invite user
                    </Button>
                  </div>
                </>
              )}

              {isEngReady && (
                <div className="flex justify-between gap-3">
                  <Input
                    placeholder="Search users by name or email"
                    aria-label="Search people"
                    className="max-w-sm bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <span className="self-center text-xs text-muted-foreground">
                    Showing {users.length} users mapped across {partnerRoles.length} defined roles
                  </span>
                </div>
              )}

              <DataTable<AccessUser>
                data={users}
                getRowId={(u) => u.id}
                columns={[
                  {
                    id: 'name',
                    header: 'USER',
                    cell: (u) => {
                      const assignedRole = partnerRoles.find(
                        (r) => r.id === userRoleAssignments[u.id],
                      );
                      const badge = getRoleBadgeLabel(u);
                      return (
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{u.name}</span>
                            <span
                              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}
                            >
                              {isEngReady && assignedRole ? assignedRole.name : badge.label}
                            </span>
                          </div>
                          <small className="block font-normal text-muted-foreground">
                            {u.email}
                          </small>
                        </div>
                      );
                    },
                  },
                  {
                    id: 'vans',
                    header: 'FINANCIAL ACCOUNTS',
                    cell: (u) => (
                      <div>
                        {isEngV31 ? (
                          u.vanIds.length > 0 ? (
                            <div className="space-y-0.5">
                              <span className="font-mono text-xs font-medium text-foreground">
                                {u.vanIds.map((id) => formatVanNumberV31(id)).join(', ')}
                              </span>
                              <small className="block text-[11px] text-muted-foreground">
                                {u.vanIds.length} {u.vanIds.length === 1 ? 'VAN' : 'VANs'}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )
                        ) : (
                          <>
                            <span className="font-medium">{u.vanIds.join(', ') || 'None'}</span>
                            {u.vanIds.length > 0 && (
                              <small className="block text-xs text-muted-foreground">
                                {u.vanIds
                                  .map((id) => {
                                    const v = snapshot.vans.find((item) => item.id === id);
                                    return `${vanAliases[id] || id}${v ? ` (${v.maskedAccount})` : ''}`;
                                  })
                                  .join(' · ')}
                              </small>
                            )}
                          </>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: 'plans',
                    header: 'OPERATIONAL PLANS',
                    cell: (u) => (
                      <div>
                        <span className="font-medium">
                          {u.planIds.length} {u.planIds.length === 1 ? 'plan' : 'plans'}
                        </span>
                        {u.planIds.length > 0 && (
                          <small className="block text-xs text-muted-foreground max-w-xs truncate">
                            {u.planIds
                              .map(
                                (pid) =>
                                  V31_PLAN_CATALOG.find((item) => item.id === pid)?.name ||
                                  allPlanLookup.get(pid)?.plan.name ||
                                  pid,
                              )
                              .join(', ')}
                          </small>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: 'capabilities',
                    header: 'PERMISSIONS',
                    cell: (u) => {
                      const assignedRole = partnerRoles.find(
                        (r) => r.id === userRoleAssignments[u.id],
                      );
                      if (isEngReady && assignedRole) {
                        const editMods = Object.entries(assignedRole.permissions)
                          .filter(([, l]) => l === 'edit')
                          .map(([m]) => m);
                        const viewMods = Object.entries(assignedRole.permissions)
                          .filter(([, l]) => l === 'view')
                          .map(([m]) => m);
                        return (
                          <div className="text-xs space-y-0.5">
                            {editMods.length > 0 && (
                              <span className="block text-slate-900">
                                <strong>Edit:</strong> {editMods.join(', ')}
                              </span>
                            )}
                            {viewMods.length > 0 && (
                              <span className="block text-muted-foreground">
                                <strong>View:</strong> {viewMods.join(', ')}
                              </span>
                            )}
                          </div>
                        );
                      }
                      return (
                        <span>
                          {u.capabilities.filter((c) => PERMISSION_LABELS[c]).join(', ') ||
                            'Operational only'}
                        </span>
                      );
                    },
                  },
                  { id: 'status', header: 'STATUS', cell: (u) => <StatusPill status={u.status} /> },
                  {
                    id: 'edit',
                    header: 'ACTION',
                    cell: (u) => {
                      const isSelf = u.id === view.actor.id;
                      const inScope = isWithinAdminScope(u);
                      return (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSelf || !inScope}
                            onClick={() => edit(u)}
                          >
                            {isSelf
                              ? 'Your account'
                              : !inScope
                                ? 'Outside your scope'
                                : 'Edit access'}
                          </Button>
                          {isEngV31 && !isSelf && inScope && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => revokeUserAccess(u.id)}
                            >
                              <Trash2 className="size-3.5" />
                              Revoke access
                            </Button>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
              />

              <section className="rounded-lg border border-border bg-white p-4">
                <h2 className="text-sm font-semibold">Recent access changes</h2>
                {snapshot.audit.filter((a) => /User|invited|Bulk|request/.test(a.title)).length ? (
                  snapshot.audit
                    .filter((a) => /User|invited|Bulk|request/.test(a.title))
                    .map((a) => (
                      <p className="mt-2 text-sm" key={a.id}>
                        {a.title} · {a.detail} · {a.actor}
                      </p>
                    ))
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No changes in this session.</p>
                )}
              </section>
            </>
          )}
        </>
      )}

      {/* ============================================================================
       * MODAL 1: EDIT / CREATE PARTNER ROLE & MODULE VIEW/EDIT MATRIX + CONFLICTS
       * ============================================================================ */}
      {editingRole && (
        <Dialog open onOpenChange={(v) => !v && setEditingRole(null)}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>
                {isEngV3 ? 'Configure role' : 'Configure Role & Module Permissions'}
              </DialogTitle>
              <DialogDescription>
                {isEngV3
                  ? 'Choose what users with this role can view or edit.'
                  : 'Define View and Edit access across Partner Portal modules. WG > VAN > PLAN entity scope is mapped when assigning users to this role.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-foreground">
                  {isEngV3 ? 'Role name' : 'Role / User Group Name'}
                  <Input
                    className="mt-1 text-sm"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  />
                </label>
                <label className="text-xs font-medium text-foreground">
                  Description
                  <Input
                    className="mt-1 text-sm"
                    value={editingRole.description}
                    onChange={(e) =>
                      setEditingRole({ ...editingRole, description: e.target.value })
                    }
                  />
                </label>
              </div>

              {/* Module Matrix using Partner Portal BrandSegmentedControl */}
              <div className="rounded-metric-card border border-border overflow-hidden">
                <div className="grid grid-cols-12 bg-claims-table-header-bg px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border">
                  <div className="col-span-5">Portal Module</div>
                  <div className="col-span-7 text-right">Access Level</div>
                </div>
                <div className="divide-y divide-border">
                  {MODULE_METADATA.map((mod) => {
                    const current = editingRole.permissions[mod.id];
                    const subItems = V31_MODULE_SUBSECTIONS[mod.id] || [];
                    return (
                      <div key={mod.id} className="text-xs">
                        <div className="grid grid-cols-12 items-center px-4 py-3">
                          <div className="col-span-5">
                            <p className="font-medium text-foreground">{mod.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {current === 'edit'
                                ? mod.editLabel
                                : current === 'view'
                                  ? mod.viewLabel
                                  : 'Module hidden from sidebar'}
                            </p>
                          </div>
                          <div className="col-span-7 flex justify-end">
                            <BrandSegmentedControl
                              value={current}
                              onChange={(lvl) =>
                                setEditingRole({
                                  ...editingRole,
                                  permissions: {
                                    ...editingRole.permissions,
                                    [mod.id]: lvl,
                                  },
                                })
                              }
                              options={[
                                { value: 'none', label: 'No Access' },
                                { value: 'view', label: 'View Only' },
                                { value: 'edit', label: 'View & Edit' },
                              ]}
                            />
                          </div>
                        </div>

                        {/* Point 12a & 12b: Nested sub-sections / configure metrics (Show / Hide) when View Only or View & Edit is selected */}
                        {isEngV31 && current !== 'none' && subItems.length > 0 && (
                          <div className="border-t border-border/60 bg-pagination-background/60 px-6 py-2.5 space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {mod.label} sub-sections &amp; metrics (Show / Hide for this role)
                            </p>
                            <div className="divide-y divide-border/50 rounded-lg border border-border bg-white px-3">
                              {subItems.map((sub) => {
                                const subKey = `${mod.id}:${sub.id}`;
                                const isShown = editingRole.subPermissions?.[subKey] !== false;
                                return (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between gap-3 py-2 text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        {sub.label}
                                      </span>
                                      <span className="rounded border border-border bg-pagination-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                        {sub.category}
                                      </span>
                                    </div>
                                    <BrandSegmentedControl
                                      value={isShown ? 'show' : 'hide'}
                                      onChange={(val) =>
                                        setEditingRole({
                                          ...editingRole,
                                          subPermissions: {
                                            ...(editingRole.subPermissions || {}),
                                            [subKey]: val === 'show',
                                          },
                                        })
                                      }
                                      options={[
                                        { value: 'show', label: 'Show' },
                                        { value: 'hide', label: 'Hide' },
                                      ]}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Workflow Conflict Detection Alerts (Hidden in v3.1 per Point 12c) */}
              {!isEngV31 &&
                detectRoleConflicts(editingRole.permissions, approachMode).map((conf) => (
                  <div
                    key={conf.id}
                    className={cn(
                      'rounded-xl border p-3.5 text-xs space-y-2',
                      conf.severity === 'red' ? 'finance-danger' : 'finance-warning',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">{conf.title}</p>
                          <p className="mt-0.5 leading-relaxed opacity-90">{conf.description}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 shrink-0 bg-white text-xs font-medium text-foreground"
                        onClick={() =>
                          setEditingRole({
                            ...editingRole,
                            permissions: conf.applyFix(editingRole.permissions),
                          })
                        }
                      >
                        {conf.fixLabel}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button
                className="finance-primary"
                onClick={() => {
                  savePartnerRole({ ...editingRole, updatedAt: 'Just now' });
                  setEditingRole(null);
                }}
              >
                Save Role Definition
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ============================================================================
       * MODAL 2: BULK UPLOAD USERS (UP TO 200+ USERS ACROSS ACCESS LEVELS)
       * ============================================================================ */}
      {bulkOpen && (
        <Dialog open onOpenChange={setBulkOpen}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="size-4 text-share-policy-primary" />
                Bulk Onboard Users (Up to 200 Users per Batch)
              </DialogTitle>
              <DialogDescription>
                Assign the same Role and WG &gt; VAN &gt; PLAN scope to a list of emails, or upload
                a multi-role CSV mapping users across different access levels.
              </DialogDescription>
            </DialogHeader>

            {/* Mode Switcher using Partner Portal SegmentedTabs */}
            <SegmentedTabs
              value={bulkMode}
              onValueChange={(v) => setBulkMode(v as 'batch-emails' | 'csv-multi')}
              tabs={[
                {
                  value: 'batch-emails',
                  label: 'Option 1: Same Role & Scope (Paste up to 200 Emails)',
                },
                {
                  value: 'csv-multi',
                  label: 'Option 2: Multi-Role CSV Upload (200 Rows)',
                },
              ]}
            />

            {bulkMode === 'batch-emails' ? (
              <div className="space-y-4">
                <Picker
                  label="1. Select Defined Partner Role for this Batch"
                  value={bulkRoleId}
                  onChange={setBulkRoleId}
                  options={partnerRoles.map((r) => ({
                    value: r.id,
                    label: r.name,
                    description: r.description,
                  }))}
                />

                <div className="space-y-2">
                  <span className="block text-xs font-medium text-pagination-text-muted">
                    2. Select WG &gt; VAN &gt; PLAN Scope for this Batch
                  </span>
                  <div className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3">
                    {snapshot.vans
                      .filter((v) => view.actor.vanIds.includes(v.id))
                      .map((v) => (
                        <div
                          key={v.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-pagination-background p-2.5 text-xs"
                        >
                          <label className="flex items-center gap-2 font-medium text-foreground">
                            <Checkbox
                              checked={bulkVans.includes(v.id)}
                              onCheckedChange={(on) =>
                                setBulkVans((prev) =>
                                  on ? [...prev, v.id] : prev.filter((id) => id !== v.id),
                                )
                              }
                            />
                            {vanAliases[v.id] || v.label} ({v.maskedAccount})
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {v.plans.map((p) => (
                              <label key={p.id} className="flex items-center gap-1.5">
                                <Checkbox
                                  checked={bulkPlans.includes(p.id)}
                                  onCheckedChange={(on) =>
                                    setBulkPlans((prev) =>
                                      on ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                                    )
                                  }
                                />
                                {p.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-pagination-text-muted">
                      3. Paste User Emails ({parsedBulkEmails.length} / 200 max)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = Array.from(
                          { length: 40 },
                          (_, i) => `ops.member${i + 1}@zomato.com`,
                        ).join('\n');
                        setBulkEmailsText(generated);
                      }}
                      className="text-xs font-medium text-share-policy-primary underline"
                    >
                      Generate sample 40-email batch
                    </button>
                  </div>
                  <Textarea
                    rows={4}
                    value={bulkEmailsText}
                    onChange={(e) => setBulkEmailsText(e.target.value)}
                    className="w-full font-mono text-xs"
                    placeholder="Paste comma or newline-separated emails..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-dashed border-share-recipient-border-active bg-segmented-tab-active-bg/30 p-5 text-center space-y-2">
                  <Upload className="mx-auto size-6 text-share-policy-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    Partner_Users_Onboarding_Oct2026.csv (200 rows ready)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Columns: <code>name, email, role_name, van_ids, plan_ids</code>
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-medium text-pagination-text-muted">
                    Simulate Validation Outcome (to test all Toast &amp; Notification states):
                  </span>
                  <BrandSegmentedControl
                    value={bulkSimOutcome}
                    onChange={setBulkSimOutcome}
                    className="w-full justify-between"
                    options={[
                      { value: 'all-valid', label: '200 Valid (Success Toast)' },
                      { value: 'partial', label: '180 Valid / 20 Failed (Partial)' },
                      { value: 'all-fail', label: '0 Valid / 200 Failed (Error)' },
                    ]}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
              <Button
                className="finance-primary"
                onClick={() => {
                  if (bulkMode === 'batch-emails') {
                    const entries = parsedBulkEmails.map((email) => {
                      const localPart = email.split('@')[0] || 'User';
                      const formattedName = localPart
                        .replace(/[._]/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase());
                      return {
                        name: formattedName,
                        email,
                        roleId: bulkRoleId,
                        vanIds: bulkVans,
                        planIds: bulkPlans,
                      };
                    });
                    bulkOnboardUsers(entries, 'Batch_Email_Onboarding.csv', 0);
                  } else {
                    if (bulkSimOutcome === 'all-fail') {
                      bulkOnboardUsers([], 'Partner_Users_Onboarding_Oct2026.csv', 200);
                    } else if (bulkSimOutcome === 'partial') {
                      const sampleEntries = [
                        {
                          name: 'Meera Krishnan',
                          email: 'meera.k@zomato.com',
                          roleId: 'role-operations',
                          vanIds: ['VAN-1'],
                          planIds: ['gig-1', 'gig-2'],
                        },
                        {
                          name: 'Arjun Malhotra',
                          email: 'arjun.m@blinkit.com',
                          roleId: 'role-claims-finance',
                          vanIds: ['VAN-2'],
                          planIds: ['blinkit-3'],
                        },
                      ];
                      bulkOnboardUsers(sampleEntries, 'Partner_Users_Onboarding_Oct2026.csv', 20);
                    } else {
                      const sampleEntries = [
                        {
                          name: 'Meera Krishnan',
                          email: 'meera.k@zomato.com',
                          roleId: 'role-operations',
                          vanIds: ['VAN-1'],
                          planIds: ['gig-1', 'gig-2'],
                        },
                        {
                          name: 'Arjun Malhotra',
                          email: 'arjun.m@blinkit.com',
                          roleId: 'role-claims-finance',
                          vanIds: ['VAN-2'],
                          planIds: ['blinkit-3'],
                        },
                      ];
                      bulkOnboardUsers(sampleEntries, 'Partner_Users_Onboarding_Oct2026.csv', 0);
                    }
                  }
                  setBulkOpen(false);
                }}
              >
                <Upload className="size-3.5" />
                Start Bulk Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ============================================================================
       * MODAL 3: SINGLE USER INVITE / EDIT ACCESS MODAL
       * ============================================================================ */}
      {draft && (
        <Dialog
          open
          onOpenChange={(v) => {
            if (!v && !pending) setDraft(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-white">
            <DialogHeader>
              <DialogTitle>{review ? 'Review access changes' : 'User access'}</DialogTitle>
              <DialogDescription>
                {snapshot.groupName} ·{' '}
                {isEngV3
                  ? 'Assign a role and select permitted accounts and plans.'
                  : isEngReady
                    ? 'Step 1: Select a defined Role. Step 2: Map WG > VAN > PLAN scope.'
                    : 'Financial and operational grants are independent.'}
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!review) {
                  setReview(true);
                  return;
                }
                if (isEngReady) {
                  assignUserRoleAndScope(draft, draftRoleId, reason);
                  setDraft(null);
                  setReview(false);
                  return;
                }
                if (await execute({ type: 'manage-access', user: draft, reason })) {
                  setDraft(null);
                  setReview(false);
                }
              }}
            >
              {review ? (
                <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                  <p>
                    {draft.name} · {draft.email}
                  </p>
                  {isEngReady && <p>Assigned Role: {selectedDraftRole.name}</p>}
                  <p>Status: {draft.status}</p>
                  <p>VANs: {draft.vanIds.join(', ') || 'None'}</p>
                  <p>Plans: {draft.planIds.join(', ') || 'None'}</p>
                  {!isEngReady && <p>Permissions: {draft.capabilities.join(', ') || 'None'}</p>}
                  <p>
                    {draft.status === 'inactive'
                      ? 'All grants will stop applying immediately in this simulator.'
                      : 'Only the checked scopes will be granted.'}
                  </p>
                  <p>Reason: {reason}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-sm">
                      Full name
                      <Input
                        required
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      />
                    </label>
                    <label className="text-sm">
                      Email
                      <Input
                        required
                        type="email"
                        value={draft.email}
                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      />
                    </label>
                  </div>
                  <Picker
                    label="Account status"
                    value={draft.status}
                    onChange={(v) => setDraft({ ...draft, status: v as 'active' | 'inactive' })}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Deactivate access' },
                    ]}
                  />

                  {isEngReady ? (
                    /* Role-First Selection using Partner Portal Picker + Conflict Preview */
                    <div className="space-y-3 rounded-xl border border-share-recipient-border-active/30 bg-icon-select-accent-bg/40 p-4">
                      <Picker
                        label={
                          isEngV3
                            ? 'Role'
                            : '1. Assign Defined Partner Role (Module View/Edit Matrix)'
                        }
                        value={draftRoleId}
                        onChange={(nextRoleId) => {
                          setDraftRoleId(nextRoleId);
                          const rObj = partnerRoles.find((r) => r.id === nextRoleId);
                          if (!isEngV3 && rObj?.permissions.financials === 'none') {
                            setDraft((d) => (d ? { ...d, vanIds: [] } : d));
                          }
                        }}
                        options={partnerRoles.map((r) => ({
                          value: r.id,
                          label: r.name,
                          description: r.description,
                        }))}
                      />

                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {MODULE_METADATA.map((m) => {
                          const lvl = selectedDraftRole.permissions[m.id];
                          return (
                            <span
                              key={m.id}
                              className={cn(
                                'rounded border px-2 py-0.5 font-medium',
                                lvl === 'edit'
                                  ? 'border-share-recipient-border-active/30 bg-segmented-tab-active-bg text-segmented-tab-active-text'
                                  : lvl === 'view'
                                    ? 'finance-success'
                                    : 'border-border bg-white text-muted-foreground line-through',
                              )}
                            >
                              {m.label}:{' '}
                              {lvl === 'edit' ? 'Edit' : lvl === 'view' ? 'View' : 'None'}
                            </span>
                          );
                        })}
                      </div>

                      {isEngV3 &&
                        draft.vanIds.length > 0 &&
                        selectedDraftRole.permissions.financials === 'none' && (
                          <div className="finance-warning flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-xs">
                            <span>
                              You selected {draft.vanIds.length} financial account(s), but{' '}
                              <strong>{selectedDraftRole.name}</strong> currently has{' '}
                              <strong>Financials</strong> set to No Access in Configure role.
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 bg-white text-xs text-foreground"
                              onClick={() =>
                                savePartnerRole({
                                  ...selectedDraftRole,
                                  permissions: {
                                    ...selectedDraftRole.permissions,
                                    financials: 'view',
                                  },
                                  updatedAt: 'Just now',
                                })
                              }
                            >
                              Enable Financials (View)
                            </Button>
                          </div>
                        )}

                      {!isEngV31 && draftRoleConflicts.length > 0 && (
                        <div className="finance-warning rounded-lg border p-2.5 text-xs">
                          <strong>Role boundary note:</strong> {draftRoleConflicts[0].title}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-sm font-semibold">Access role preset</span>
                      <div className="grid grid-cols-2 gap-2">
                        {ACCESS_ROLE_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset.mode)}
                            className="rounded-lg border border-border bg-white p-2.5 text-left text-xs transition hover:border-share-policy-primary hover:bg-muted/30"
                          >
                            <span className="block font-semibold text-foreground">
                              {preset.label}
                            </span>
                            <span className="mt-0.5 block text-muted-foreground">
                              {preset.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shared-VAN Partial Plan Disclosure (Hidden in v3.1) */}
                  {!isEngV31 && sharedVanWarnings.length > 0 && (
                    <div
                      role="status"
                      className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1"
                    >
                      <p className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                        Shared financial account notice
                      </p>
                      {sharedVanWarnings.map(({ van, grantedPlans, omittedPlans }) => (
                        <p key={van.id}>
                          {van.id} ({vanAliases[van.id] || van.label}) is shared across{' '}
                          {van.plans.length} plans. Granting{' '}
                          <strong>
                            {grantedPlans.map((p) => p.name).join(', ') || 'no plans'}
                          </strong>{' '}
                          without <strong>{omittedPlans.map((p) => p.name).join(', ')}</strong>{' '}
                          allows this user to view the total balance of {van.id}, while transactions
                          for {omittedPlans.map((p) => p.name).join(', ')} remain masked.
                        </p>
                      ))}
                    </div>
                  )}

                  <fieldset className="rounded-lg border border-border p-4 space-y-3">
                    <legend className="px-2 text-sm font-semibold">
                      {isEngV3
                        ? isEngV31
                          ? `Financial accounts (${draft.vanIds.length} of ${V31_VAN_CATALOG.length} VANs selected)`
                          : 'Financial accounts'
                        : 'Financial VANs'}
                    </legend>
                    {isEngV31 ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                            <Input
                              value={vanSearchV31}
                              onChange={(e) => setVanSearchV31(e.target.value)}
                              placeholder={`Search ${V31_VAN_CATALOG.length} VAN numbers (e.g. 9010410001041 or 1045)...`}
                              className="h-7 pl-7 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              className="font-medium text-share-policy-primary hover:underline"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  vanIds: V31_VAN_CATALOG.map((item) => item.id),
                                })
                              }
                            >
                              Select all ({V31_VAN_CATALOG.length})
                            </button>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground hover:underline"
                              onClick={() => setDraft({ ...draft, vanIds: [] })}
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="max-h-44 overflow-y-auto grid grid-cols-1 gap-1.5 sm:grid-cols-2 pr-1">
                          {V31_VAN_CATALOG.filter((item) => {
                            const q = vanSearchV31.trim().toLowerCase();
                            return (
                              !q ||
                              item.vanNumber.toLowerCase().includes(q) ||
                              item.masked.toLowerCase().includes(q) ||
                              item.partner.toLowerCase().includes(q) ||
                              item.id.toLowerCase().includes(q)
                            );
                          }).map((item) => (
                            <label
                              key={item.id}
                              className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-border/80 bg-pagination-background/40 px-2.5 py-1.5 text-xs hover:bg-muted/40"
                            >
                              <span className="flex items-center gap-2">
                                <Checkbox
                                  checked={draft.vanIds.includes(item.id)}
                                  onCheckedChange={(on) => toggle('vanIds', item.id, on === true)}
                                />
                                <span className="font-mono font-medium text-foreground">
                                  {item.vanNumber}
                                </span>
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {item.masked}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      snapshot.vans
                        .filter((v) => isAckoSuperAdmin || view.actor.vanIds.includes(v.id))
                        .map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={draft.vanIds.includes(v.id)}
                                onCheckedChange={(on) => toggle('vanIds', v.id, on === true)}
                              />
                              <span>
                                {v.id} · {vanAliases[v.id] || v.label}{' '}
                                <span className="text-xs text-muted-foreground">
                                  ({v.maskedAccount} · Linked plans:{' '}
                                  {v.plans.map((p) => p.name).join(', ')})
                                </span>
                              </span>
                            </label>
                            {!isEngV3 && (
                              <button
                                type="button"
                                className="text-xs text-share-policy-primary underline"
                                onClick={() => {
                                  const allSelected =
                                    draft.vanIds.includes(v.id) &&
                                    v.plans.every((p) => draft.planIds.includes(p.id));
                                  const next = !allSelected;
                                  toggle('vanIds', v.id, next);
                                  for (const p of v.plans) {
                                    if (view.ownPlans.some((op) => op.id === p.id)) {
                                      toggle('planIds', p.id, next);
                                    }
                                  }
                                }}
                              >
                                Select account &amp; plans
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </fieldset>

                  {!isEngReady && (
                    <fieldset className="rounded-lg border border-border p-4 space-y-3">
                      <legend className="px-2 text-sm font-semibold">Permissions</legend>
                      {Object.entries(PERMISSION_LABELS)
                        .filter(([c]) => view.actor.capabilities.includes(c as Capability))
                        .map(([c, label]) => (
                          <label key={c} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={draft.capabilities.includes(c as Capability)}
                              onCheckedChange={(on) => toggle('capabilities', c, on === true)}
                            />
                            {label}
                          </label>
                        ))}
                    </fieldset>
                  )}

                  <fieldset className="rounded-lg border border-border p-4 space-y-3">
                    <legend className="px-2 text-sm font-semibold">
                      {isEngV31
                        ? `Operational plans (${draft.planIds.length} of ${V31_PLAN_CATALOG.length} plans selected)`
                        : 'Operational plans'}
                    </legend>
                    {isEngV31 ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                            <Input
                              value={planSearchV31}
                              onChange={(e) => setPlanSearchV31(e.target.value)}
                              placeholder={`Search ${V31_PLAN_CATALOG.length} operational plans across partners...`}
                              className="h-7 pl-7 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              className="font-medium text-share-policy-primary hover:underline"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  planIds: V31_PLAN_CATALOG.map((item) => item.id),
                                })
                              }
                            >
                              Select all ({V31_PLAN_CATALOG.length})
                            </button>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground hover:underline"
                              onClick={() => setDraft({ ...draft, planIds: [] })}
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                          {(['Zomato', 'Blinkit', 'District', 'Hyperpure'] as const).map(
                            (partnerName) => {
                              const partnerPlans = V31_PLAN_CATALOG.filter((p) => {
                                if (p.partner !== partnerName) return false;
                                const q = planSearchV31.trim().toLowerCase();
                                return (
                                  !q ||
                                  p.name.toLowerCase().includes(q) ||
                                  p.partner.toLowerCase().includes(q) ||
                                  `${p.partner} > ${p.name}`.toLowerCase().includes(q)
                                );
                              });
                              if (partnerPlans.length === 0) return null;
                              const allPartnerIds = V31_PLAN_CATALOG.filter(
                                (p) => p.partner === partnerName,
                              ).map((p) => p.id);
                              const allPartnerChecked = allPartnerIds.every((id) =>
                                draft.planIds.includes(id),
                              );

                              return (
                                <div
                                  key={partnerName}
                                  className="rounded-lg border border-border/80 bg-pagination-background/40 p-2 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-xs font-semibold text-foreground px-1">
                                    <label className="flex cursor-pointer items-center gap-2">
                                      <Checkbox
                                        checked={allPartnerChecked}
                                        onCheckedChange={(on) => {
                                          if (on === true) {
                                            setDraft({
                                              ...draft,
                                              planIds: Array.from(
                                                new Set([...draft.planIds, ...allPartnerIds]),
                                              ),
                                            });
                                          } else {
                                            setDraft({
                                              ...draft,
                                              planIds: draft.planIds.filter(
                                                (id) => !allPartnerIds.includes(id),
                                              ),
                                            });
                                          }
                                        }}
                                      />
                                      <span>{partnerName}</span>
                                    </label>
                                    <span className="text-[10px] font-normal text-muted-foreground">
                                      {
                                        allPartnerIds.filter((id) => draft.planIds.includes(id))
                                          .length
                                      }
                                      /{allPartnerIds.length} plans
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 pl-4">
                                    {partnerPlans.map((p) => (
                                      <label
                                        key={p.id}
                                        className="flex cursor-pointer items-center gap-2 rounded bg-white px-2 py-1 text-xs hover:bg-muted/40"
                                      >
                                        <Checkbox
                                          checked={draft.planIds.includes(p.id)}
                                          onCheckedChange={(on) =>
                                            toggle('planIds', p.id, on === true)
                                          }
                                        />
                                        <span className="truncate">
                                          <span className="text-muted-foreground">
                                            {p.partner} &gt;{' '}
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {p.name}
                                          </span>
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    ) : (
                      (isAckoSuperAdmin
                        ? snapshot.vans.flatMap((v) => v.plans)
                        : view.ownPlans
                      ).map((p) => {
                        const parentVan = snapshot.vans.find((v) =>
                          v.plans.some((vp) => vp.id === p.id),
                        );
                        return (
                          <label key={p.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={draft.planIds.includes(p.id)}
                              onCheckedChange={(on) => toggle('planIds', p.id, on === true)}
                            />
                            <span>
                              {p.partner} · {p.name}{' '}
                              {!isEngV3 && parentVan && (
                                <span className="text-xs text-muted-foreground">
                                  ({vanAliases[parentVan.id] || parentVan.id} ·{' '}
                                  {parentVan.maskedAccount})
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </fieldset>
                  <label className="block text-sm">
                    Reason for change
                    <Input
                      required
                      minLength={8}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                </>
              )}
              {error && (
                <p role="alert" className="finance-danger p-3 rounded-lg text-sm">
                  {error}
                </p>
              )}
              <div>
                {unknownOutcome && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      checkOutcome();
                      setDraft(null);
                    }}
                  >
                    Check request status
                  </Button>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => (review ? setReview(false) : setDraft(null))}
                >
                  {review ? 'Back' : 'Cancel'}
                </Button>
                <Button type="submit" className="finance-primary" disabled={pending}>
                  {unknownOutcome
                    ? 'Awaiting confirmation'
                    : pending
                      ? 'Saving…'
                      : review
                        ? 'Confirm access'
                        : 'Review changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
