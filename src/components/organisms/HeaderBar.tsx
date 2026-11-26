'use client';

import LabeledSelect from '../molecules/LabeledSelect';
import { usePartnerStore } from '@/lib/store/partner.store';
import { AppImage } from '../atoms/AppImage';
import { usePartnerConfig } from '@/lib/hooks/usePartnerConfig';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DETAILS_ROUTES } from '@/lib/constants/global.constants';
import { appendSourceQueryParam, getDataSourceFromSearch } from '@/lib/utils/dataSource.utils';
import { useSegmentPartnerBase } from '@/lib/hooks/useSegmentPartnerBase';
import { getSegmentPageContextFromPathname } from '@/lib/segment/pageContext';
import { trackGlobalPartnerFilterChange } from '@/lib/segment/track/navigation';
import { usePartnersQuery } from '@/lib/query/partnerConfig.queries';
import {
  getPartnerApiLogoUrl,
  getPartnerMeta,
  PARTNER_META,
} from '@/lib/constants/partnerMeta.constants';
import { BrandCheckboxSelect } from '@/components/molecules/BrandCheckboxSelect';
import { PortfolioScopeSelect } from '@/components/molecules/PortfolioScopeSelect';
import { usePortfolioSelectionStore } from '@/lib/prototype/customers';
import { getPrototypeEmail, getPrototypePersona, PROTOTYPE_MODE, type PrototypePersona } from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';
import { DmsSimulationControl } from './DmsSimulationControl';
import { withBasePath } from '@/lib/utils/basePath';

export function HeaderBar() {
  const {
    partnerId,
    partnerOptions,
    setPartnerId,
    setLob,
    setLobOptions,
    setProductOptions,
    setProductIds,
  } = usePartnerStore();
  usePartnerConfig();
  const { data: partnersData } = usePartnersQuery();
  const pathname = usePathname();
  const segmentBase = useSegmentPartnerBase();
  const segmentBaseRef = useRef(segmentBase);

  useEffect(() => {
    segmentBaseRef.current = segmentBase;
  }, [segmentBase]);

  useEffect(() => {
    const dealerships = partnersData?.partners;
    if (!dealerships?.length || !pathname) {
      return;
    }

    const segments = pathname.split('/').filter(Boolean);
    const routeDealership = segments[0];
    if (!routeDealership || dealerships.some((dealership) => dealership.id === routeDealership)) {
      return;
    }

    segments[0] = dealerships[0].id;
    window.location.assign(withBasePath(`/${segments.join('/')}`));
  }, [partnersData, pathname]);

  const pageContext = () => getSegmentPageContextFromPathname(pathname);

  const handlePartnerChange = (newPartnerId: string) => {
    trackGlobalPartnerFilterChange(segmentBaseRef.current, {
      ...pageContext(),
      value: newPartnerId,
    });
    setLob('');
    setLobOptions([]);
    setProductOptions([]);
    setProductIds([]);
    setPartnerId(newPartnerId);
    let targetPath = `/${newPartnerId}/dashboard/overview`;
    if (pathname) {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const isDetailsRoute = segments.some((segment) =>
          DETAILS_ROUTES.includes(segment as (typeof DETAILS_ROUTES)[number]),
        );
        if (!isDetailsRoute) {
          segments[0] = newPartnerId;
          targetPath = `/${segments.join('/')}`;
        }
      }
    }
    window.location.assign(
      withBasePath(
        appendSourceQueryParam(
          targetPath,
          window.location.search,
          getDataSourceFromSearch(window.location.search),
        ),
      ),
    );
  };

  const selectedPartner = partnersData?.partners.find((partner) => partner.id === partnerId);
  const fallbackIconSrc = PARTNER_META[partnerId]?.iconSrc;
  const partnerMeta = getPartnerMeta(partnerId, getPartnerApiLogoUrl(selectedPartner));
  const activePartnerName =
    selectedPartner?.display_name?.trim() ||
    selectedPartner?.displayName?.trim() ||
    partnerOptions.find((option) => option.value === partnerId)?.label ||
    partnerMeta.name;
  const activePartnerIconSrc = partnerMeta.iconSrc;
  const isAtherDealership = partnerId.startsWith('ather_');
  const userProfile = useUserProfileStore((state) => state.userProfile);
  const superView = usePortfolioSelectionStore((state) => state.superView);
  const [persona, setPersona] = useState<PrototypePersona | null>(null);
  const [logoSrc, setLogoSrc] = useState(activePartnerIconSrc);
  const showBrandSelect = PROTOTYPE_MODE && isAtherDealership && persona !== null && persona !== 'ops';

  useEffect(() => {
    if (!PROTOTYPE_MODE) {
      return;
    }
    setPersona(getPrototypePersona(userProfile?.email || getPrototypeEmail()));
  }, [userProfile?.email]);

  useEffect(() => {
    setLogoSrc(activePartnerIconSrc);
  }, [activePartnerIconSrc]);

  return (
    <header className="border-border flex items-center justify-between border-b px-6 py-2">
      {isAtherDealership && !showBrandSelect ? (
        <AppImage
          src="/images/partners/ather-logo.png"
          alt="Ather"
          width={626}
          height={234}
          className="h-8 w-auto"
          style={{ width: 'auto', height: 32 }}
        />
      ) : !isAtherDealership ? (
        <div className="flex items-center gap-2">
          {logoSrc ? (
            <div className="text-foreground flex size-8 items-center justify-center overflow-hidden shadow-xs">
              <AppImage
                src={logoSrc}
                alt={activePartnerName}
                width={32}
                height={32}
                className="size-8 object-contain"
                onError={() => {
                  if (fallbackIconSrc && logoSrc !== fallbackIconSrc) {
                    setLogoSrc(fallbackIconSrc);
                  }
                }}
              />
            </div>
          ) : null}
          <span className="text-foreground text-sm font-semibold tracking-[0.04em] uppercase">
            {activePartnerName}
          </span>
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        {showBrandSelect ? <BrandCheckboxSelect /> : null}
        {persona === 'kam' ? null : (
          <LabeledSelect
            label="Dealership"
            value={partnerId}
            onValueChange={handlePartnerChange}
            options={
              PROTOTYPE_MODE
                ? partnerOptions.filter((option) => option.value === partnerId)
                : partnerOptions
            }
            placeholder="Select dealership"
            disabled={PROTOTYPE_MODE || partnerOptions.length === 0}
            searchable={!PROTOTYPE_MODE}
            searchPlaceholder="Search dealership"
            className={PROTOTYPE_MODE ? 'cursor-default disabled:opacity-100' : undefined}
          />
        )}
        {persona === 'kam' || (persona === 'super' && superView === 'portfolio') ? <PortfolioScopeSelect /> : null}
        {PROTOTYPE_MODE ? <DmsSimulationControl /> : null}
      </div>
    </header>
  );
}
