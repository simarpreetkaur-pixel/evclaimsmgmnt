'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { ClipboardList, LayoutDashboard, Settings, WalletCards } from 'lucide-react';

import { AppImage } from '@/components/atoms/AppImage';
import { PermissionGate } from '@/components/atoms/PermissionGate';
import { SidebarUserMenu } from '@/components/molecules/SidebarUserMenu';
import { PERMISSIONS } from '@/lib/constants/auth.constants';
import {
  getPrototypeEmail,
  getPrototypeFirstName,
  getPrototypePersona,
  PROTOTYPE_MODE,
  type PrototypePersona,
} from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';
import type { PermissionRequirement } from '@/lib/utils/permissionUtils';
import { cn } from '@/lib/utils';
import { useSegmentPartnerBase } from '@/lib/hooks/useSegmentPartnerBase';
import { getSegmentPageContextFromPathname } from '@/lib/segment/pageContext';
import { trackSidebarNavigation } from '@/lib/segment/track/navigation';
import { useDataSource } from '@/lib/hooks/useDataSourceUrlState';
import { appendSourceQueryParam } from '@/lib/utils/dataSource.utils';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: PermissionRequirement;
};

const navItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/overview',
    icon: LayoutDashboard,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    label: 'Claims management',
    href: '/claims-management',
    icon: ClipboardList,
    permission: PERMISSIONS.VIEW_CLAIMS,
  },
  {
    label: 'Financials',
    href: '/financials',
    icon: WalletCards,
    permission: PERMISSIONS.VIEW_FINANCIALS,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { partner } = useParams<{ partner: string }>();
  const { userProfile, isLoading } = useUserProfileStore();
  const segmentBase = useSegmentPartnerBase();
  const dashboardBasePath = `/${partner}/dashboard`;
  const currentSource = useDataSource();
  const withCurrentSource = (href: string) => appendSourceQueryParam(href, '', currentSource);
  const overviewHref = withCurrentSource(`${dashboardBasePath}/overview`);
  const [persona, setPersona] = useState<PrototypePersona | null>(null);
  useEffect(() => {
    if (!PROTOTYPE_MODE) {
      return;
    }
    const email = userProfile?.email || getPrototypeEmail();
    setPersona(getPrototypePersona(email));
  }, [userProfile?.email]);
  const visibleNavItems = navItems.filter((item) => {
    if (!PROTOTYPE_MODE || !persona) {
      return true;
    }
    if (persona === 'owner' && item.href === '/settings') {
      return false;
    }
    if (persona === 'ops' && (item.href === '/financials' || item.href === '/settings')) {
      return false;
    }
    if (persona === 'kam' && item.href !== '/overview' && item.href !== '/settings' && item.href !== '/claims-management') {
      return false;
    }
    if (persona !== 'kam' && persona !== 'super' && item.href === '/settings') {
      return false;
    }
    return true;
  });
  const personaLabel =
    persona === 'super'
      ? 'Super profile'
      : persona === 'owner'
        ? 'Dealership owner'
        : persona === 'kam'
          ? 'KAM'
          : 'Dealership ops';
  const userName = PROTOTYPE_MODE
    ? userProfile?.email
      ? getPrototypeFirstName(userProfile.email)
      : (userProfile?.firstName ?? '')
    : `${userProfile?.firstName ?? ''} ${userProfile?.lastName ?? ''}`.trim();
  const userEmail = userProfile?.email || '--';

  return (
    <aside className="w-64 shrink-0 pb-6 pt-4 md:flex md:flex-col">
      <div className="px-6 pb-6">
        <Link
          href={overviewHref}
          onClick={() => {
            const pageContext = getSegmentPageContextFromPathname(pathname);
            trackSidebarNavigation(segmentBase, {
              ...pageContext,
              entity_name: 'Partner Portal',
              value: overviewHref,
            });
          }}
          className="text-foreground flex items-center gap-2 text-lg font-semibold leading-tight hover:opacity-80 transition-opacity"
        >
          {'Partner Portal'}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {PROTOTYPE_MODE && persona ? (
          <div className="bg-create-claim-button/10 mb-2 rounded-xl px-3 py-2">
            <p className="text-create-claim-button/80 text-xs">Viewing as</p>
            <p className="text-create-claim-button text-sm font-medium">{personaLabel}</p>
          </div>
        ) : null}
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const resolvedHref = `${dashboardBasePath}${item.href}`;
          const hrefWithSource = withCurrentSource(resolvedHref);
          const isActive =
            pathname === resolvedHref ||
            (resolvedHref !== '/' && pathname.startsWith(`${resolvedHref}/`)) ||
            (item.href === '/overview' && pathname.includes('/claim-details')) ||
            (item.href === '/claims-management' && pathname.includes('/create-claim'));

          return (
            <PermissionGate key={item.href} permission={item.permission}>
              <Link
                href={hrefWithSource}
                onClick={() => {
                  const pageContext = getSegmentPageContextFromPathname(pathname);
                  trackSidebarNavigation(segmentBase, {
                    ...pageContext,
                    entity_name: item.label,
                    value: hrefWithSource,
                  });
                }}
                className={cn(
                  'hover:bg-gray-300 text-sm font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  isActive && 'bg-gray-200 text-accent-foreground font-medium',
                )}
              >
                <Icon className="text-foreground size-4" />
                <span>{item.label}</span>
              </Link>
            </PermissionGate>
          );
        })}
      </nav>
      <div className="flex flex-col gap-3 px-4 pb-4">
        <SidebarUserMenu name={userName} email={userEmail} isLoading={isLoading} />
      </div>

      <div className="border-t pt-6 border-border text-foreground flex items-center justify-center gap-3 text-xs leading-none">
        <span>{'Powered by'}</span>
        <AppImage
          src="/images/acko-enterprise-logo.svg"
          alt="ACKO Enterprise"
          width={80}
          height={20}
        />
      </div>
    </aside>
  );
}
