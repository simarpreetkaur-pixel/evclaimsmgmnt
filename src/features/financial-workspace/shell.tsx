'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bell,
  Building2,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LifeBuoy,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { AppImage } from '@/components/atoms/AppImage';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SCENARIOS, type Role, type Scenario, type Topology } from './domain';
import { BrandInlineSelect, Picker, EmptyState } from './common';
import { PARTNER_WG_DIRECTORY, V31_PLAN_CATALOG, useFinancialWorkspace } from './provider';
import './workspace.css';
import { SimulatorStudio, StoryGuide } from './simulator-studio';
import { SuggestedApproachGlobalDialogs } from './suggested-approach';
import {
  AckoMinWgBalanceModal,
  BulkUploadToastBanner,
  ContextualNotificationsSidebar,
  CrossWorkflowAccessBoundaryBanner,
  ManagePartnersDirectoryScreen,
  RequestAccessModal,
} from './engineering-ready';

function PartnerMultiSelectDropdown({
  availablePartners,
  selectedPartners,
  onChange,
}: {
  availablePartners: string[];
  selectedPartners: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
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

  const effectiveSelected = selectedPartners.filter((p) => availablePartners.includes(p));
  const activeList = effectiveSelected.length > 0 ? effectiveSelected : availablePartners;
  const filtered = availablePartners.filter((p) =>
    p.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const togglePartner = (brand: string) => {
    if (activeList.includes(brand)) {
      if (activeList.length <= 1) return; // keep at least 1 selected
      onChange(activeList.filter((item) => item !== brand));
    } else {
      onChange([...activeList, brand]);
    }
  };

  const summaryLabel =
    activeList.length === 1
      ? activeList[0]
      : activeList.length === availablePartners.length
        ? `${activeList.join(', ')}`
        : `${activeList.join(', ')}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs shadow-2xs transition hover:border-share-recipient-border-active/50"
      >
        <span className="text-muted-foreground">Partner:</span>
        <span className="max-w-[180px] truncate font-semibold text-foreground">{summaryLabel}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-border bg-white p-2.5 shadow-lg space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search partner..."
              className="h-7 pl-7 text-xs"
            />
          </div>

          <div className="flex items-center justify-between px-1 text-[11px]">
            <span className="text-muted-foreground">
              {activeList.length} of {availablePartners.length} selected
            </span>
            <button
              type="button"
              className="font-medium text-share-policy-primary hover:underline"
              onClick={() => onChange([...availablePartners])}
            >
              Select all
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-border/50">
            {filtered.map((brand) => {
              const checked = activeList.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <Checkbox checked={checked} onCheckedChange={() => togglePartner(brand)} />
                    {brand}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {V31_PLAN_CATALOG.filter((p) => p.partner === brand).length} plans
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FinancialSimulatorShell({ children }: { children: ReactNode }) {
  const {
    snapshot,
    view,
    role,
    setRole,
    scenario,
    configure,
    system,
    pending,
    failNextAction,
    setFailNextAction,
    setApdBasis,
    markRead,
    unknownOutcome,
    timeoutNextAction,
    setTimeoutNextAction,
    checkOutcome,
    approachMode,
    activeRoleDefinition,
    contextualNotifications,
    isAckoSuperAdmin,
    selectedPartnerWgId,
    selectPartnerWg,
    activePartnerWg,
    managePartnersViewActive,
    setManagePartnersViewActive,
    wgGraceStatus,
    wgGraceDaysLeft,
    selectedPartnersV31,
    setSelectedPartnersV31,
    setSelectedPlanIdsV31,
  } = useFinancialWorkspace();
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [controls, setControls] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [support, setSupport] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);
  const pathname = usePathname();
  const params = useParams<{ partner: string }>();
  const router = useRouter();
  const base = `/${params.partner}/dashboard`;
  const isEngV31 = approachMode === 'engineering-ready-v3.1';
  const isEngV3 = approachMode === 'engineering-ready-v3' || isEngV31;
  const isEngReady =
    approachMode === 'engineering-ready' || approachMode === 'engineering-ready-v2' || isEngV3;
  const unread = isEngReady
    ? contextualNotifications.filter((n) => n.unread).length
    : view.notices.filter((n) => !n.read).length;

  const perms = activeRoleDefinition.permissions;
  const isPureFinanceUserV3 =
    isEngV3 &&
    (!view.ownPlans.length ||
      (perms.policies === 'none' && perms.claims === 'none' && perms.financials !== 'none'));

  const hideSettingsTabInV31 = isEngV31 && perms.settings === 'none' && !isAckoSuperAdmin;

  const nav = [
    ...(!isEngReady || perms.overview !== 'none'
      ? [
          {
            label: isPureFinanceUserV3 && !isEngV31 ? 'Financial overview' : 'Overview',
            path: 'overview',
            icon: LayoutDashboard,
          },
        ]
      : []),
    ...(!isEngReady || (perms.policies !== 'none' && !isPureFinanceUserV3)
      ? [{ label: 'Policy management', path: 'policy-management', icon: FileText }]
      : []),
    ...(!isEngReady || (perms.claims !== 'none' && !isPureFinanceUserV3)
      ? [
          {
            label: 'Claims management',
            path: 'claims-management',
            icon: ClipboardList,
          },
        ]
      : []),
    ...(!isEngReady || perms.financials !== 'none' || isAckoSuperAdmin
      ? [{ label: 'Financials', path: 'financials', icon: WalletCards }]
      : []),
    ...(view.actor.planIds.length > 0 && (!isEngReady || perms['manual-refunds'] !== 'none')
      ? [{ label: 'Manual refunds', path: 'manual-refunds', icon: Banknote }]
      : []),
    ...(!isEngReady || perms.reports !== 'none'
      ? [{ label: 'Statements & reports', path: 'reports', icon: FileText }]
      : []),
    ...(!hideSettingsTabInV31
      ? [
          {
            label:
              isEngReady && perms.settings === 'none' && !isAckoSuperAdmin
                ? 'My access'
                : 'Settings',
            path: 'settings/access-management',
            icon: Settings2,
          },
        ]
      : []),
  ];
  const supported = true;
  const operationalRoute =
    pathname.includes('/policy-management') || pathname.includes('/claims-management');
  const links = nav.map((item) => (
    <div key={item.path}>
      {
        <Link
          href={`${base}/${item.path}`}
          onClick={() => setManagePartnersViewActive(false)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-sidebar-accent',
            !managePartnersViewActive &&
              pathname.endsWith('/' + item.path) &&
              'bg-sidebar-accent font-medium',
          )}
          aria-current={
            !managePartnersViewActive && pathname.endsWith('/' + item.path) ? 'page' : undefined
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      }
    </div>
  ));

  // Role-scoped uniform header naming for Engineering Ready v3.0 & v3.1
  const partnerBrandsList =
    view.actor.partnerIds.length > 0 ? view.actor.partnerIds : activePartnerWg.brands;
  const isSingleBrandUser = partnerBrandsList.length === 1 && activePartnerWg.brands.length > 1;

  // In v3.1, remove "Eternal" completely and display partner-level workspace (e.g. "Organisation workspace - Zomato, Blinkit")
  const v31ActivePartners = selectedPartnersV31.filter((b) => activePartnerWg.brands.includes(b));
  const effectiveV31Partners = v31ActivePartners.length > 0 ? v31ActivePartners : partnerBrandsList;
  const v31WorkspacePrefix =
    perms.financials === 'none'
      ? 'Operations workspace'
      : isPureFinanceUserV3
        ? 'Financial workspace'
        : 'Organisation workspace';

  const v3HeaderTitle = isEngV31
    ? `${v31WorkspacePrefix} - ${effectiveV31Partners.join(', ')}`
    : isSingleBrandUser
      ? `${activePartnerWg.wgName} · ${partnerBrandsList[0]}`
      : activePartnerWg.wgName;

  const v3HeaderSubtitle = isEngV31
    ? isPureFinanceUserV3
      ? `${view.actor.vanIds.length} permitted financial accounts`
      : `${effectiveV31Partners.length} ${effectiveV31Partners.length === 1 ? 'partner' : 'partners'} active`
    : perms.financials === 'none'
      ? `Operations workspace · ${view.ownPlans.map((p) => p.name).join(', ') || 'Assigned plans'}`
      : isPureFinanceUserV3
        ? `Finance workspace · ${view.actor.vanIds.length} permitted CD accounts`
        : `Organization workspace · ${partnerBrandsList.join(', ')}`;

  const showTopRightFloatPill =
    isEngV3 &&
    !isEngV31 &&
    (perms.financials !== 'none' || isAckoSuperAdmin) &&
    !(isAckoSuperAdmin && managePartnersViewActive);
  return (
    <div className="financial-workspace flex h-screen overflow-x-auto bg-background text-foreground">
      <aside className="finance-desktop-sidebar flex w-64 shrink-0 flex-col p-3">
        <Link
          href={`${base}/overview`}
          onClick={() => setManagePartnersViewActive(false)}
          className="px-3 py-4 text-lg font-semibold"
        >
          Partner Portal
        </Link>
        <nav aria-label="Main navigation" className="mt-4 space-y-1">
          {isEngV3 && isAckoSuperAdmin && (
            <>
              <button
                type="button"
                onClick={() => setManagePartnersViewActive(true)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-sidebar-accent',
                  managePartnersViewActive
                    ? 'bg-sidebar-accent font-medium text-foreground'
                    : 'text-foreground',
                )}
              >
                <Building2 className="size-4" />
                Manage partners
              </button>
              <div className="pt-2 pb-1 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {managePartnersViewActive
                    ? `Partner workspace · ${activePartnerWg.wgName}`
                    : `${activePartnerWg.wgName} workspace`}
                </p>
              </div>
            </>
          )}
          {links}
        </nav>
        <div className="mt-auto space-y-3 pt-6">
          <button
            onClick={() => setSupport(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
          >
            <LifeBuoy className="size-4" />
            Support
          </button>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
              {view.actor.internal ? 'AK' : snapshot.topology === 'eternal' ? 'ZO' : 'CR'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {view.actor.internal
                  ? 'ACKO Finance'
                  : view.actor.partnerIds.join(', ') || 'Financial scope only'}
              </p>
              <p className="truncate text-xs text-muted-foreground">{view.actor.label}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 border-t border-border py-4 text-xs">
            Powered by{' '}
            <AppImage
              src="/images/acko-enterprise-logo.svg"
              alt="ACKO Enterprise"
              width={80}
              height={20}
            />
          </div>
          <Button
            variant="outline"
            className="w-full text-share-policy-primary"
            onClick={() => setControls(true)}
          >
            <FlaskConical />
            Workflow simulator
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            REVIEW BUILD · SYNTHETIC DATA
          </p>
        </div>
      </aside>
      <div className="m-2 flex min-w-[960px] flex-1 flex-col overflow-hidden rounded-xl bg-card shadow-sm">
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-2">
          {isEngV3 ? (
            isAckoSuperAdmin ? (
              managePartnersViewActive ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-icon-select-accent-bg text-xs font-semibold text-share-policy-primary">
                    AK
                  </div>
                  <div>
                    <p className="text-sm font-semibold">ACKO Enterprise</p>
                    <p className="text-[11px] text-muted-foreground">
                      All assigned partners ({PARTNER_WG_DIRECTORY.length})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-md bg-icon-select-accent-bg text-sm font-semibold text-share-policy-primary">
                    {activePartnerWg.wgName.slice(0, 1)}
                  </div>
                  <BrandInlineSelect
                    label="Viewing partner"
                    value={selectedPartnerWgId}
                    onChange={(wgId) => {
                      selectPartnerWg(wgId);
                      setManagePartnersViewActive(false);
                    }}
                    options={PARTNER_WG_DIRECTORY.map((w) => ({
                      value: w.wgId,
                      label: `${w.wgName} · ${w.brands.slice(0, 3).join(', ')}`,
                    }))}
                  />
                  <span className="rounded-md border border-border bg-pagination-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Acting as Super Admin
                  </span>
                  <button
                    type="button"
                    onClick={() => setManagePartnersViewActive(true)}
                    className="text-xs font-medium text-share-policy-primary hover:underline"
                  >
                    ← Back to all partners
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-icon-select-accent-bg text-sm font-semibold text-share-policy-primary">
                  {isEngV31
                    ? (effectiveV31Partners[0] || 'Z').slice(0, 1)
                    : activePartnerWg.wgName.slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{v3HeaderTitle}</p>
                  <p className="text-[11px] text-muted-foreground">{v3HeaderSubtitle}</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-icon-select-accent-bg text-sm font-semibold text-share-policy-primary">
                {snapshot.groupName.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold">{snapshot.groupName}</p>
                <p className="text-[11px] text-muted-foreground">
                  Wallet group ·{' '}
                  {view.actor.internal
                    ? 'Internal finance workspace'
                    : view.actor.partnerIds.join(', ') || 'Financial scope only'}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {isEngV31 && !(isAckoSuperAdmin && managePartnersViewActive) && (
              <PartnerMultiSelectDropdown
                availablePartners={activePartnerWg.brands}
                selectedPartners={effectiveV31Partners}
                onChange={(nextPartners) => {
                  setSelectedPartnersV31(nextPartners);
                  const matchingPlanIds = V31_PLAN_CATALOG.filter((p) =>
                    nextPartners.includes(p.partner),
                  ).map((p) => p.id);
                  setSelectedPlanIdsV31(matchingPlanIds);
                }}
              />
            )}
            {showTopRightFloatPill && wgGraceStatus !== 'healthy' && (
              <button
                type="button"
                onClick={() => {
                  setManagePartnersViewActive(false);
                  router.push(`${base}/financials`);
                }}
                title="Open Financials to view balance and recharge"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs transition hover:border-share-recipient-border-active/50 hover:bg-muted/30"
              >
                <span
                  className={cn(
                    'size-2 rounded-full',
                    wgGraceStatus === 'grace-expired' ? 'bg-red-500' : 'bg-amber-500',
                  )}
                />
                <span>
                  {wgGraceStatus === 'grace-expired'
                    ? 'Issuance paused'
                    : wgGraceStatus === 'grace-active'
                      ? `Low float · ${wgGraceDaysLeft}d grace`
                      : 'Low float'}
                </span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {isEngV3 && isAckoSuperAdmin ? 'ACKO Super Admin' : view.actor.label}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Notifications, ${unread} unread`}
              onClick={() => setNotifications(true)}
              className="relative"
            >
              <Bell />
              {unread > 0 && (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-share-policy-primary" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setControls(true)}>
              <Settings2 />
              Simulator
            </Button>
          </div>
        </header>
        <main className="finance-scroll min-w-0 flex-1 overflow-auto" id="main-content">
          <BulkUploadToastBanner />
          {unknownOutcome && (
            <div role="alert" className="m-5 finance-warning rounded-lg border p-4 text-sm">
              <p className="font-semibold">Request outcome is unconfirmed</p>
              <p className="mt-1">
                Keep request {unknownOutcome}. Submitting again is blocked until its outcome is
                known.
              </p>
              <Button className="mt-3" variant="outline" onClick={checkOutcome}>
                Check request status
              </Button>
            </div>
          )}
          {activeStory && <StoryGuide id={activeStory} onClose={() => setActiveStory(null)} />}
          {isEngV3 && isAckoSuperAdmin && managePartnersViewActive ? (
            <ManagePartnersDirectoryScreen />
          ) : supported ? (
            operationalRoute && !view.actor.planIds.length ? (
              <div className="p-6">
                <EmptyState
                  icon="access"
                  title="Operational plan access is not included"
                  description="Financial VAN grants do not grant access to policies or claims."
                />
              </div>
            ) : (
              <>
                {isEngReady && !isEngV31 && operationalRoute && (
                  <CrossWorkflowAccessBoundaryBanner />
                )}
                {children}
              </>
            )
          ) : (
            <div className="p-6">
              <EmptyState
                title="This module uses the connected backend"
                description="This local workspace covers Overview, Financials, Manual refunds and Statements. Connect the existing API mode to use the operational modules."
                action={
                  <Button asChild variant="outline">
                    <Link href={`${base}/overview`}>Back to overview</Link>
                  </Button>
                }
              />
            </div>
          )}
        </main>
      </div>

      <Dialog open={controls} onOpenChange={setControls}>
        <DialogContent className="left-auto right-0 top-0 flex h-dvh w-[820px] max-w-[820px] translate-x-0 translate-y-0 flex-col overflow-y-auto rounded-none bg-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="size-5 text-share-policy-primary" />
              Workflow simulator
            </DialogTitle>
            <DialogDescription>
              Change the context, then use the actual page actions. All data and notifications stay
              in this local session.
            </DialogDescription>
          </DialogHeader>
          <SimulatorStudio
            onClose={() => setControls(false)}
            onLaunch={(id) => {
              setActiveStory(id);
              setControls(false);
            }}
          >
            <div className="finance-simulator-grid">
              <Picker
                label="Wallet group example"
                value={snapshot.topology}
                onChange={(v) => void configure(v as Topology, scenario)}
                disabled={pending}
                options={[
                  { value: 'eternal', label: 'Eternal · 4 VANs, 4 partners' },
                  { value: 'cred', label: 'Cred · V2 shared by 2 partners' },
                ]}
              />
              <Picker
                label="Preview as"
                value={role}
                onChange={(v) => setRole(v as Role)}
                disabled={pending}
                options={snapshot.users
                  .map((u) => [u.id, u.name])
                  .filter(([key]) =>
                    key === 'credit-vidya'
                      ? snapshot.topology === 'cred'
                      : key === 'eternal-group-finance'
                        ? snapshot.topology === 'eternal'
                        : true,
                  )
                  .map(([value, label]) => ({ value, label }))}
              />
              <Picker
                label="Load a scenario (resets workflow changes)"
                value={scenario}
                onChange={(v) => void configure(snapshot.topology, v as Scenario)}
                disabled={pending}
                options={Object.entries(SCENARIOS).map(([value, label]) => ({ value, label }))}
              />
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5">
                <strong>Scope in this preview</strong>
                <p className="mt-1 text-muted-foreground">
                  Financial VANs: {view.actor.vanIds.join(', ') || 'None'}. Operational plans:{' '}
                  {view.ownPlans.length}. View-only users cannot submit money actions.
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="mb-2 text-sm font-semibold">Simulate an external event</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  These controls represent service callbacks, not user permissions.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending || !['grace', 'blocked', 'recovery'].includes(snapshot.apd)}
                    onClick={() => system('fund-group')}
                  >
                    Confirm recovery funding
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending || snapshot.apd !== 'grace'}
                    onClick={() => system('expire-grace')}
                  >
                    Expire grace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending || snapshot.apd !== 'blocked'}
                    onClick={() => system('expire-recovery')}
                  >
                    Expire recovery
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      pending ||
                      !snapshot.cases.some((c) => c.kind === 'refund' && c.status === 'pending')
                    }
                    onClick={() => system('payout-success')}
                  >
                    Payout succeeds
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      pending ||
                      !snapshot.cases.some((c) => c.kind === 'refund' && c.status === 'pending')
                    }
                    onClick={() => system('payout-failure')}
                  >
                    Payout fails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => system('refresh')}
                  >
                    Sources refresh
                  </Button>
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                <Checkbox
                  checked={failNextAction}
                  disabled={pending}
                  onCheckedChange={(v) => setFailNextAction(v === true)}
                  aria-label="Fail the next action"
                />
                <span>
                  Fail the next submitted action
                  <small className="mt-1 block text-xs text-muted-foreground">
                    Verify error recovery and preserved form entries.
                  </small>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                <Checkbox
                  checked={timeoutNextAction}
                  disabled={pending}
                  onCheckedChange={(v) => setTimeoutNextAction(v === true)}
                  aria-label="Interrupt response after commit"
                />
                <span>
                  Interrupt response after commit
                  <small className="block mt-1 text-xs text-muted-foreground">
                    The operation completes, but acknowledgment is withheld. Look up the original
                    request before retrying.
                  </small>
                </span>
              </label>
              <Picker
                label="APD policy hypothesis · Finance sign-off pending"
                value={snapshot.apdBasis}
                disabled={pending}
                onChange={(v) => setApdBasis(v as 'booked' | 'available')}
                options={[
                  { value: 'available', label: 'Available = booked − holds' },
                  { value: 'booked', label: 'Booked balance only' },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Failed payouts retain their obligation hold in this proposal. Fixture deadlines and
                low-balance thresholds are illustrative. No email, payment or cancellation is sent.
              </p>
              <div className="rounded-lg bg-muted p-3 text-xs">
                <p>
                  Snapshot revision {snapshot.revision} · mapping v{snapshot.mappingVersion}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Last event: {snapshot.audit.at(-1)?.title || 'Scenario loaded'}
                </p>
              </div>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => void configure(snapshot.topology, scenario)}
              >
                <RotateCcw />
                Reset this scenario
              </Button>
              <Button className="finance-primary" onClick={() => setControls(false)}>
                Explore the portal
                <ChevronRight />
              </Button>
            </div>
          </SimulatorStudio>
        </DialogContent>
      </Dialog>

      <ContextualNotificationsSidebar open={notifications} onOpenChange={setNotifications} />
      {approachMode !== 'engineering-ready-v2' && <RequestAccessModal />}
      <AckoMinWgBalanceModal />
      <Dialog open={emailPreview} onOpenChange={setEmailPreview}>
        <DialogContent className="max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle>Communication preview</DialogTitle>
            <DialogDescription>Preview only · no message is sent</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border p-5">
            <p className="text-xs text-muted-foreground">
              TO: Configured finance contact · role-scoped recipients
            </p>
            <h3 className="mt-4 font-semibold">{snapshot.groupName}: financial status update</h3>
            <p className="mt-3 text-sm">
              There is an update requiring review in your Partner Portal. Open the portal to see the
              current status, evidence and next action within your access scope.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Shared-group amounts and co-participant details are excluded from this preview.
              Recipient policy requires confirmation.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={support} onOpenChange={setSupport}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Partner support</DialogTitle>
            <DialogDescription>
              This preview covers financial workflows. Policy and claims actions remain in the
              existing connected portal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
            <ShieldCheck className="size-5 shrink-0" />
            <p className="text-sm">
              For a financial issue, open the affected VAN and raise a dispute. It will include your
              scope, source reference and an audit trail.
            </p>
          </div>
          <Button
            className="finance-primary"
            onClick={() => {
              setSupport(false);
              router.push(`${base}/financials`);
            }}
          >
            Open financials
          </Button>
        </DialogContent>
      </Dialog>
      <SuggestedApproachGlobalDialogs />
    </div>
  );
}
