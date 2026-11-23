'use client';

import { useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Lock,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SegmentedTabs from '@/components/molecules/SegmentedTabs';
import UnderlineTabs from '@/components/molecules/UnderlineTabs';
import { cn } from '@/lib/utils';
import { BrandSegmentedControl } from './common';
import {
  useFinancialWorkspace,
  WG_POOL_PRESETS,
  PARTNER_WG_DIRECTORY,
  type AccessLevel,
  type ApproachMode,
  type ModuleId,
  type NotificationCategory,
  type PartnerRoleDefinition,
  type PartnerWgDirectoryItem,
  type WgGraceStatus,
  type WgPoolPresetId,
} from './provider';
import { Deliverables } from './deliverables';
import type { Role } from './domain';

export const MODULE_METADATA: {
  id: ModuleId;
  label: string;
  viewLabel: string;
  editLabel: string;
  entityLineage: string;
}[] = [
  {
    id: 'overview',
    label: 'Overview',
    viewLabel: 'View KPIs & charts',
    editLabel: 'View & customize KPIs',
    entityLineage: 'WG > VAN > PLAN > POLICY',
  },
  {
    id: 'policies',
    label: 'Policy management',
    viewLabel: 'View policies & COI',
    editLabel: 'View, endorse & cancel policies',
    entityLineage: 'WG > VAN > PLAN > POLICY',
  },
  {
    id: 'claims',
    label: 'Claims management',
    viewLabel: 'View claims & status',
    editLabel: 'Intimate claims & upload docs',
    entityLineage: 'WG > VAN > PLAN > CLAIM',
  },
  {
    id: 'financials',
    label: 'Financials (CD Ledger)',
    viewLabel: 'View VAN balances & ledger',
    editLabel: 'Report deposits & raise disputes',
    entityLineage: 'WG > VAN > PLAN > POLICY',
  },
  {
    id: 'manual-refunds',
    label: 'Manual refunds',
    viewLabel: 'View refund status & UTRs',
    editLabel: 'Update beneficiary & retry payouts',
    entityLineage: 'WG > VAN > PLAN > POLICY',
  },
  {
    id: 'reports',
    label: 'Statements & reports',
    viewLabel: 'View & download reports',
    editLabel: 'Generate custom statements & exports',
    entityLineage: 'WG > VAN > PLAN',
  },
  {
    id: 'settings',
    label: 'Settings & UAM',
    viewLabel: 'View own access & team directory',
    editLabel: 'Create roles, bulk upload & grant access',
    entityLineage: 'WG > VAN > PLAN',
  },
];

export interface RoleConflictWarning {
  id: string;
  severity: 'amber' | 'red';
  title: string;
  description: string;
  fixLabel: string;
  applyFix: (perms: Record<ModuleId, AccessLevel>) => Record<ModuleId, AccessLevel>;
}

/** Detects cross-module workflow conflicts in a Partner Role definition. */
export function detectRoleConflicts(
  perms: Record<ModuleId, AccessLevel>,
  mode?: ApproachMode,
): RoleConflictWarning[] {
  const conflicts: RoleConflictWarning[] = [];

  if (perms.overview !== 'none' && perms.financials === 'none') {
    conflicts.push(
      mode === 'engineering-ready-v2'
        ? {
            id: 'overview-without-financials',
            severity: 'amber',
            title: 'Overview WG Pool Balance Section Hidden (Financials = No Access)',
            description:
              'In Engineering Ready v2.0, the separated "WG Pool Balance" section on Overview is hidden for roles with Financials = No Access (and zero Request Access CTAs are shown). Users in this role see only the 5 operational Policy & Claim KPIs, plus an operational pause banner if the WG Pool falls below the minimum threshold.',
            fixLabel: 'Grant Financials (View)',
            applyFix: (p) => ({ ...p, financials: 'view' }),
          }
        : {
            id: 'overview-without-financials',
            severity: 'amber',
            title: 'Overview Balance Card Will Be Locked (Financials = No Access)',
            description:
              'Under WG > VAN > PLAN > POLICY, the "Today’s balance" card on Overview derives from the parent VAN. With Financials set to No Access, users in this role will see operational KPIs only and a "Request Access" lock on Today’s balance.',
            fixLabel: 'Grant Financials (View)',
            applyFix: (p) => ({ ...p, financials: 'view' }),
          },
    );
  }

  if (perms.policies === 'edit' && perms['manual-refunds'] === 'none') {
    conflicts.push({
      id: 'policy-cancel-without-refunds',
      severity: 'red',
      title: 'Workflow Conflict: Policy Cancellation Without Manual Refunds Access',
      description:
        'Users with Policy Management (Edit) can initiate policy cancellations, which trigger bank or float refunds. Without Manual Refunds access, they cannot track failed payouts or fix beneficiary bank details.',
      fixLabel: 'Grant Manual Refunds (View)',
      applyFix: (p) => ({ ...p, 'manual-refunds': 'view' }),
    });
  }

  if (perms['manual-refunds'] === 'edit' && perms.financials === 'none') {
    conflicts.push({
      id: 'refund-edit-without-financials',
      severity: 'red',
      title: 'Workflow Conflict: Manual Refunds (Edit) Requires Financials (View)',
      description:
        'Retrying a failed refund payout or routing a cancellation refund to CD float places a hold on the parent VAN balance. Users need Financials (View) to verify VAN hold release.',
      fixLabel: 'Grant Financials (View)',
      applyFix: (p) => ({ ...p, financials: 'view' }),
    });
  }

  if (perms.claims === 'edit' && perms.policies === 'none') {
    conflicts.push({
      id: 'claims-edit-without-policies',
      severity: 'amber',
      title: 'Dependency Notice: Claims Intimation Without Policy Lookup',
      description:
        'Filing a new claim (FNOL) requires verifying member coverage and policy sum insured under the selected Plan. Consider granting Policy Management (View).',
      fixLabel: 'Grant Policy Management (View)',
      applyFix: (p) => ({ ...p, policies: 'view' }),
    });
  }

  return conflicts;
}

function downloadSampleCsv(filename: string, content: string) {
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Right-to-Left Contextual Notifications Sidebar matching the user's ideal design pattern:
 * - Header: "Notifications" + red pill "X new" + close button
 * - Pill tabs: All | Alerts | Tasks | Mentions | Approvals
 * - Contextual cards with inline actions
 */
export function ContextualNotificationsSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const {
    contextualNotifications,
    setContextualNotifications,
    markRead,
    accessRequests,
    resolveAccessRequest,
    setUamActiveTab,
    view,
  } = useFinancialWorkspace();

  const [activeTab, setActiveTab] = useState<'all' | NotificationCategory>('all');
  const [errorGuideOpen, setErrorGuideOpen] = useState(false);

  const unreadCount = contextualNotifications.filter((n) => n.unread).length;
  const canManage = view.actor.capabilities.includes('manage-access');

  const filtered = contextualNotifications.filter((n) =>
    activeTab === 'all' ? true : n.category === activeTab,
  );

  const tabs: { id: 'all' | NotificationCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'approvals', label: 'Approvals' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="left-auto right-0 top-0 flex h-dvh w-[440px] max-w-[94vw] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-l border-slate-200 bg-white p-0 shadow-2xl">
          {/* Header matching reference image */}
          <div className="flex items-center justify-between px-6 pt-6 pb-3">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-slate-950">Notifications</DialogTitle>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#DC2626] px-2.5 py-0.5 text-xs font-bold text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <DialogDescription className="sr-only">
              Contextual notifications across alerts, tasks, mentions, and approvals.
            </DialogDescription>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markRead}
                className="mr-6 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Segmented Pill Tabs using Partner Portal SegmentedTabs */}
          <div className="px-6 pb-4">
            <SegmentedTabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'all' | NotificationCategory)}
              tabs={tabs.map((t) => ({ value: t.id, label: t.label }))}
            />
          </div>

          {/* Notification Cards List */}
          <div className="flex-1 space-y-3 overflow-y-auto px-6 pb-6">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No notifications in {activeTab === 'all' ? 'your feed' : activeTab}.
              </div>
            ) : (
              filtered.map((item) => {
                const linkedReq = item.requestId
                  ? accessRequests.find((r) => r.id === item.requestId)
                  : undefined;

                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      setContextualNotifications((prev) =>
                        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
                      )
                    }
                    className={cn(
                      'rounded-xl border p-4 transition',
                      item.unread
                        ? 'border-share-recipient-border-active/40 bg-segmented-tab-active-bg/25 shadow-2xs'
                        : 'border-border bg-white',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>

                    {/* Contextual Upload Actions inside Notification Card */}
                    {(item.uploadState === 'failed' || item.uploadState === 'partial') && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 bg-white text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadSampleCsv(
                              'bulk-upload-validation-errors.csv',
                              'row,email,role,van_id,plan_id,error_reason\n14,invalid-email-format,Operations,VAN-1,gig-1,Invalid email address syntax\n29,priya.k@zomato.com,Operations,VAN-9,gig-1,VAN-9 does not exist in Wallet Group\n42,rohan.s@blinkit.com,UnknownRole,VAN-2,blinkit-3,Role UnknownRole is not defined',
                            );
                          }}
                        >
                          Download Error File
                        </Button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setErrorGuideOpen(true);
                          }}
                          className="text-xs font-medium text-foreground underline"
                        >
                          How to Correct Errors
                        </button>
                      </div>
                    )}

                    {/* Contextual Approval Actions inside Notification Card */}
                    {item.category === 'approvals' &&
                      linkedReq &&
                      linkedReq.status === 'pending' &&
                      canManage && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                          <Button
                            size="sm"
                            className="h-7 finance-primary text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveAccessRequest(
                                linkedReq.id,
                                'approved',
                                'Approved directly from Notifications center.',
                              );
                            }}
                          >
                            <Check className="size-3.5" />
                            Approve access
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveAccessRequest(
                                linkedReq.id,
                                'modified',
                                'Approved with View-only scope on requested modules.',
                              );
                            }}
                          >
                            Approve as View-only
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveAccessRequest(
                                linkedReq.id,
                                'rejected',
                                'Declined by administrator.',
                              );
                            }}
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                    {item.actionRoute && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.requestId) {
                              setUamActiveTab('requests');
                            }
                            onOpenChange(false);
                            router.push(`/${partner}/dashboard/${item.actionRoute}`);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-share-policy-primary hover:underline"
                        >
                          {item.actionLabel || 'Open details'}
                          <ArrowRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <HowToCorrectErrorsModal open={errorGuideOpen} onOpenChange={setErrorGuideOpen} />
    </>
  );
}

/**
 * Contextual Upload Banner Toast System matching the 4 exact states in the user's reference image:
 * 1. Toast Uploading (Cream #FEFCE8)
 * 2. Toast Success (Mint #F0FDF4)
 * 3. Toast Total Failure (Soft Rose #FEF2F2)
 * 4. Toast Partial Complete (Soft Rose #FFF1F2)
 */
export function BulkUploadToastBanner() {
  const { bulkToast, setBulkToast } = useFinancialWorkspace();
  const [errorGuideOpen, setErrorGuideOpen] = useState(false);

  if (!bulkToast) return null;

  return (
    <>
      <div className="mx-6 mt-4">
        {bulkToast.kind === 'uploading' && (
          <div
            role="status"
            className="relative rounded-2xl border border-[#FDE047] bg-[#FEFCE8] p-5 text-slate-900 shadow-sm"
          >
            <button
              type="button"
              aria-label="Close upload notification"
              onClick={() => setBulkToast(null)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-950"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-sm font-bold">Upload In Progress</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-800">
              Your file, <strong>{bulkToast.fileName}</strong> ({bulkToast.totalRows} entries), is
              being processed. This can take up to 4 hours.
            </p>
            <p className="mt-2 text-xs text-slate-800">
              You can continue working; we’ll notify you upon completion.
            </p>
          </div>
        )}

        {bulkToast.kind === 'success' && (
          <div
            role="status"
            className="relative rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-slate-900 shadow-sm"
          >
            <button
              type="button"
              aria-label="Close upload notification"
              onClick={() => setBulkToast(null)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-950"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-sm font-bold">Upload Complete!</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-800">
              All {bulkToast.successRows} entries from <strong>{bulkToast.fileName}</strong> were
              successfully uploaded.
              <br />A detailed upload report has been sent to your email.
            </p>
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg bg-white text-xs font-semibold text-slate-900"
                onClick={() =>
                  downloadSampleCsv(
                    'bulk-upload-success-report.csv',
                    'status,email,role,granted_vans,granted_plans\nSUCCESS,user1@partner.com,Operations,VAN-1,gig-1;gig-2\nSUCCESS,user2@partner.com,Operations,VAN-1,gig-1;gig-2',
                  )
                }
              >
                Download Report
              </Button>
            </div>
          </div>
        )}

        {bulkToast.kind === 'failed' && (
          <div
            role="alert"
            className="relative rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-5 text-slate-900 shadow-sm"
          >
            <button
              type="button"
              aria-label="Close upload notification"
              onClick={() => setBulkToast(null)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-950"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-sm font-bold">Upload Failed</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-800">
              All {bulkToast.totalRows} entries failed validation during processing.
            </p>
            <p className="mt-2 text-xs text-slate-800">
              Please download the error file, correct the issues, and re-upload the file.
            </p>
            <div className="mt-3 flex items-center gap-4">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg bg-white text-xs font-semibold text-slate-900"
                onClick={() =>
                  downloadSampleCsv(
                    'bulk-upload-errors.csv',
                    'row,email,role,van_id,plan_id,error_reason\n1,bad-email@,Operations,VAN-1,gig-1,Invalid email domain\n2,user2@partner.com,Operations,VAN-99,gig-1,VAN-99 is outside your administrative scope',
                  )
                }
              >
                Download Error File
              </Button>
              <button
                type="button"
                onClick={() => setErrorGuideOpen(true)}
                className="text-xs font-bold text-slate-900 hover:underline"
              >
                How to Correct Errors
              </button>
            </div>
          </div>
        )}

        {bulkToast.kind === 'partial' && (
          <div
            role="status"
            className="relative rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-5 text-slate-900 shadow-sm"
          >
            <button
              type="button"
              aria-label="Close upload notification"
              onClick={() => setBulkToast(null)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-950"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-sm font-bold">Upload Partially Complete</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-800">
              {bulkToast.successRows} entries were uploaded successfully, but {bulkToast.failedRows}{' '}
              entries failed validation.
              <br />
              For these failed entries, please download the error file, correct the issues, and
              re-upload the file.
            </p>
            <div className="mt-3 flex items-center gap-4">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg bg-white text-xs font-semibold text-slate-900"
                onClick={() =>
                  downloadSampleCsv(
                    'bulk-upload-partial-errors.csv',
                    'row,email,role,van_id,plan_id,error_reason\n14,invalid-email-syntax,Operations,VAN-1,gig-1,Missing @ domain\n28,duplicate@partner.com,Operations,VAN-1,gig-1,Duplicate email in same CSV batch',
                  )
                }
              >
                Download Error File
              </Button>
              <button
                type="button"
                onClick={() => setErrorGuideOpen(true)}
                className="text-xs font-bold text-slate-900 hover:underline"
              >
                How to Correct Errors
              </button>
            </div>
          </div>
        )}
      </div>

      <HowToCorrectErrorsModal open={errorGuideOpen} onOpenChange={setErrorGuideOpen} />
    </>
  );
}

function HowToCorrectErrorsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>How to Correct Bulk Upload Errors</DialogTitle>
          <DialogDescription>
            Follow these validation rules when onboarding up to 200 users via CSV or batch email
            paste.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="rounded-lg border border-border p-3">
            <strong className="block text-foreground">1. Valid Corporate Email Format</strong>
            Every row must contain a valid email (`name@domain.com`). Duplicate emails within the
            same batch are skipped automatically.
          </div>
          <div className="rounded-lg border border-border p-3">
            <strong className="block text-foreground">2. Defined Partner Role Name</strong>
            The `role_name` column must match an existing role defined in Settings &gt; Access
            management (e.g., `Operations (Policies & Claims)`, `Claims & Finance Hybrid`).
          </div>
          <div className="rounded-lg border border-border p-3">
            <strong className="block text-foreground">
              3. WG &gt; VAN &gt; PLAN Scope Must Match Hierarchy &amp; Admin Scope
            </strong>
            Plans must belong to the parent VAN specified (`gig-1` and `gig-2` belong to `VAN-1`;
            `blinkit-3` belongs to `VAN-2`). Delegated Sub-Admins can only grant VANs and Plans
            within their own assigned scope.
          </div>
        </div>
        <DialogFooter>
          <Button className="finance-primary" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Contextual "Request Access" Modal triggered when a user hits a permission boundary
 * (e.g. Operations user needing Financials View on Overview, or Manual Refunds Edit from Policies/Claims).
 */
export function RequestAccessModal() {
  const {
    snapshot,
    view,
    vanAliases,
    activeRoleDefinition,
    requestAccessModal,
    setRequestAccessModal,
    submitAccessRequest,
  } = useFinancialWorkspace();

  const [selectedModules, setSelectedModules] = useState<Record<string, 'none' | 'view' | 'edit'>>({
    financials:
      requestAccessModal.defaultModule === 'financials'
        ? requestAccessModal.defaultLevel || 'view'
        : 'none',
    'manual-refunds':
      requestAccessModal.defaultModule === 'manual-refunds'
        ? requestAccessModal.defaultLevel || 'edit'
        : 'none',
    claims:
      requestAccessModal.defaultModule === 'claims'
        ? requestAccessModal.defaultLevel || 'edit'
        : 'none',
    policies:
      requestAccessModal.defaultModule === 'policies'
        ? requestAccessModal.defaultLevel || 'edit'
        : 'none',
    reports:
      requestAccessModal.defaultModule === 'reports'
        ? requestAccessModal.defaultLevel || 'view'
        : 'none',
  });
  const [selectedVans, setSelectedVans] = useState<string[]>(
    view.actor.vanIds.length ? view.actor.vanIds : ['VAN-1'],
  );
  const [selectedPlans, setSelectedPlans] = useState<string[]>(
    view.actor.planIds.length ? view.actor.planIds : ['gig-1'],
  );
  const [reason, setReason] = useState(
    'Need access to track refund payout status and verify parent VAN balance for policy cancellations.',
  );

  if (!requestAccessModal.open) return null;

  const requestedList = Object.entries(selectedModules)
    .filter(([, lvl]) => lvl !== 'none')
    .map(([mod, lvl]) => ({ module: mod as ModuleId, level: lvl as 'view' | 'edit' }));

  // Check if requesting a module creates a dependency conflict
  const needsFinancialsView =
    selectedModules['manual-refunds'] === 'edit' &&
    selectedModules.financials === 'none' &&
    activeRoleDefinition.permissions.financials === 'none';

  return (
    <Dialog open={requestAccessModal.open} onOpenChange={(v) => setRequestAccessModal({ open: v })}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-4 text-share-policy-primary" />
            Request Module or Account Access
          </DialogTitle>
          <DialogDescription>
            Current role: <strong>{activeRoleDefinition.name}</strong>. Your request will be routed
            to your Wallet Group administrators for approval.
          </DialogDescription>
        </DialogHeader>

        {requestAccessModal.triggerContext && (
          <div className="rounded-lg border border-share-recipient-border-active/30 bg-segmented-tab-active-bg/40 px-3.5 py-2.5 text-xs text-foreground">
            <strong className="text-share-policy-primary">Workflow context:</strong>{' '}
            {requestAccessModal.triggerContext}
          </div>
        )}

        <div className="space-y-4">
          {/* 1. Select Modules & Access Level (View vs Edit) using BrandSegmentedControl */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Select Modules &amp; Access Level Needed
            </p>
            <div className="space-y-2 rounded-xl border border-border p-3">
              {MODULE_METADATA.filter((m) => m.id !== 'overview' && m.id !== 'settings').map(
                (mod) => {
                  const currentPerm = activeRoleDefinition.permissions[mod.id];
                  const val = selectedModules[mod.id] || 'none';
                  return (
                    <div
                      key={mod.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-none last:pb-0 text-xs"
                    >
                      <div>
                        <span className="font-medium text-foreground">{mod.label}</span>
                        <span className="finance-neutral ml-2 rounded border px-1.5 py-0.5 text-[10px]">
                          Current: {currentPerm === 'none' ? 'No access' : currentPerm}
                        </span>
                      </div>
                      <BrandSegmentedControl
                        value={val}
                        onChange={(lvl) =>
                          setSelectedModules((prev) => ({ ...prev, [mod.id]: lvl }))
                        }
                        options={[
                          { value: 'none', label: 'Not needed' },
                          { value: 'view', label: 'View Only' },
                          { value: 'edit', label: 'View & Edit' },
                        ]}
                      />
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {needsFinancialsView && (
            <div className="finance-warning flex items-center justify-between gap-3 rounded-lg border p-3 text-xs">
              <span>
                <strong>Dependency hint:</strong> Manual Refunds (View &amp; Edit) requires{' '}
                <strong>Financials (View)</strong> to verify VAN float holds.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 bg-white text-xs text-foreground"
                onClick={() => setSelectedModules((prev) => ({ ...prev, financials: 'view' }))}
              >
                + Add Financials (View)
              </Button>
            </div>
          )}

          {/* 2. Select WG > VAN > PLAN Scope */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Select WG &gt; VAN &gt; PLAN Scope
            </p>
            <div className="space-y-2 rounded-xl border border-border p-3">
              {snapshot.vans.slice(0, 3).map((v) => {
                const alias = vanAliases[v.id] || v.label;
                const vanChecked = selectedVans.includes(v.id);
                return (
                  <div
                    key={v.id}
                    className="rounded-lg border border-border bg-pagination-background p-2.5 text-xs"
                  >
                    <label className="flex items-center gap-2 font-medium text-foreground">
                      <Checkbox
                        checked={vanChecked}
                        onCheckedChange={(on) =>
                          setSelectedVans((prev) =>
                            on ? [...prev, v.id] : prev.filter((id) => id !== v.id),
                          )
                        }
                      />
                      {alias} ({v.maskedAccount}) · {v.id}
                    </label>
                    <div className="mt-1.5 ml-6 flex flex-wrap gap-3">
                      {v.plans.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-1.5 text-muted-foreground"
                        >
                          <Checkbox
                            checked={selectedPlans.includes(p.id)}
                            onCheckedChange={(on) =>
                              setSelectedPlans((prev) =>
                                on ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                              )
                            }
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Business Justification */}
          <label className="block text-xs font-medium text-foreground">
            Business justification for administrator
            <Input
              className="mt-1 text-xs"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need this access..."
            />
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRequestAccessModal({ open: false })}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={requestedList.length === 0 || reason.trim().length < 5}
            className="finance-primary"
            onClick={() =>
              submitAccessRequest({
                requestedModules: requestedList,
                requestedVanIds: selectedVans,
                requestedPlanIds: selectedPlans,
                reason,
                triggerContext:
                  requestAccessModal.triggerContext || 'Requested from Partner Portal',
              })
            }
          >
            <Send className="size-3.5" />
            Submit Access Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Contextual Cross-Workflow Boundary Banner shown on Policy Management or Claims Management.
 * In Engineering Ready v2.0, ZERO Request Access CTAs are shown; instead it displays the
 * WG Pool Policy Issuance Paused banner when the central WG Pool is below the minimum threshold.
 */
export function CrossWorkflowAccessBoundaryBanner() {
  const {
    activeRoleDefinition,
    setRequestAccessModal,
    vanAliases,
    selectedVan,
    approachMode,
    isWgIssuanceBlocked,
    wgPoolBalanceRupees,
    effectiveMinWgBalanceRupees,
    vanContributionsRupees,
    isAckoSuperAdmin,
    view,
    wgGraceStatus,
    wgGraceDaysLeft,
    activePartnerWg,
  } = useFinancialWorkspace();

  const friendlyVan = vanAliases[selectedVan] || selectedVan;
  const hasFinancialsAccess =
    isAckoSuperAdmin ||
    view.actor.internal ||
    activeRoleDefinition.permissions.financials !== 'none';

  if (approachMode === 'engineering-ready-v3') {
    // In v3.0, 10-day grace allows policy issuance even when balance is negative!
    // Only show a pause banner when the 10-day grace window has expired.
    if (wgGraceStatus === 'grace-expired') {
      return (
        <div className="finance-danger mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0" />
            {hasFinancialsAccess ? (
              <span>
                <strong>
                  New policy issuance paused across {activePartnerWg.wgName} (10-Day Grace Expired):
                </strong>{' '}
                Global WG Pool Balance (
                <strong>
                  {wgPoolBalanceRupees < 0
                    ? `-₹${Math.abs(wgPoolBalanceRupees).toLocaleString('en-IN')}`
                    : `₹${wgPoolBalanceRupees.toLocaleString('en-IN')}`}
                </strong>
                ) is below the minimum requirement and the 10-day grace period has elapsed. Recharge
                in Financials to resume issuing new policies.
              </span>
            ) : (
              <span>
                <strong>New policy issuance is temporarily paused:</strong> Policy issuance is
                paused pending an account recharge by your Finance team. Existing policy
                endorsements, cancellations, and claims continue uninterrupted.
              </span>
            )}
          </div>
        </div>
      );
    }

    if (wgGraceStatus === 'grace-active' && hasFinancialsAccess) {
      return (
        <div className="finance-warning mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              <strong>10-day grace active ({wgGraceDaysLeft} days remaining):</strong> Policy
              issuance remains active even though the WG Pool Balance is currently negative. Please
              complete a float top-up in Financials before the grace window expires.
            </span>
          </div>
        </div>
      );
    }

    return null;
  }

  if (approachMode === 'engineering-ready-v2') {
    if (!isWgIssuanceBlocked) return null;
    const selectedVanContrib = vanContributionsRupees[selectedVan] ?? 0;
    const shortfall = Math.max(effectiveMinWgBalanceRupees - wgPoolBalanceRupees, 0);

    return (
      <div className="finance-danger mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="size-4 shrink-0" />
          {hasFinancialsAccess ? (
            <span>
              <strong>New policy issuance paused across all VANs in this Wallet Group:</strong>{' '}
              Overall WG Pool Balance (
              <strong>
                {wgPoolBalanceRupees < 0
                  ? `-₹${Math.abs(wgPoolBalanceRupees).toLocaleString('en-IN')}`
                  : `₹${wgPoolBalanceRupees.toLocaleString('en-IN')}`}
              </strong>
              ) is below the minimum required threshold (
              <strong>₹{effectiveMinWgBalanceRupees.toLocaleString('en-IN')}</strong>).
              {selectedVanContrib > 0
                ? ` Even though ${friendlyVan} (${selectedVan}) has a positive net contribution of +₹${selectedVanContrib.toLocaleString('en-IN')}, policies cannot be issued until the central WG Pool is recharged by at least ₹${shortfall.toLocaleString('en-IN')}.`
                : ` Recharge at least ₹${shortfall.toLocaleString('en-IN')} in Financials to resume policy issuance.`}
            </span>
          ) : (
            <span>
              <strong>New policy issuance paused for {friendlyVan}:</strong> Policy issuance is
              temporarily paused across this Wallet Group pending a central float recharge by your
              Finance team. Existing policy endorsements and claims remain active.
            </span>
          )}
        </div>
      </div>
    );
  }

  const needsRefundOrFinanceAccess =
    activeRoleDefinition.permissions['manual-refunds'] === 'none' ||
    activeRoleDefinition.permissions.financials === 'none';

  if (!needsRefundOrFinanceAccess) return null;

  return (
    <div className="finance-warning mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs">
      <div className="flex items-center gap-2.5">
        <Lock className="size-4 shrink-0" />
        <span>
          <strong>Role boundary ({activeRoleDefinition.name}):</strong> You have{' '}
          <strong>View &amp; Edit</strong> access for Policies &amp; Claims under{' '}
          <strong>{friendlyVan}</strong>, but <strong>Financials &amp; Manual Refunds</strong> are
          not enabled for your role. Need to track refund UTRs or VAN float balance?
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 bg-white text-xs font-medium text-foreground"
        onClick={() =>
          setRequestAccessModal({
            open: true,
            defaultModule: 'manual-refunds',
            defaultLevel: 'edit',
            triggerContext:
              'Cross-workflow handoff from Policy / Claims Management → Refund Payout & VAN Balance',
          })
        }
      >
        Request Refund &amp; Finance Access
      </Button>
    </div>
  );
}

/**
 * Complete Figma Handoff Checklist & Variant Matrix subtab inside the Simulator's
 * "Engineering ready version" tab so the designer doesn't miss a single screen, modal, or state.
 */
export function FigmaHandoffChecklist({ onClose }: { onClose?: () => void }) {
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const {
    setNamingCeremonyOpen,
    setRequestAccessModal,
    setBulkToast,
    setUamActiveTab,
    applySuggestedScenario,
  } = useFinancialWorkspace();

  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(['F-01', 'F-02', 'F-05', 'F-09', 'F-13']),
  );

  const toggleCheck = (id: string) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sections: {
    groupTitle: string;
    subtitle: string;
    items: {
      id: string;
      screen: string;
      variants: string[];
      edgeCases: string;
      previewActionLabel: string;
      onPreview: () => void;
    }[];
  }[] = [
    {
      groupTitle: '1. Universal WG > VAN > PLAN > POLICY Hierarchy & VAN Naming Ceremony',
      subtitle: 'Standardized Approach 1 across Overview, Policies, Claims, Financials & Reports',
      items: [
        {
          id: 'F-01',
          screen: 'First-Time Mandatory VAN Naming Ceremony Modal',
          variants: [
            'Default first-login setup state (3 VANs: A with 2 Plans, B with 1 Plan, C with 1 Plan)',
            'Edit existing wallet alias state (from Settings / Financials)',
            'Validation state: empty or duplicate wallet name error',
          ],
          edgeCases:
            'Partner with 1 WG → 3 VANs where VAN-1 is shared across 2 plans (Zomato Gig Plan 1 & 2). Shows "Friendly Name (•••• 1041)" everywhere once saved.',
          previewActionLabel: 'Open Naming Modal',
          onPreview: () => {
            onClose?.();
            setNamingCeremonyOpen(true);
          },
        },
        {
          id: 'F-02',
          screen: 'Overview Page · Universal WG > VAN > PLAN Selector & 6 KPI Grid',
          variants: [
            'Full Access (View: Friendly VAN Name (•••• 1041) > Plan Name + Blue VAN-consistency dot)',
            'Shared-VAN Toggling (Plan 1 vs Plan 2 under VAN-1: 5 Plan KPIs update, Today’s Balance stays consistent)',
            'Locked Today’s Balance Card (when user role has Overview = View/Edit but Financials = No Access)',
          ],
          edgeCases:
            'Operations role without Financials View sees a locked Today’s Balance card with contextual "Request Access" CTA.',
          previewActionLabel: 'Preview on Overview',
          onPreview: () => {
            applySuggestedScenario('S5-ops-only-plans');
            onClose?.();
            router.push(`/${partner}/dashboard/overview`);
          },
        },
        {
          id: 'F-03',
          screen: 'Operational Modules (Policies & Claims) with WG > VAN > PLAN Context Bar',
          variants: [
            'Standard Policy / Claims list filtered by VAN > Plan',
            'Cross-workflow permission boundary banner (e.g., cancelling policy when Manual Refunds = No Access)',
          ],
          edgeCases:
            'Hidden sidebar modules for unpermitted routes + contextual "Request Access" trigger when workflow crosses module boundary.',
          previewActionLabel: 'Preview on Policies',
          onPreview: () => {
            applySuggestedScenario('S5-ops-only-plans');
            onClose?.();
            router.push(`/${partner}/dashboard/policy-management`);
          },
        },
        {
          id: 'F-04',
          screen: 'Financials Ledger · Shared-VAN Co-Plan Attribution Masking',
          variants: [
            'All Permitted VANs view vs Single VAN view',
            'Shared VAN with Full Plan Access (both Plan 1 & Plan 2 debits visible)',
            'Shared VAN with Partial Plan Access (Plan 1 visible, Plan 2 masked as "Restricted attribution")',
          ],
          edgeCases:
            'User granted VAN-1 + only Zomato Gig Plan 1 sees true VAN-1 balance (₹2,00,234) while Plan 2 debits are masked in ledger & CSV.',
          previewActionLabel: 'Preview Masked Ledger',
          onPreview: () => {
            applySuggestedScenario('S3-plan-a1-masked-coplan');
            onClose?.();
            router.push(`/${partner}/dashboard/financials`);
          },
        },
      ],
    },
    {
      groupTitle: '2. Modular Role-First UAM (Define Role Matrix → Map Users & Scope)',
      subtitle: 'Reusable Role Definitions + Live Workflow Conflict Detection + Scoped Sub-Admins',
      items: [
        {
          id: 'F-05',
          screen: 'UAM Tab 1: Roles & Permissions Builder + Conflict Detection Engine',
          variants: [
            'Role List Cards (System templates vs Custom partner roles + assigned user count)',
            'Create / Edit Role Matrix (7 Modules × No Access / View Only / View & Edit)',
            'Amber Conflict Alert (Overview enabled without Financials View)',
            'Red Workflow Conflict Alert (Policy Edit enabled without Manual Refunds View, or Manual Refunds Edit without Financials View)',
          ],
          edgeCases: '1-click "Auto-resolve conflict" button vs "Keep strict scope" confirmation.',
          previewActionLabel: 'Open Role Builder',
          onPreview: () => {
            applySuggestedScenario('S1-wg-full');
            setUamActiveTab('roles');
            onClose?.();
            router.push(`/${partner}/dashboard/settings/access-management`);
          },
        },
        {
          id: 'F-06',
          screen: 'UAM Tab 2: Users Directory (Super Admin vs Delegated Sub-Admin vs Smaller User)',
          variants: [
            'Super Admin View (Full 1-WG scope across 3 VANs & 4 Plans)',
            'Delegated Sub-Admin View (Scoped to VAN-1 & Zom Gig 1/2; other rows show "Outside your scope")',
            'Smaller-Access User Self-Service View ("My Access & Permissions" + Admin contact list + Request Access CTA)',
          ],
          edgeCases:
            'Self-edit prevention ("Your account" disabled) and strict over-grant prevention for Sub-Admins.',
          previewActionLabel: 'Open UAM Directory',
          onPreview: () => {
            applySuggestedScenario('S1-wg-full');
            setUamActiveTab('users');
            onClose?.();
            router.push(`/${partner}/dashboard/settings/access-management`);
          },
        },
        {
          id: 'F-07',
          screen: 'Single User Invite / Edit Modal (Role Selection + WG > VAN > PLAN Tree)',
          variants: [
            'Step 1: Select Defined Role + preview module permissions',
            'Step 2: Nested WG > VAN > PLAN checkbox tree with "Select VAN + all attached plans"',
            'Step 3: Shared-VAN partial-plan disclosure banner + Review confirmation step',
          ],
          edgeCases:
            'Selecting VAN-1 with only Plan 1 (excluding Plan 2) triggers the shared-account disclosure banner.',
          previewActionLabel: 'Open UAM & Click Invite',
          onPreview: () => {
            applySuggestedScenario('S1-wg-full');
            setUamActiveTab('users');
            onClose?.();
            router.push(`/${partner}/dashboard/settings/access-management`);
          },
        },
      ],
    },
    {
      groupTitle: '3. Bulk 200-User Onboarding & Async Upload Toast States',
      subtitle: 'Single-role 200-email batch paste + Multi-role CSV upload + 4 Toast states',
      items: [
        {
          id: 'F-08',
          screen: 'Bulk Upload Users Modal (Up to 200+ Users)',
          variants: [
            'Mode A: Same Access Batch (Pick 1 Role + WG > VAN > PLAN scope → Paste up to 200 emails)',
            'Mode B: Multi-Role CSV Upload (Drag & drop CSV + Download sample CSV template)',
            'Pre-flight Validation Summary (Valid rows, Duplicate emails, Invalid syntax, Out-of-scope VANs)',
          ],
          edgeCases:
            'Handles 200 users in one go; allows skipping invalid rows or downloading error CSV.',
          previewActionLabel: 'Open UAM Bulk Upload',
          onPreview: () => {
            applySuggestedScenario('S1-wg-full');
            setUamActiveTab('users');
            onClose?.();
            router.push(`/${partner}/dashboard/settings/access-management`);
          },
        },
        {
          id: 'F-09',
          screen: 'Async Upload Banner Toasts (4 States from Reference Design)',
          variants: [
            'State 1: Upload In Progress (Warm Cream #FEFCE8)',
            'State 2: Upload Complete! (Soft Mint Green #F0FDF4 + Download Report CTA)',
            'State 3: Upload Failed — 100% failed (Soft Rose #FEF2F2 + Download Error File + How to Correct Errors)',
            'State 4: Upload Partially Complete — e.g. 180 succeeded, 20 failed (Soft Peach #FFF1F2 + Download Error File)',
          ],
          edgeCases:
            'Includes "How to Correct Errors" modal explaining email syntax, role name matching, and VAN > Plan scope rules.',
          previewActionLabel: 'Trigger Partial Toast',
          onPreview: () => {
            setBulkToast({
              kind: 'partial',
              fileName: 'September_2026_Partner_Users.csv',
              totalRows: 200,
              successRows: 180,
              failedRows: 20,
            });
            onClose?.();
          },
        },
      ],
    },
    {
      groupTitle: '4. Request Access, Grant/Approve Workflows & Right-to-Left Notifications',
      subtitle: 'Contextual Request Access modal + Admin Approval Queue + Notification Drawer',
      items: [
        {
          id: 'F-10',
          screen: 'Contextual "Request Access" Modal (User-Initiated)',
          variants: [
            'Triggered from Locked Overview Balance Card or Policy/Claims Cross-Workflow Banner',
            'Module & Level selector (View Only vs View & Edit) + Dependency hint',
            'WG > VAN > PLAN scope selector + Business justification input',
          ],
          edgeCases:
            'Auto-detects if requesting Manual Refunds (Edit) also requires Financials (View) and offers a 1-click add.',
          previewActionLabel: 'Open Request Access Modal',
          onPreview: () => {
            onClose?.();
            setRequestAccessModal({
              open: true,
              defaultModule: 'manual-refunds',
              defaultLevel: 'edit',
              triggerContext: 'Triggered from Policy Cancellation → Refund Payout Retry',
            });
          },
        },
        {
          id: 'F-11',
          screen: 'UAM Tab 3: Admin Access Requests Queue (Approve / Modify / Reject)',
          variants: [
            'Pending Requests queue with requester role, current vs requested modules, and trigger context',
            'Approve as-is vs Modify & Approve (e.g., downgrade Edit to View Only or restrict VAN/Plan) vs Reject with reason',
            'Resolved audit history (Approved, Modified, Rejected states)',
          ],
          edgeCases:
            'Approving immediately updates the requester’s role/scope and sends a real-time notification.',
          previewActionLabel: 'Open Access Requests Tab',
          onPreview: () => {
            applySuggestedScenario('S1-wg-full');
            setUamActiveTab('requests');
            onClose?.();
            router.push(`/${partner}/dashboard/settings/access-management`);
          },
        },
        {
          id: 'F-12',
          screen: 'Right-to-Left Contextual Notifications Drawer (Reference Design)',
          variants: [
            'Category Pill Tabs: All | Alerts | Tasks | Mentions | Approvals + Red "X new" badge',
            'Alert cards (Upload In Progress / Partial Complete with Download Error File, Low VAN Balance)',
            'Approval cards with inline [Approve access] [Approve as View-only] [Decline] buttons',
            'Task & Mention cards (@mention escalation with deep link)',
          ],
          edgeCases:
            'Role-scoped: users only receive notifications for VANs and Plans within their granted scope.',
          previewActionLabel: 'Use Bell Icon in Header',
          onPreview: () => {
            onClose?.();
            toast.info(
              'Click the Bell icon in the top-right header to open the Notifications sidebar.',
            );
          },
        },
      ],
    },
  ];

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className="space-y-5 text-foreground">
      <div className="rounded-metric-card border border-share-recipient-border-active/30 bg-icon-select-accent-bg/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="finance-primary inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold">
              FIGMA DESIGN HANDOFF INVENTORY
            </span>
            <h3 className="mt-1.5 text-base font-semibold text-foreground">
              Complete Screen, Modal &amp; Edge-Case Checklist ({checkedIds.size}/{totalItems}{' '}
              Reviewed)
            </h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() =>
              downloadSampleCsv(
                'figma-handoff-checklist-partner-portal.csv',
                [
                  'ID,Category,Screen / Component,Variants Required,Edge Cases Covered',
                  ...sections.flatMap((s) =>
                    s.items.map(
                      (i) =>
                        `"${i.id}","${s.groupTitle}","${i.screen}","${i.variants.join(' | ')}","${i.edgeCases}"`,
                    ),
                  ),
                ].join('\n'),
              )
            }
          >
            <Download className="size-3.5" />
            Export Checklist CSV
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Every screen and variant below is built and interactive in this simulator. Click{' '}
          <strong className="text-foreground">Preview</strong> on any row to jump directly to that
          screen or modal state.
        </p>
      </div>

      {sections.map((sec) => (
        <div key={sec.groupTitle} className="space-y-2.5">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-share-policy-primary">
              {sec.groupTitle}
            </h4>
            <p className="text-xs text-muted-foreground">{sec.subtitle}</p>
          </div>
          <div className="space-y-2.5">
            {sec.items.map((item) => {
              const done = checkedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-xl border p-3.5 transition',
                    done
                      ? 'border-endorse-policy-badge-success-border bg-endorse-policy-badge-success-bg/30'
                      : 'border-border bg-white',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={done}
                        onCheckedChange={() => toggleCheck(item.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-share-policy-primary">
                          {item.id}
                        </span>{' '}
                        <span className="text-sm font-semibold text-foreground">{item.screen}</span>
                      </div>
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={item.onPreview}
                    >
                      {item.previewActionLabel}
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                  <div className="mt-2 ml-6 space-y-1 text-xs">
                    <p className="font-medium text-foreground">Variants to design in Figma:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      {item.variants.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                    <p className="pt-1 text-[11px] text-muted-foreground">
                      <strong className="text-foreground">Edge case covered:</strong>{' '}
                      {item.edgeCases}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Guided Stories specifically for the Engineering Ready Version.
 */
const ENGINEERING_STORIES: {
  id: string;
  persona: string;
  title: string;
  jtbd: string;
  route: string;
  setup: (ctx: ReturnType<typeof useFinancialWorkspace>) => void;
}[] = [
  {
    id: 'ENG-01',
    persona: 'Partner Super Admin · First-Time Setup',
    title: 'Mandatory VAN Naming Ceremony & Universal WG > VAN > PLAN Selector',
    jtbd: 'Rename raw Acko VAN numbers (•••• 1041, •••• 1042) to relatable business float names and verify they appear as "Friendly Name (•••• 1041) > Plan" across Overview and Financials.',
    route: 'overview',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.setNamingCeremonyOpen(true);
    },
  },
  {
    id: 'ENG-02',
    persona: 'Partner Super Admin · Modular UAM Role Builder',
    title: 'Define Custom Partner Role & Resolve Cross-Module Workflow Conflicts',
    jtbd: 'Inspect the "Operations (Policies & Claims)" role where Overview & Policy Edit are enabled but Financials & Manual Refunds are No Access, and review the automatic conflict warnings.',
    route: 'settings/access-management',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.setUamActiveTab('roles');
    },
  },
  {
    id: 'ENG-03',
    persona: 'Partner Super Admin · Bulk Onboarding (200 Users)',
    title: 'Bulk Upload 200 Users Across Access Levels & Handle Partial Validation Errors',
    jtbd: 'Batch-assign 200 user emails to a defined Role + WG > VAN > PLAN scope, observe the async Upload Toast states (Uploading → Partial Complete / Success), and download the error CSV.',
    route: 'settings/access-management',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.setUamActiveTab('users');
      ctx.setBulkToast({
        kind: 'partial',
        fileName: 'September_2026_Endorsements_Users.csv',
        totalRows: 1000,
        successRows: 800,
        failedRows: 200,
      });
    },
  },
  {
    id: 'ENG-04',
    persona: 'Operations Persona (Vikram Nair) → Admin Approval',
    title: 'Hidden Sidebar Modules + Contextual "Request Access" at Workflow Boundary',
    jtbd: 'Experience the portal as an Operations user (Financials & Reports hidden from sidebar, Today’s Balance locked on Overview), trigger "Request Access", and approve it as Super Admin.',
    route: 'overview',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S5-ops-only-plans');
    },
  },
  {
    id: 'ENG-05',
    persona: 'Claims & Finance Hybrid (Travel / Credit Partner Persona)',
    title:
      'Cross-Domain Persona: Claims (Edit) + Financials (View & Dispute) under WG > VAN > PLAN',
    jtbd: 'Navigate seamlessly between Claims Management, Manual Refunds, and Financials using the unified WG > VAN > PLAN hierarchy.',
    route: 'overview',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S4-single-van-b-c');
    },
  },
  {
    id: 'ENG-06',
    persona: 'Delegated Sub-Admin (Riya Sharma · Zomato VAN-1)',
    title: 'Scoped Sub-Admin UAM & Shared-VAN Co-Plan Attribution Masking',
    jtbd: 'Manage users strictly within VAN-1 (Zomato Gig Plan 1 & 2) while Blinkit/District users are locked as "Outside your scope".',
    route: 'settings/access-management',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S2-van-a-shared');
      ctx.setUamActiveTab('users');
    },
  },
];

/**
 * Sub-tabbed workspace rendered inside `SimulatorStudio` when the "Engineering ready version" tab is active.
 */
export function EngineeringReadySimulatorView({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  const [subTab, setSubTab] = useState<'controls' | 'stories' | 'deliverables' | 'figma'>(
    'controls',
  );
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const ctx = useFinancialWorkspace();

  return (
    <div className="space-y-4">
      {/* Sub-navigation inside Engineering Ready Version using Partner Portal SegmentedTabs */}
      <SegmentedTabs
        value={subTab}
        onValueChange={(v) => setSubTab(v as 'controls' | 'stories' | 'deliverables' | 'figma')}
        tabs={[
          { value: 'controls', label: 'Controls' },
          { value: 'stories', label: `Stories (${ENGINEERING_STORIES.length})` },
          { value: 'deliverables', label: 'Deliverables' },
          { value: 'figma', label: 'Figma Handoff Checklist' },
        ]}
      />

      {subTab === 'figma' ? (
        <FigmaHandoffChecklist onClose={onClose} />
      ) : subTab === 'deliverables' ? (
        <Deliverables />
      ) : subTab === 'stories' ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Click <strong>Play story</strong> to load the persona, permissions, and screen state for
            the Engineering Ready Version.
          </p>
          {ENGINEERING_STORIES.map((st) => (
            <div key={st.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-share-policy-primary">
                    {st.id} · {st.persona}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-foreground">{st.title}</h4>
                </div>
                <Button
                  size="sm"
                  className="finance-primary text-xs"
                  onClick={() => {
                    st.setup(ctx);
                    onClose?.();
                    router.push(`/${partner}/dashboard/${st.route}`);
                  }}
                >
                  Play story
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{st.jtbd}</p>
            </div>
          ))}
        </div>
      ) : (
        /* Controls sub-tab for Engineering Ready Version */
        <div className="space-y-5">
          {/* Quick Interactive Triggers for New Engineering-Ready Features */}
          <div className="rounded-xl border border-share-recipient-border-active/30 bg-icon-select-accent-bg/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Engineering-Ready Quick Triggers (Approach 1: WG &gt; VAN &gt; PLAN &gt; POLICY)
              </span>
              <span className="text-xs font-medium text-share-policy-primary">
                Active Role: {ctx.activeRoleDefinition.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="justify-start bg-white text-xs"
                onClick={() => {
                  onClose?.();
                  ctx.setNamingCeremonyOpen(true);
                }}
              >
                <Tag className="size-3.5 text-share-policy-primary" />
                1. Open VAN Naming Ceremony
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start bg-white text-xs"
                onClick={() => {
                  ctx.applySuggestedScenario('S1-wg-full');
                  ctx.setUamActiveTab('roles');
                  onClose?.();
                  router.push(`/${partner}/dashboard/settings/access-management`);
                }}
              >
                <ShieldCheck className="size-3.5 text-share-policy-primary" />
                2. Open Role Builder &amp; Conflicts
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start bg-white text-xs"
                onClick={() => {
                  onClose?.();
                  ctx.setRequestAccessModal({
                    open: true,
                    defaultModule: 'manual-refunds',
                    defaultLevel: 'edit',
                    triggerContext: 'Triggered from Policy Cancellation → Refund Payout',
                  });
                }}
              >
                <Lock className="size-3.5 text-share-policy-primary" />
                3. Open Request Access Modal
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start bg-white text-xs"
                onClick={() => {
                  ctx.applySuggestedScenario('S1-wg-full');
                  ctx.setUamActiveTab('requests');
                  onClose?.();
                  router.push(`/${partner}/dashboard/settings/access-management`);
                }}
              >
                <UserCheck className="size-3.5 text-share-policy-primary" />
                4. Open Admin Approval Queue (
                {ctx.accessRequests.filter((r) => r.status === 'pending').length})
              </Button>
            </div>

            {/* Bulk Upload Toast State Simulator (matches reference image) */}
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-foreground mb-2">
                Preview Bulk Upload Toast States (from Reference Design):
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-upload-toast-pending border-endorse-policy-notice-border text-[11px] text-upload-toast-text"
                  onClick={() => {
                    ctx.setBulkToast({
                      kind: 'uploading',
                      fileName: 'September 2025 Endorsements.xlsx',
                      totalRows: 1000,
                      successRows: 1000,
                      failedRows: 0,
                    });
                    onClose?.();
                  }}
                >
                  Uploading
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-upload-toast-success border-promo-card-badge-success-border text-[11px] text-upload-toast-text"
                  onClick={() => {
                    ctx.setBulkToast({
                      kind: 'success',
                      fileName: 'September 2025 Endorsements.xlsx',
                      totalRows: 1000,
                      successRows: 1000,
                      failedRows: 0,
                    });
                    onClose?.();
                  }}
                >
                  Success (1000)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-[#FFF1F2] border-[#FECDD3] text-[11px] text-upload-toast-text"
                  onClick={() => {
                    ctx.setBulkToast({
                      kind: 'partial',
                      fileName: 'September 2025 Endorsements.xlsx',
                      totalRows: 1000,
                      successRows: 800,
                      failedRows: 200,
                    });
                    onClose?.();
                  }}
                >
                  Partial (800/200)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-upload-toast-error border-inline-form-error-border text-[11px] text-upload-toast-text"
                  onClick={() => {
                    ctx.setBulkToast({
                      kind: 'failed',
                      fileName: 'September 2025 Endorsements.xlsx',
                      totalRows: 1000,
                      successRows: 0,
                      failedRows: 1000,
                    });
                    onClose?.();
                  }}
                >
                  Failed (1000)
                </Button>
              </div>
            </div>
          </div>

          {/* Standard Simulator Controls */}
          {children}
        </div>
      )}
    </div>
  );
}
/* ============================================================================
 * ENGINEERING READY VERSION 2.0 COMPONENTS:
 * 1. AckoMinWgBalancePanel & AckoMinWgBalanceModal (Fixed ₹ vs % of Monthly GWP Run-rate)
 * 2. FigmaHandoffChecklistV2
 * 3. EngineeringReadyV2SimulatorView
 * ============================================================================ */

export function AckoMinWgBalancePanel({ onClose }: { onClose?: () => void }) {
  const {
    snapshot,
    view,
    wgMinThresholdConfig,
    updateWgMinThresholdConfig,
    wgPoolBalanceRupees,
    effectiveMinWgBalanceRupees,
    isWgIssuanceBlocked,
    isAckoSuperAdmin,
    setIsAckoSuperAdmin,
    vanContributionsRupees,
    vanAliases,
  } = useFinancialWorkspace();

  const [mode, setMode] = useState<'fixed' | 'gwp-percentage'>(wgMinThresholdConfig.mode);
  const [fixedAmount, setFixedAmount] = useState<string>(
    String(wgMinThresholdConfig.fixedAmountRupees),
  );
  const [gwpPct, setGwpPct] = useState<string>(String(wgMinThresholdConfig.gwpPercentage));

  const canEditThreshold = isAckoSuperAdmin || view.actor.internal;
  const parsedFixed = Math.max(0, Number(fixedAmount.replace(/[^0-9]/g, '')) || 0);
  const parsedPct = Math.min(100, Math.max(0, Number(gwpPct) || 0));
  const previewMinRupees =
    mode === 'fixed'
      ? parsedFixed
      : Math.round((wgMinThresholdConfig.monthlyGwpRunRateRupees * parsedPct) / 100);
  const previewBlocked = wgPoolBalanceRupees < previewMinRupees || wgPoolBalanceRupees < 0;
  const previewShortfall = Math.max(0, previewMinRupees - wgPoolBalanceRupees);

  return (
    <div className="space-y-4 text-xs text-foreground">
      {/* ACKO Super Admin vs Partner View Mode Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-share-recipient-border-active/30 bg-segmented-tab-active-bg/35 px-4 py-3">
        <div>
          <span className="font-semibold text-foreground">
            {canEditThreshold
              ? 'ACKO Super Admin Login Active · Editable Underwriting & Treasury Guardrail'
              : 'Partner View (Read-Only Guardrail Configured by ACKO Super Admin)'}
          </span>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Last updated by {wgMinThresholdConfig.updatedBy} · {wgMinThresholdConfig.updatedAt}
          </p>
        </div>
        <Button
          size="sm"
          variant={canEditThreshold ? 'default' : 'outline'}
          className={cn('h-7 text-xs', canEditThreshold && 'finance-primary')}
          onClick={() => setIsAckoSuperAdmin(!isAckoSuperAdmin)}
        >
          <ShieldCheck className="size-3.5" />
          {canEditThreshold
            ? 'Viewing as ACKO Super Admin (Click for Partner View)'
            : 'Switch to ACKO Super Admin to Edit'}
        </Button>
      </div>

      {/* Step 1: Select Threshold Calculation Basis */}
      <div className="rounded-xl border border-border bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-foreground">
              1. Minimum WG Balance Threshold Mode ({snapshot.groupName})
            </p>
            <p className="text-[11px] text-muted-foreground">
              Policy issuance across all contributing/drawing VANs is automatically paused if the
              central WG Pool drops below this threshold.
            </p>
          </div>
          <BrandSegmentedControl
            value={mode}
            onChange={(val) => {
              if (!canEditThreshold) {
                toast.info('Switch to ACKO Super Admin login above to edit the threshold mode.');
                return;
              }
              setMode(val);
            }}
            options={[
              { value: 'gwp-percentage', label: '% of Monthly GWP Run-rate' },
              { value: 'fixed', label: 'Fixed Amount (₹)' },
            ]}
          />
        </div>

        {mode === 'gwp-percentage' ? (
          <div className="space-y-3 rounded-lg border border-border bg-pagination-background p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">
                  Percentage (%) of Monthly GWP Run-rate
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {snapshot.groupName} Monthly GWP Run-rate across all active plans:{' '}
                  <strong className="text-foreground">
                    ₹{wgMinThresholdConfig.monthlyGwpRunRateRupees.toLocaleString('en-IN')}/month
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  disabled={!canEditThreshold}
                  value={gwpPct}
                  onChange={(e) => setGwpPct(e.target.value)}
                  className="h-8 w-24 bg-white text-right font-semibold text-xs"
                />
                <span className="font-semibold text-foreground">% of Monthly GWP</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground mr-1">Quick presets:</span>
              {[10, 15, 20, 25, 35].map((pct) => (
                <Button
                  key={pct}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canEditThreshold}
                  className={cn(
                    'h-7 text-xs bg-white',
                    parsedPct === pct &&
                      'border-share-recipient-border-active bg-segmented-tab-active-bg text-segmented-tab-active-text',
                  )}
                  onClick={() => setGwpPct(String(pct))}
                >
                  {pct}% (₹
                  {Math.round(
                    (wgMinThresholdConfig.monthlyGwpRunRateRupees * pct) / 100,
                  ).toLocaleString('en-IN')}
                  )
                </Button>
              ))}
            </div>

            <div className="rounded-md border border-border bg-white px-3 py-2 text-[11px]">
              <strong>Formula:</strong> {parsedPct}% × ₹
              {wgMinThresholdConfig.monthlyGwpRunRateRupees.toLocaleString('en-IN')} (Monthly GWP
              Run-rate: Zomato Gig 1 ₹1,20,322 + Zomato Gig 2 ₹84,500 + Blinkit ₹3,10,450 + District
              ₹96,800 + Hyperpure ₹52,900) ={' '}
              <strong className="text-share-policy-primary">
                ₹{previewMinRupees.toLocaleString('en-IN')} Minimum WG Balance
              </strong>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-border bg-pagination-background p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">Fixed Minimum WG Balance Floor (₹)</p>
                <p className="text-[11px] text-muted-foreground">
                  Static rupee floor required in the central Wallet Group Pool regardless of monthly
                  GWP volume.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">₹</span>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  disabled={!canEditThreshold}
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="h-8 w-36 bg-white text-right font-semibold text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground mr-1">Quick presets:</span>
              {[0, 50000, 100000, 150000, 250000].map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canEditThreshold}
                  className={cn(
                    'h-7 text-xs bg-white',
                    parsedFixed === amt &&
                      'border-share-recipient-border-active bg-segmented-tab-active-bg text-segmented-tab-active-text',
                  )}
                  onClick={() => setFixedAmount(String(amt))}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Live Impact Preview on Current WG Pool & Contributing VANs */}
      <div className="rounded-xl border border-border bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-foreground">
            2. Live Solvency Impact on {snapshot.groupName} VANs
          </span>
          <span
            className={cn(
              'rounded-md border px-2.5 py-0.5 font-semibold',
              previewBlocked ? 'finance-danger' : 'finance-success',
            )}
          >
            {previewBlocked
              ? `Policy Issuance Paused Across All VANs (Shortfall: ₹${previewShortfall.toLocaleString('en-IN')})`
              : 'All VANs Cleared for Policy Issuance'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-lg border border-border bg-pagination-background p-3">
            <span className="block text-[11px] text-muted-foreground">
              Current WG Pool (Σ VANs)
            </span>
            <span
              className={cn(
                'mt-1 block text-base font-bold tabular-nums',
                wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-foreground',
              )}
            >
              {wgPoolBalanceRupees < 0
                ? `-₹${Math.abs(wgPoolBalanceRupees).toLocaleString('en-IN')}`
                : `₹${wgPoolBalanceRupees.toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-pagination-background p-3">
            <span className="block text-[11px] text-muted-foreground">
              Preview Min Required WG Balance
            </span>
            <span className="mt-1 block text-base font-bold tabular-nums text-share-policy-primary">
              ₹{previewMinRupees.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-pagination-background p-3">
            <span className="block text-[11px] text-muted-foreground">Active Guardrail Saved</span>
            <span className="mt-1 block text-base font-bold tabular-nums text-foreground">
              ₹{effectiveMinWgBalanceRupees.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          <strong>Contributing VANs:</strong>{' '}
          {snapshot.vans
            .slice(0, 3)
            .map((v) => {
              const val = vanContributionsRupees[v.id] ?? 0;
              return `${vanAliases[v.id] || v.id} (${v.id}): ${val < 0 ? `-₹${Math.abs(val).toLocaleString('en-IN')}` : `+₹${val.toLocaleString('en-IN')}`}`;
            })
            .join(' · ')}
        </p>

        {canEditThreshold && (
          <div className="flex justify-end gap-2 pt-1">
            {onClose && (
              <Button size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              className="finance-primary"
              onClick={() => {
                updateWgMinThresholdConfig({
                  mode,
                  fixedAmountRupees: parsedFixed,
                  gwpPercentage: parsedPct,
                });
                onClose?.();
              }}
            >
              <ShieldCheck className="size-3.5" />
              Save Minimum WG Balance Rule
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AckoMinWgBalanceModal() {
  const { ackoThresholdModalOpen, setAckoThresholdModalOpen } = useFinancialWorkspace();
  return (
    <Dialog open={ackoThresholdModalOpen} onOpenChange={setAckoThresholdModalOpen}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-share-policy-primary" />
            Minimum Wallet Group (WG) Balance Requirement
          </DialogTitle>
          <DialogDescription>
            ACKO Super Admin underwriting guardrail: defines the minimum central WG Pool balance
            (either Fixed ₹ or % of Monthly GWP Run-rate) required for policy issuance across all
            VANs.
          </DialogDescription>
        </DialogHeader>
        <AckoMinWgBalancePanel onClose={() => setAckoThresholdModalOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Guided Stories for Engineering Ready Version 2.0
 */
const ENGINEERING_V2_STORIES: {
  id: string;
  persona: string;
  title: string;
  jtbd: string;
  route: string;
  setup: (ctx: ReturnType<typeof useFinancialWorkspace>) => void;
}[] = [
  {
    id: 'V2-01',
    persona: 'Partner Super Admin / Finance · Separated Overview Layout',
    title: 'Separated WG Pool Balance (Top) + Policy & Claim Metrics by VAN > Plan (Bottom)',
    jtbd: 'Verify that WG Pool Balance (₹2,00,234 Low) sits cleanly above the VAN > Plan selector while switching plans only updates the 5 operational Policy & Claim KPIs below.',
    route: 'overview',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.applyWgPoolPreset('wireframe-low-200k');
      ctx.updateWgMinThresholdConfig({ mode: 'gwp-percentage', gwpPercentage: 15 });
    },
  },
  {
    id: 'V2-02',
    persona: 'Operations / Finance · Negative WG Pool (-₹1L) Blocks Positive VAN 1 (+₹2L)',
    title:
      'Negative Overall WG Pool (-₹1,00,000) Pauses Issuance Even on Positive VAN 1 (+₹2,00,000)',
    jtbd: 'Inspect the exact prompt scenario where VAN 1 has +₹2,00,000 and VAN 2 has -₹3,00,000 (WG Pool = -₹1,00,000). Verify the contextual banner explaining why VAN 1 cannot issue policies until the WG Pool is recharged.',
    route: 'overview',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.applyWgPoolPreset('negative-wg-blocks-positive-van');
      ctx.setSelectedPlanId('gig-1');
    },
  },
  {
    id: 'V2-03',
    persona: 'Partner Treasury · 1 Deposit VAN (+₹5L) + 2 Issuance VANs (-₹1.8L, -₹1.2L)',
    title: 'Deposit Hub VAN 1 Funding Issuance-Only VAN 2 & VAN 3 Under Positive WG Pool (+₹2L)',
    jtbd: 'Switch the selector to Blinkit (VAN-2: -₹1,80,000) or District (VAN-3: -₹1,20,000) and verify the contextual banner confirming that negative VAN balances are expected drawdowns covered by the +₹2,00,000 WG Pool.',
    route: 'overview',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.applyWgPoolPreset('deposit-van-plus-issuance-vans');
      ctx.setSelectedPlanId('blinkit-3');
    },
  },
  {
    id: 'V2-04',
    persona: 'ACKO Super Admin · Minimum WG Threshold (% of Monthly GWP Run-rate)',
    title: 'Configure 15% of Monthly GWP Run-rate (₹99,746) & Pause WG +₹80,000 Scenario',
    jtbd: 'Load the WG +₹80,000 scenario (VAN 1: +1L, VAN 2: +80k, VAN 3: -1L) and see how ACKO Super Admin’s 15% Monthly GWP Run-rate requirement (₹99,746) pauses issuance until a ₹19,746 recharge or threshold adjustment.',
    route: 'overview',
    setup: (ctx) => {
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.applyWgPoolPreset('positive-wg-80k');
      ctx.setIsAckoSuperAdmin(true);
      ctx.updateWgMinThresholdConfig({ mode: 'gwp-percentage', gwpPercentage: 15 });
      ctx.setAckoThresholdModalOpen(true);
    },
  },
  {
    id: 'V2-05',
    persona: 'Pure Operations Persona (Vikram Nair · Financials = No Access)',
    title: 'Zero "Request Access" CTAs + Clean Operational Issuance Pause Banner',
    jtbd: 'Experience Overview and Policy Management as an Operations user: WG Pool Balance financial numbers are completely hidden with ZERO Request Access CTAs, and an operational pause banner explains when issuance is paused.',
    route: 'overview',
    setup: (ctx) => {
      ctx.setIsAckoSuperAdmin(false);
      ctx.applySuggestedScenario('S5-ops-only-plans');
      ctx.applyWgPoolPreset('negative-wg-blocks-positive-van');
    },
  },
  {
    id: 'V2-06',
    persona: 'Scoped Sub-Admin (Riya Sharma · Granted Only VAN-1)',
    title: 'Scoped User Reconciliation on Financials (Granted VANs + Restricted VANs = WG Pool)',
    jtbd: 'Open Financials as a scoped user with access only to VAN-1 and verify how the reconciliation bar reconciles Granted VANs (+₹1,00,000) + Other Restricted VANs (-₹20,000) = WG Pool (+₹80,000).',
    route: 'financials',
    setup: (ctx) => {
      ctx.setIsAckoSuperAdmin(false);
      ctx.applySuggestedScenario('S2-van-a-shared');
      ctx.applyWgPoolPreset('positive-wg-80k');
    },
  },
];

export function FigmaHandoffChecklistV2({ onClose }: { onClose?: () => void }) {
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const ctx = useFinancialWorkspace();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(['V2-F01', 'V2-F02', 'V2-F03', 'V2-F04', 'V2-F05', 'V2-F06']),
  );

  const toggle = (id: string) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const items = [
    {
      id: 'V2-F01',
      screen: 'Overview · Separated WG Pool Balance (Top) + Policy & Claim Metrics (Bottom)',
      variants: [
        'Top Section: WG Pool Balance header + Today’s balance card (Low / Healthy / Issuance Paused) + VAN Contribution Split & Min WG Guardrail',
        'Bottom Section: Policy and claim metrics · November 2025 + VAN: View: Friendly Name (•••• 1041) > Plan Name selector + 5-card grid (3 top, 2 bottom)',
        'Pure Operations View (Financials = No Access): WG Pool Balance section completely hidden with ZERO Request Access CTAs',
      ],
      edgeCase:
        'Switching VAN > Plan only updates the 5 operational cards below; WG Pool Balance stays anchored at the top.',
      onPreview: () => {
        ctx.setIsAckoSuperAdmin(false);
        ctx.applySuggestedScenario('S1-wg-full');
        ctx.applyWgPoolPreset('wireframe-low-200k');
        onClose?.();
        router.push(`/${partner}/dashboard/overview`);
      },
    },
    {
      id: 'V2-F02',
      screen:
        'Contextual Solvency Banners · Negative WG Blocks Positive VAN vs. Positive WG Covers Drawdown VAN',
      variants: [
        'Red Solvency Block Banner: WG Pool (-₹1,00,000) < Min Threshold while selected VAN-1 is +₹2,00,000 (explains why VAN-1 cannot issue policies)',
        'Blue Drawdown Info Banner: WG Pool (+₹2,00,000) > Min Threshold while selected VAN-2 is -₹1,80,000 (explains net issuance drawdown from central pool)',
        'Pure Ops Operational Pause Banner (when WG Pool is below threshold and user has Financials = No Access — zero financial numbers, zero Request Access CTA)',
      ],
      edgeCase:
        'Handles the 1 Deposit VAN (+₹5L) + 2 Issuance VANs (-₹1.8L, -₹1.2L) partner pattern without false deficit alarms.',
      onPreview: () => {
        ctx.applySuggestedScenario('S1-wg-full');
        ctx.applyWgPoolPreset('negative-wg-blocks-positive-van');
        onClose?.();
        router.push(`/${partner}/dashboard/overview`);
      },
    },
    {
      id: 'V2-F03',
      screen: 'ACKO Super Admin Login · Minimum WG Balance Requirement Configurator',
      variants: [
        'Mode 1: % of Monthly GWP Run-rate (e.g. 15% × ₹6,64,972 = ₹99,746) with live formula & quick presets',
        'Mode 2: Fixed Rupee Floor (e.g. ₹50,000 / ₹1,50,000)',
        'Partner Read-Only Guardrail View vs ACKO Super Admin Editable View + Live Solvency Impact Preview',
      ],
      edgeCase:
        'Immediately recalculates whether current WG Pool Balance is cleared for policy issuance or paused across all VANs.',
      onPreview: () => {
        ctx.setIsAckoSuperAdmin(true);
        ctx.setAckoThresholdModalOpen(true);
        onClose?.();
      },
    },
    {
      id: 'V2-F04',
      screen: 'Financials · WG Pool vs. VAN Net Contribution Reconciliation Bar',
      variants: [
        'Full WG Viewer: VAN 1 + VAN 2 + VAN 3 = WG Pool Balance + Min WG Threshold badge',
        'Scoped User View (e.g. granted only VAN 1): Your Granted VANs (+₹1,00,000) + Other VANs in WG (-₹20,000 · restricted) = WG Pool (+₹80,000)',
      ],
      edgeCase:
        'Prevents math confusion when a scoped finance/ops user sums only their permitted VANs and compares against WG solvency.',
      onPreview: () => {
        ctx.applySuggestedScenario('S2-van-a-shared');
        ctx.applyWgPoolPreset('positive-wg-80k');
        onClose?.();
        router.push(`/${partner}/dashboard/financials`);
      },
    },
    {
      id: 'V2-F05',
      screen: 'UAM v2.0 · Zero Request Access CTAs + VAN Purpose Tagging + WG Threshold Tab',
      variants: [
        'Smaller-Access User "My Access" View with zero Request Access buttons (clean read-only scope + admin contact list)',
        'Account Naming & VAN Purpose Setup (tag each VAN as Deposit & Issuance, Deposit VAN, or Issuance VAN)',
        'Updated Role Conflict Engine reflecting hidden WG Pool Balance for Operations roles',
      ],
      edgeCase:
        'All Request Access CTAs removed across Overview, Policy/Claims banners, and UAM per v2.0 product alignment.',
      onPreview: () => {
        ctx.applySuggestedScenario('S1-wg-full');
        ctx.setUamActiveTab('van-naming');
        onClose?.();
        router.push(`/${partner}/dashboard/settings/access-management`);
      },
    },
    {
      id: 'V2-F06',
      screen: 'Bulk 200-User Onboarding & Contextual Right-to-Left Notifications Drawer',
      variants: [
        'Bulk Upload Modal (200-email batch paste + CSV upload) + 4 Async Upload Banner Toasts',
        'Right-to-Left Contextual Notifications Drawer (All | Alerts | Tasks | Mentions | Approvals) including ACKO Min WG Threshold alerts',
      ],
      edgeCase:
        'Preserves all bulk upload validation error handling and contextual notification actions from v1.0.',
      onPreview: () => {
        ctx.setBulkToast({
          kind: 'partial',
          fileName: 'November_2025_Partner_Users.csv',
          totalRows: 200,
          successRows: 180,
          failedRows: 20,
        });
        onClose?.();
      },
    },
  ];

  return (
    <div className="space-y-4 text-foreground">
      <div className="rounded-metric-card border border-share-recipient-border-active/30 bg-icon-select-accent-bg/40 p-4">
        <span className="finance-primary inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold">
          ENGINEERING READY v2.0 · FIGMA HANDOFF CHECKLIST ({checkedIds.size}/{items.length})
        </span>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Covers the separated <strong>WG Pool Balance</strong> layout, contextual VAN drawdown vs.
          WG solvency banners,{' '}
          <strong>ACKO Super Admin Minimum WG Threshold (% of Monthly GWP Run-rate)</strong>, and{' '}
          <strong>zero Request Access CTAs</strong>.
        </p>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const done = checkedIds.has(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                'rounded-xl border p-3.5 transition',
                done
                  ? 'border-endorse-policy-badge-success-border bg-endorse-policy-badge-success-bg/30'
                  : 'border-border bg-white',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggle(item.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-share-policy-primary">
                      {item.id}
                    </span>{' '}
                    <span className="text-sm font-semibold text-foreground">{item.screen}</span>
                  </div>
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={item.onPreview}
                >
                  Preview in UI
                  <ArrowRight className="size-3" />
                </Button>
              </div>
              <ul className="mt-2 ml-6 list-disc pl-4 space-y-0.5 text-xs text-muted-foreground">
                {item.variants.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <p className="mt-1.5 ml-6 text-[11px] text-muted-foreground">
                <strong className="text-foreground">Key rule:</strong> {item.edgeCase}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EngineeringReadyV2SimulatorView({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  const [subTab, setSubTab] = useState<'controls' | 'stories' | 'deliverables' | 'figma'>(
    'controls',
  );
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const ctx = useFinancialWorkspace();

  return (
    <div className="space-y-4">
      <SegmentedTabs
        value={subTab}
        onValueChange={(v) => setSubTab(v as 'controls' | 'stories' | 'deliverables' | 'figma')}
        tabs={[
          { value: 'controls', label: 'Controls (v2.0)' },
          { value: 'stories', label: `Stories (${ENGINEERING_V2_STORIES.length})` },
          { value: 'deliverables', label: 'Deliverables' },
          { value: 'figma', label: 'Figma Handoff Checklist' },
        ]}
      />

      {subTab === 'figma' ? (
        <FigmaHandoffChecklistV2 onClose={onClose} />
      ) : subTab === 'deliverables' ? (
        <Deliverables />
      ) : subTab === 'stories' ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Click <strong>Play story</strong> to jump directly into each Engineering Ready v2.0
            scenario.
          </p>
          {ENGINEERING_V2_STORIES.map((st) => (
            <div key={st.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-share-policy-primary">
                    {st.id} · {st.persona}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-foreground">{st.title}</h4>
                </div>
                <Button
                  size="sm"
                  className="finance-primary text-xs"
                  onClick={() => {
                    st.setup(ctx);
                    onClose?.();
                    router.push(`/${partner}/dashboard/${st.route}`);
                  }}
                >
                  Play story
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{st.jtbd}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. WG Pool & VAN Contribution Scenarios */}
          <div className="rounded-xl border border-share-recipient-border-active/30 bg-icon-select-accent-bg/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                1. WG Pool Balance &amp; VAN Contribution Scenarios (v2.0)
              </span>
              <span className="text-xs font-medium text-share-policy-primary">
                WG Pool:{' '}
                {ctx.wgPoolBalanceRupees < 0
                  ? `-₹${Math.abs(ctx.wgPoolBalanceRupees).toLocaleString('en-IN')}`
                  : `₹${ctx.wgPoolBalanceRupees.toLocaleString('en-IN')}`}{' '}
                · Min Required: ₹{ctx.effectiveMinWgBalanceRupees.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(WG_POOL_PRESETS) as WgPoolPresetId[]).map((presetKey) => {
                const p = WG_POOL_PRESETS[presetKey];
                const active = ctx.wgPoolPreset === presetKey;
                return (
                  <div
                    key={p.id}
                    onClick={() => ctx.applyWgPoolPreset(p.id)}
                    className={cn(
                      'cursor-pointer rounded-xl border p-3 transition',
                      active
                        ? 'border-share-recipient-border-active bg-segmented-tab-active-bg/40 ring-2 ring-share-policy-primary/15'
                        : 'border-border bg-white hover:border-share-recipient-border-active/50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">{p.badge}</span>
                      <Button
                        size="sm"
                        variant={active ? 'default' : 'outline'}
                        className={cn('h-6 text-[11px]', active && 'finance-primary')}
                        onClick={(e) => {
                          e.stopPropagation();
                          ctx.applyWgPoolPreset(p.id);
                          onClose?.();
                          router.push(`/${partner}/dashboard/overview`);
                        }}
                      >
                        Load &amp; View Overview
                      </Button>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. ACKO Super Admin · Minimum WG Balance Requirement (% of Monthly GWP Run-rate vs Fixed ₹) */}
          <AckoMinWgBalancePanel />

          {/* 3. Persona & UAM Quick Switcher */}
          <div className="rounded-xl border border-border bg-white p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3. Test Across Personas (Zero Request Access CTAs in v2.0)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="justify-start text-xs"
                onClick={() => {
                  ctx.setIsAckoSuperAdmin(false);
                  ctx.applySuggestedScenario('S1-wg-full');
                  onClose?.();
                  router.push(`/${partner}/dashboard/overview`);
                }}
              >
                <Users className="size-3.5 text-share-policy-primary" />
                Partner Super Admin (Full WG + 3 VANs)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start text-xs"
                onClick={() => {
                  ctx.setIsAckoSuperAdmin(false);
                  ctx.applySuggestedScenario('S5-ops-only-plans');
                  onClose?.();
                  router.push(`/${partner}/dashboard/overview`);
                }}
              >
                <ShieldAlert className="size-3.5 text-share-policy-primary" />
                Pure Operations (WG Balance Hidden · 0 Request CTAs)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start text-xs"
                onClick={() => {
                  ctx.setIsAckoSuperAdmin(false);
                  ctx.applySuggestedScenario('S2-van-a-shared');
                  onClose?.();
                  router.push(`/${partner}/dashboard/financials`);
                }}
              >
                <FileSpreadsheet className="size-3.5 text-share-policy-primary" />
                Scoped Sub-Admin (VAN-1 Only Reconciliation)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start text-xs"
                onClick={() => {
                  ctx.applySuggestedScenario('S1-wg-full');
                  ctx.setUamActiveTab('wg-threshold');
                  onClose?.();
                  router.push(`/${partner}/dashboard/settings/access-management`);
                }}
              >
                <ShieldCheck className="size-3.5 text-share-policy-primary" />
                UAM · WG Threshold &amp; VAN Roles Tab
              </Button>
            </div>
          </div>

          {children}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * ENGINEERING READY VERSION 3.0:
 * 1. ManagePartnersDirectoryScreen (ACKO Super Admin · 120 Wallet Groups)
 * 2. FigmaHandoffChecklistV3
 * 3. EngineeringReadyV3SimulatorView
 * ============================================================================ */

export function ManagePartnersDirectoryScreen() {
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const {
    selectedPartnerWgId,
    selectPartnerWg,
    setManagePartnersViewActive,
    setUamActiveTab,
    setAckoThresholdModalOpen,
  } = useFinancialWorkspace();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WgGraceStatus>('all');
  const [inspectWg, setInspectWg] = useState<PartnerWgDirectoryItem | null>(null);

  const counts = {
    all: PARTNER_WG_DIRECTORY.length,
    healthy: PARTNER_WG_DIRECTORY.filter((w) => w.graceStatus === 'healthy').length,
    'low-float': PARTNER_WG_DIRECTORY.filter((w) => w.graceStatus === 'low-float').length,
    'grace-active': PARTNER_WG_DIRECTORY.filter((w) => w.graceStatus === 'grace-active').length,
    'grace-expired': PARTNER_WG_DIRECTORY.filter((w) => w.graceStatus === 'grace-expired').length,
  };

  const filteredWgs = PARTNER_WG_DIRECTORY.filter((w) => {
    const matchesStatus = statusFilter === 'all' || w.graceStatus === statusFilter;
    if (!matchesStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      w.wgId.toLowerCase().includes(q) ||
      w.wgName.toLowerCase().includes(q) ||
      w.sector.toLowerCase().includes(q) ||
      w.brands.some((b) => b.toLowerCase().includes(q))
    );
  });

  const formatInr = (val: number) => {
    const abs = Math.abs(Math.round(val)).toLocaleString('en-IN');
    return val < 0 ? `-₹${abs}` : `₹${abs}`;
  };

  return (
    <div className="mx-auto max-w-[1360px] p-6 space-y-6 text-foreground">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage partners</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Overview of all {counts.all} assigned partners. Select a partner to act on their behalf
            or configure their roles.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards across 120 WGs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div
          onClick={() => setStatusFilter('all')}
          className={cn(
            'cursor-pointer rounded-xl border bg-white p-4 transition',
            statusFilter === 'all'
              ? 'border-share-recipient-border-active ring-2 ring-share-policy-primary/15'
              : 'border-border',
          )}
        >
          <p className="text-xs text-muted-foreground">Assigned partners</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{counts.all}</p>
        </div>
        <div
          onClick={() => setStatusFilter('healthy')}
          className={cn(
            'cursor-pointer rounded-xl border bg-white p-4 transition',
            statusFilter === 'healthy'
              ? 'border-share-recipient-border-active ring-2 ring-share-policy-primary/15'
              : 'border-border',
          )}
        >
          <p className="text-xs text-muted-foreground">Healthy float</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{counts.healthy}</p>
        </div>
        <div
          onClick={() => setStatusFilter('low-float')}
          className={cn(
            'cursor-pointer rounded-xl border bg-white p-4 transition',
            statusFilter === 'low-float'
              ? 'border-share-recipient-border-active ring-2 ring-share-policy-primary/15'
              : 'border-border',
          )}
        >
          <p className="text-xs text-muted-foreground">Low float</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
            {counts['low-float']}
          </p>
        </div>
        <div
          onClick={() => setStatusFilter('grace-active')}
          className={cn(
            'cursor-pointer rounded-xl border bg-white p-4 transition',
            statusFilter === 'grace-active'
              ? 'border-share-recipient-border-active ring-2 ring-share-policy-primary/15'
              : 'border-border',
          )}
        >
          <p className="text-xs text-muted-foreground">In 10-day grace</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
            {counts['grace-active']}
          </p>
        </div>
        <div
          onClick={() => setStatusFilter('grace-expired')}
          className={cn(
            'cursor-pointer rounded-xl border bg-white p-4 transition',
            statusFilter === 'grace-expired'
              ? 'border-share-recipient-border-active ring-2 ring-share-policy-primary/15'
              : 'border-border',
          )}
        >
          <p className="text-xs text-muted-foreground">Issuance paused</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">
            {counts['grace-expired']}
          </p>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
        <div className="flex flex-1 items-center gap-3 min-w-[260px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners by name, ID, or brand..."
            className="max-w-md text-xs"
          />
          <span className="text-xs text-muted-foreground">
            Showing <strong>{filteredWgs.length}</strong> of <strong>{counts.all}</strong> partners
          </span>
        </div>

        <BrandSegmentedControl
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: `All (${counts.all})` },
            { value: 'healthy', label: `Healthy (${counts.healthy})` },
            { value: 'low-float', label: `Low float (${counts['low-float']})` },
            { value: 'grace-active', label: `In grace (${counts['grace-active']})` },
            { value: 'grace-expired', label: `Paused (${counts['grace-expired']})` },
          ]}
        />
      </div>

      {/* 120 Wallet Groups Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-2xs">
        <div className="max-h-[540px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-border bg-pagination-background text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Partner</th>
                <th className="px-3 py-3">Users</th>
                <th className="px-3 py-3">Accounts &amp; Plans</th>
                <th className="px-3 py-3">Active Policies</th>
                <th className="px-4 py-3">Pool Balance &amp; Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWgs.map((row) => {
                return (
                  <tr key={row.wgId} className="transition hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-share-policy-primary">
                          {row.wgId}
                        </span>
                        <span className="font-semibold text-foreground">{row.wgName}</span>
                        <span className="rounded border border-border bg-pagination-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {row.sector}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {row.brands.join(', ')}
                      </p>
                    </td>
                    <td className="px-3 py-3 tabular-nums font-medium">
                      {row.activeUsersCount} users
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <span className="font-medium text-foreground">{row.vansCount} accounts</span>{' '}
                      · <span className="text-muted-foreground">{row.plansCount} plans</span>
                    </td>
                    <td className="px-3 py-3 tabular-nums font-medium">
                      {row.activePoliciesCount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            row.wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-foreground',
                          )}
                        >
                          {formatInr(row.wgPoolBalanceRupees)}
                        </span>
                        <span
                          className={cn(
                            'rounded border px-2 py-0.5 text-[10px] font-medium',
                            row.graceStatus === 'grace-expired'
                              ? 'finance-danger'
                              : row.graceStatus === 'grace-active' ||
                                  row.graceStatus === 'low-float'
                                ? 'finance-warning'
                                : 'finance-success',
                          )}
                        >
                          {row.graceStatus === 'grace-expired'
                            ? 'Paused'
                            : row.graceStatus === 'grace-active'
                              ? `In grace (${row.graceDaysLeft}d left)`
                              : row.graceStatus === 'low-float'
                                ? 'Low float'
                                : 'Healthy'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Min required: {formatInr(row.minRequiredRupees)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => setInspectWg(row)}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] text-share-policy-primary"
                          onClick={() => {
                            selectPartnerWg(row.wgId);
                            setManagePartnersViewActive(false);
                            setUamActiveTab('roles');
                            router.push(`/${partner}/dashboard/settings/access-management`);
                          }}
                        >
                          Configure roles
                        </Button>
                        <Button
                          size="sm"
                          className="finance-primary h-7 text-[11px]"
                          onClick={() => {
                            selectPartnerWg(row.wgId);
                            setManagePartnersViewActive(false);
                            router.push(`/${partner}/dashboard/overview`);
                          }}
                        >
                          Act on behalf
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect WG Hierarchy Dialog */}
      <Dialog open={Boolean(inspectWg)} onOpenChange={(o) => !o && setInspectWg(null)}>
        <DialogContent className="max-w-xl bg-white">
          {inspectWg && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="size-4 text-share-policy-primary" />
                  {inspectWg.wgId} · {inspectWg.wgName} — Hierarchy &amp; Solvency
                </DialogTitle>
                <DialogDescription>
                  Mapped brands: {inspectWg.brands.join(', ')} ({inspectWg.sector})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-border bg-pagination-background p-3">
                    <span className="text-muted-foreground">WG Pool Balance</span>
                    <p
                      className={cn(
                        'mt-1 text-base font-bold tabular-nums',
                        inspectWg.wgPoolBalanceRupees < 0 ? 'text-red-600' : 'text-foreground',
                      )}
                    >
                      {formatInr(inspectWg.wgPoolBalanceRupees)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-pagination-background p-3">
                    <span className="text-muted-foreground">Min WG Threshold</span>
                    <p className="mt-1 text-base font-bold tabular-nums">
                      {formatInr(inspectWg.minRequiredRupees)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-pagination-background p-3">
                    <span className="text-muted-foreground">Active Policies</span>
                    <p className="mt-1 text-base font-bold tabular-nums">
                      {inspectWg.activePoliciesCount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3.5 space-y-2">
                  <p className="font-semibold text-foreground">
                    Workspace summary ({inspectWg.vansCount} accounts · {inspectWg.plansCount} plans
                    · {inspectWg.activeUsersCount} users)
                  </p>
                  <p className="text-muted-foreground">
                    You can act on behalf of {inspectWg.wgName} as a Super Admin or configure their
                    roles and team permissions.
                  </p>
                </div>
              </div>

              <DialogFooter className="flex flex-wrap justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    selectPartnerWg(inspectWg.wgId);
                    setInspectWg(null);
                    setAckoThresholdModalOpen(true);
                  }}
                >
                  Balance threshold
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      selectPartnerWg(inspectWg.wgId);
                      setInspectWg(null);
                      setManagePartnersViewActive(false);
                      setUamActiveTab('roles');
                      router.push(`/${partner}/dashboard/settings/access-management`);
                    }}
                  >
                    Configure roles
                  </Button>
                  <Button
                    size="sm"
                    className="finance-primary"
                    onClick={() => {
                      selectPartnerWg(inspectWg.wgId);
                      setInspectWg(null);
                      setManagePartnersViewActive(false);
                      router.push(`/${partner}/dashboard/overview`);
                    }}
                  >
                    Act on behalf
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ENGINEERING_V3_STORIES: {
  id: string;
  persona: string;
  title: string;
  jtbd: string;
  route: string;
  setup: (ctx: ReturnType<typeof useFinancialWorkspace>) => void;
}[] = [
  {
    id: 'V3-01',
    persona: 'Operations User (Vikram Nair · Zero WG/VAN Jargon)',
    title: 'Plan-Only Overview ("All plans" or Single Plan) & Clean Scoped Header',
    jtbd: 'Verify that Operations users see zero WG Pool Balance or VAN cards on Overview, can toggle between "All plans" and individual plans, and see a clean brand/workspace header with no "Wallet group" jargon.',
    route: 'overview',
    setup: (ctx) => {
      ctx.setIsAckoSuperAdmin(false);
      ctx.setManagePartnersViewActive(false);
      ctx.applySuggestedScenario('S5-ops-only-plans');
      ctx.setSelectedPlanId('all');
    },
  },
  {
    id: 'V3-02',
    persona: 'Pure Finance User (Meera Nair · 0 Operational Plans)',
    title: 'Overview Automatically Becomes "Financial overview" + Allowed VANs & Reconciliation',
    jtbd: 'Switch to a Pure Finance User who has 0 operational plans mapped: their landing page becomes "Financial overview" showing the Global WG Pool Balance, 10-day grace status, and their Allowed VANs.',
    route: 'overview',
    setup: (ctx) => {
      ctx.setIsAckoSuperAdmin(false);
      ctx.setManagePartnersViewActive(false);
      ctx.applySuggestedScenario('S6-finance-only-vans');
      ctx.applyWgPoolPreset('wireframe-low-200k');
    },
  },
  {
    id: 'V3-03',
    persona: 'Partner Super Admin & Finance · Top-Right Low Float / 10-Day Grace Pill',
    title: '10-Day Grace Period Rule (Negative WG Balance Still Allows Issuance for 10 Days)',
    jtbd: 'Trigger a negative WG Pool Balance in 10-day grace (6 days remaining): verify policy issuance remains active, the top-right header pill shows "10-day grace: 6d left · Open Financials →", and clicking it opens Financials.',
    route: 'overview',
    setup: (ctx) => {
      ctx.setIsAckoSuperAdmin(false);
      ctx.setManagePartnersViewActive(false);
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.applyWgPoolPreset('negative-wg-blocks-positive-van');
      ctx.setWgGraceStatus('grace-active');
      ctx.setWgGraceDaysLeft(6);
    },
  },
  {
    id: 'V3-04',
    persona: 'Operations vs Finance · When 10-Day Grace Period Expires',
    title: 'Grace Expired (Day 10 Elapsed) → Plain-English Pause Banner for Ops',
    jtbd: 'Simulate Day 10 grace expiry: verify Policy Issuance pauses across the Wallet Group and Operations users see a clear, non-jargon pause notice while Finance sees the exact shortfall to recharge.',
    route: 'overview',
    setup: (ctx) => {
      ctx.setIsAckoSuperAdmin(false);
      ctx.setManagePartnersViewActive(false);
      ctx.applySuggestedScenario('S5-ops-only-plans');
      ctx.applyWgPoolPreset('negative-wg-blocks-positive-van');
      ctx.setWgGraceStatus('grace-expired');
      ctx.setWgGraceDaysLeft(0);
    },
  },
  {
    id: 'V3-05',
    persona: 'Partner Super Admin · Simplified 3-Role UAM + Non-Linked VANs & Plans',
    title:
      '3 Predefined Roles (Super Admin, Operations, Finance) + Independent VAN & Plan Selection',
    jtbd: 'Open Settings > Access Management to inspect the 3 predefined roles, customize their Configure Matrix, or create a custom role where VANs and Plans are independently selectable and auto-sync Financials access.',
    route: 'settings/access-management',
    setup: (ctx) => {
      ctx.setIsAckoSuperAdmin(false);
      ctx.setManagePartnersViewActive(false);
      ctx.applySuggestedScenario('S1-wg-full');
      ctx.setUamActiveTab('roles');
    },
  },
  {
    id: 'V3-06',
    persona: 'Internal ACKO Super Admin · 120 Wallet Groups Governance',
    title:
      'Global 120-WG Header Switcher + "Manage Partners" Left-Nav Directory & Partner UAM Control',
    jtbd: 'Enable ACKO Super Admin mode to browse all 120 Partner Wallet Groups in the "Manage partners" left-nav page, switch into any partner WG from the top-left header, and configure their UAM Role Matrix on their behalf.',
    route: 'overview',
    setup: (ctx) => {
      ctx.setIsAckoSuperAdmin(true);
      ctx.setManagePartnersViewActive(true);
    },
  },
];

export function FigmaHandoffChecklistV3({ onClose }: { onClose?: () => void }) {
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const ctx = useFinancialWorkspace();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(['V3-F01', 'V3-F02', 'V3-F03', 'V3-F04', 'V3-F05', 'V3-F06']),
  );

  const toggle = (id: string) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const items = [
    {
      id: 'V3-F01',
      screen:
        'Overview (v3.0) · Strictly Plan-Level Only ("All plans" or Single Plan) + Zero WG/VAN Cards',
      variants: [
        'Plan selector in top-right: "All plans (4)" (default aggregated view) or individual Plan selection',
        '5 Operational KPI Cards only — WG Pool Balance and Σ VANs contribution cards completely removed from Overview',
        'Pure Finance User (0 operational plans): Overview automatically becomes "Financial overview"',
      ],
      edgeCase:
        'Eliminates WG/VAN confusion for Operations and non-finance users while giving Pure Finance users a dedicated Financial Overview landing page.',
      onPreview: () => {
        ctx.setIsAckoSuperAdmin(false);
        ctx.setManagePartnersViewActive(false);
        ctx.applySuggestedScenario('S1-wg-full');
        ctx.setSelectedPlanId('all');
        onClose?.();
        router.push(`/${partner}/dashboard/overview`);
      },
    },
    {
      id: 'V3-F02',
      screen: 'Uniform Role-Scoped Top-Left Header + Top-Right Float / Grace Status Pill',
      variants: [
        'Partner Full-Scope Header: "Eternal · Organization workspace · Zomato, Blinkit, District" (drops "Wallet group" jargon)',
        'Single-Brand Scoped Header: "Eternal · Blinkit · Operations workspace"',
        'Top-Right Header Pill (Super Admin & Finance only): "Float balance: Low · Open Financials →" or "10-day grace: 6d left · Open Financials →"',
      ],
      edgeCase:
        'Top-right float pill is hidden for Operations users so they are never distracted by float alerts.',
      onPreview: () => {
        ctx.setIsAckoSuperAdmin(false);
        ctx.setManagePartnersViewActive(false);
        ctx.applySuggestedScenario('S1-wg-full');
        ctx.applyWgPoolPreset('wireframe-low-200k');
        onClose?.();
        router.push(`/${partner}/dashboard/overview`);
      },
    },
    {
      id: 'V3-F03',
      screen:
        'Financials Module · Global WG Pool Balance + 10-Day Grace Period + Allowed VANs Dropdown',
      variants: [
        'Global WG Pool Balance card & Σ VANs contribution split housed exclusively inside Financials',
        '10-Day Grace Active state (negative balance allows issuance for 10 days) vs 10-Day Grace Expired state (issuance paused)',
        'Scoped Finance reconciliation line: Global WG Pool = Your permitted VANs + Other group accounts',
      ],
      edgeCase:
        'Honors the backend 10-day grace rule so negative balance does not falsely claim policy issuance is blocked until day 10 expires.',
      onPreview: () => {
        ctx.setIsAckoSuperAdmin(false);
        ctx.setManagePartnersViewActive(false);
        ctx.applySuggestedScenario('S1-wg-full');
        ctx.applyWgPoolPreset('negative-wg-blocks-positive-van');
        ctx.setWgGraceStatus('grace-active');
        onClose?.();
        router.push(`/${partner}/dashboard/financials`);
      },
    },
    {
      id: 'V3-F04',
      screen: 'UAM v3.0 · 3 Predefined Roles (Super Admin, Operations, Finance) + Configure Matrix',
      variants: [
        'Out-of-the-box 3 clean roles: Super Admin, Operations User, Finance User',
        'Editable Configure Matrix (No Access | View Only | View & Edit) for any of the 3 predefined roles + "+ Create custom role"',
      ],
      edgeCase:
        'Partner Admin or ACKO Super Admin can customize module visibility on predefined roles or create a bespoke hybrid role.',
      onPreview: () => {
        ctx.setIsAckoSuperAdmin(false);
        ctx.setManagePartnersViewActive(false);
        ctx.applySuggestedScenario('S1-wg-full');
        ctx.setUamActiveTab('roles');
        onClose?.();
        router.push(`/${partner}/dashboard/settings/access-management`);
      },
    },
    {
      id: 'V3-F05',
      screen: 'UAM User/Role Assignment · Non-Linked Selectable VANs & Plans + Matrix Auto-Sync',
      variants: [
        'Independent checkboxes for Financial Accounts (VANs) and Operational Plans (non-linked selection of one or many)',
        'Smart Matrix Sync prompt when selecting VANs for a role that currently has Financials = No Access',
      ],
      edgeCase:
        'Supports custom hybrid personas who need specific VANs and specific Plans without forcing a rigid 1:1 link.',
      onPreview: () => {
        ctx.setIsAckoSuperAdmin(false);
        ctx.setManagePartnersViewActive(false);
        ctx.applySuggestedScenario('S1-wg-full');
        ctx.setUamActiveTab('users');
        onClose?.();
        router.push(`/${partner}/dashboard/settings/access-management`);
      },
    },
    {
      id: 'V3-F06',
      screen:
        'Internal ACKO Super Admin · Top-Left 120-WG Switcher + "Manage Partners" Left-Nav Page',
      variants: [
        'Searchable Global WG Switcher in top-left header ("Viewing Partner WG: Eternal (WG-001) ▾") + "Acting on behalf of partner" badge',
        'Dedicated "Manage partners (120)" left-nav page with KPI summary, search, status filters, and 120 WG rows',
        'Direct "Configure Roles & UAM" action from any partner row to edit their Configure Matrix and user roles',
      ],
      edgeCase:
        'Scales cleanly to 120+ Wallet Groups for internal ACKO operations and finance teams.',
      onPreview: () => {
        ctx.setIsAckoSuperAdmin(true);
        ctx.setManagePartnersViewActive(true);
        onClose?.();
        router.push(`/${partner}/dashboard/overview`);
      },
    },
  ];

  return (
    <div className="space-y-4 text-foreground">
      <div className="rounded-metric-card border border-share-recipient-border-active/30 bg-icon-select-accent-bg/40 p-4">
        <span className="finance-primary inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold">
          ENGINEERING READY v3.0 · FIGMA HANDOFF CHECKLIST ({checkedIds.size}/{items.length})
        </span>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Covers the persona-split architecture: <strong>Plan-only Overview</strong>,{' '}
          <strong>Financial Overview for Pure Finance users</strong>,{' '}
          <strong>10-day grace period handling</strong>,{' '}
          <strong>3 predefined UAM roles with non-linked VAN/Plan selection</strong>, and{' '}
          <strong>ACKO Super Admin 120-WG Manage Partners directory</strong>.
        </p>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const done = checkedIds.has(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                'rounded-xl border p-3.5 transition',
                done
                  ? 'border-endorse-policy-badge-success-border bg-endorse-policy-badge-success-bg/30'
                  : 'border-border bg-white',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggle(item.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-share-policy-primary">
                      {item.id}
                    </span>{' '}
                    <span className="text-sm font-semibold text-foreground">{item.screen}</span>
                  </div>
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={item.onPreview}
                >
                  Preview in UI
                  <ArrowRight className="size-3" />
                </Button>
              </div>
              <ul className="mt-2 ml-6 list-disc pl-4 space-y-0.5 text-xs text-muted-foreground">
                {item.variants.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <p className="mt-1.5 ml-6 text-[11px] text-muted-foreground">
                <strong className="text-foreground">Key rule:</strong> {item.edgeCase}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EngineeringReadyV3SimulatorView({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  const [subTab, setSubTab] = useState<'controls' | 'stories' | 'deliverables' | 'figma'>(
    'controls',
  );
  const { partner } = useParams<{ partner: string }>();
  const router = useRouter();
  const ctx = useFinancialWorkspace();
  const isV31 = ctx.approachMode === 'engineering-ready-v3.1';
  const verLabel = isV31 ? 'v3.1' : 'v3.0';

  return (
    <div className="space-y-4">
      <SegmentedTabs
        value={subTab}
        onValueChange={(v) => setSubTab(v as 'controls' | 'stories' | 'deliverables' | 'figma')}
        tabs={[
          { value: 'controls', label: `Controls (${verLabel})` },
          { value: 'stories', label: `Stories (${ENGINEERING_V3_STORIES.length})` },
          { value: 'deliverables', label: 'Deliverables' },
          { value: 'figma', label: 'Figma Handoff Checklist' },
        ]}
      />

      {subTab === 'figma' ? (
        <FigmaHandoffChecklistV3 onClose={onClose} />
      ) : subTab === 'deliverables' ? (
        <Deliverables />
      ) : subTab === 'stories' ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Click <strong>Play story</strong> to test each Engineering Ready v3.0 persona, 10-day
            grace state, and ACKO Super Admin 120-WG workflow.
          </p>
          {ENGINEERING_V3_STORIES.map((st) => (
            <div key={st.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-share-policy-primary">
                    {st.id} · {st.persona}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-foreground">{st.title}</h4>
                </div>
                <Button
                  size="sm"
                  className="finance-primary text-xs"
                  onClick={() => {
                    st.setup(ctx);
                    onClose?.();
                    router.push(`/${partner}/dashboard/${st.route}`);
                  }}
                >
                  Play story
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{st.jtbd}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. Persona Switcher (3 Predefined Roles + Pure Finance + ACKO Super Admin) */}
          <div className="rounded-xl border border-share-recipient-border-active/30 bg-icon-select-accent-bg/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                1. Persona-Split Portal Views ({verLabel})
              </span>
              <span className="text-xs font-medium text-share-policy-primary">
                Active Role:{' '}
                {ctx.isAckoSuperAdmin
                  ? 'ACKO Super Admin (120 WGs)'
                  : ctx.activeRoleDefinition.name}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                size="sm"
                variant="outline"
                className="justify-start bg-white text-xs"
                onClick={() => {
                  ctx.setIsAckoSuperAdmin(false);
                  ctx.setManagePartnersViewActive(false);
                  ctx.applySuggestedScenario('S1-wg-full');
                  ctx.setSelectedPlanId('all');
                  onClose?.();
                  router.push(`/${partner}/dashboard/overview`);
                }}
              >
                <Users className="size-3.5 text-share-policy-primary" />
                {isV31
                  ? '1. Super Admin (APD Balance Breakdown + Multi-Select Plans)'
                  : '1. Super Admin (All Plans Overview + Low Float Pill)'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start bg-white text-xs"
                onClick={() => {
                  ctx.setIsAckoSuperAdmin(false);
                  ctx.setManagePartnersViewActive(false);
                  ctx.applySuggestedScenario('S5-ops-only-plans');
                  ctx.setSelectedPlanId('all');
                  onClose?.();
                  router.push(`/${partner}/dashboard/overview`);
                }}
              >
                <ShieldCheck className="size-3.5 text-share-policy-primary" />
                {isV31
                  ? '2. Operations User (Plan-Only · No Settings Tab)'
                  : '2. Operations User (Plan-Only · Zero WG/VAN Info)'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start bg-white text-xs"
                onClick={() => {
                  ctx.setIsAckoSuperAdmin(false);
                  ctx.setManagePartnersViewActive(false);
                  ctx.applySuggestedScenario('S6-finance-only-vans');
                  onClose?.();
                  router.push(`/${partner}/dashboard/overview`);
                }}
              >
                <FileSpreadsheet className="size-3.5 text-share-policy-primary" />
                {isV31
                  ? '3. Finance User (APD Balance & VAN Numbers on Overview)'
                  : '3. Finance User (0 Plans → "Financial overview")'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="justify-start bg-white text-xs"
                onClick={() => {
                  ctx.setIsAckoSuperAdmin(true);
                  ctx.setManagePartnersViewActive(true);
                  onClose?.();
                  router.push(`/${partner}/dashboard/overview`);
                }}
              >
                <Building2 className="size-3.5 text-share-policy-primary" />
                4. ACKO Super Admin · Manage 120 Partner WGs
              </Button>
            </div>
          </div>

          {/* 2. 10-Day Grace Period & WG Float Status Simulator */}
          <div className="rounded-xl border border-border bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. 10-Day Grace Period &amp; WG Pool Solvency State
              </span>
              <span className="text-xs font-medium text-foreground">
                Current State: <strong>{ctx.wgGraceStatus}</strong>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Test how the top-right header pill, Financials module, and Operations banners respond
              across Healthy, Low Float, 10-Day Grace Active (negative balance, issuance allowed),
              and 10-Day Grace Expired (issuance paused).
            </p>
            <BrandSegmentedControl
              value={ctx.wgGraceStatus}
              onChange={(st) => {
                if (st === 'healthy') {
                  ctx.applyWgPoolPreset('deposit-van-plus-issuance-vans');
                  ctx.setWgGraceStatus('healthy');
                } else if (st === 'low-float') {
                  ctx.applyWgPoolPreset('wireframe-low-200k');
                  ctx.setWgGraceStatus('low-float');
                } else if (st === 'grace-active') {
                  ctx.applyWgPoolPreset('negative-wg-blocks-positive-van');
                  ctx.setWgGraceStatus('grace-active');
                  ctx.setWgGraceDaysLeft(6);
                } else {
                  ctx.applyWgPoolPreset('negative-wg-blocks-positive-van');
                  ctx.setWgGraceStatus('grace-expired');
                  ctx.setWgGraceDaysLeft(0);
                }
              }}
              options={[
                { value: 'healthy', label: 'Healthy Float' },
                { value: 'low-float', label: 'Low Float' },
                { value: 'grace-active', label: '10-Day Grace (6d left)' },
                { value: 'grace-expired', label: 'Grace Expired (Paused)' },
              ]}
            />
          </div>

          {/* 3. UAM 3-Role Configure Role & Account/Plan Assignment */}
          <div className="rounded-xl border border-border bg-white p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3. Access Management ({verLabel}) · Roles &amp; Team Members
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  ctx.applySuggestedScenario('S1-wg-full');
                  ctx.setUamActiveTab('roles');
                  onClose?.();
                  router.push(`/${partner}/dashboard/settings/access-management`);
                }}
              >
                Open Roles &amp; Configure role
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  ctx.applySuggestedScenario('S1-wg-full');
                  ctx.setUamActiveTab('users');
                  onClose?.();
                  router.push(`/${partner}/dashboard/settings/access-management`);
                }}
              >
                Open Team members
              </Button>
              {!isV31 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    ctx.applySuggestedScenario('S1-wg-full');
                    ctx.setUamActiveTab('van-naming');
                    onClose?.();
                    router.push(`/${partner}/dashboard/settings/access-management`);
                  }}
                >
                  Open Account names
                </Button>
              )}
            </div>
          </div>

          {children}
        </div>
      )}
    </div>
  );
}
