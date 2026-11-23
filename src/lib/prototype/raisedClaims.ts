'use client';

import { create } from 'zustand';

import type { OngoingClaim } from '@/features/overview/DealershipOpsOverview';

const STORAGE_KEY = 'pp_raised_claims';

type RaisedClaimsStore = {
  claims: OngoingClaim[];
  hydrate: () => void;
  addClaim: (claim: OngoingClaim) => void;
};

function normalizeClaim(claim: OngoingClaim): OngoingClaim {
  const legacyStatus = claim.status as string;

  if (legacyStatus === 'With Acko' || legacyStatus === 'In review with ACKO') {
    return { ...claim, status: 'In review with ACKO', filter: 'in-review' };
  }
  if (
    legacyStatus === 'Awaiting pack collection' ||
    legacyStatus === 'Payment pending' ||
    claim.filter === ('pack-collection' as string)
  ) {
    return { ...claim, status: 'Payment pending', filter: 'payment-pending' };
  }
  if (legacyStatus === 'Approved · invoices due' || legacyStatus === 'Invoice due') {
    return { ...claim, status: 'Invoice due', filter: 'invoice-due' };
  }
  if (
    legacyStatus === 'Acko needs documents' ||
    legacyStatus === 'Document requested' ||
    legacyStatus === 'Documents requested'
  ) {
    return { ...claim, status: 'Documents requested', filter: 'documents' };
  }
  if (legacyStatus === 'Not covered' || legacyStatus === 'Rejected') {
    return { ...claim, status: 'Rejected', filter: 'rejected' };
  }
  if (legacyStatus === 'Closed · reopenable' || legacyStatus === 'Closed') {
    return { ...claim, status: 'Closed', filter: 'closed' };
  }
  if (legacyStatus === 'Paid') {
    return { ...claim, status: 'Paid', filter: 'paid' };
  }
  return claim;
}

function readStoredClaims(): OngoingClaim[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as OngoingClaim[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    const claims = parsed.map(normalizeClaim);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    return claims;
  } catch {
    return [];
  }
}

export const useRaisedClaimsStore = create<RaisedClaimsStore>((set, get) => ({
  claims: [],
  hydrate: () => {
    set({ claims: readStoredClaims() });
  },
  addClaim: (claim) => {
    const claims = [claim, ...get().claims.filter((item) => item.id !== claim.id)];
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    }
    set({ claims });
  },
}));

export function raisedClaimFromVehicle(customer: string, vehicle: string): OngoingClaim {
  const raisedOn = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return {
    id: 'CLM-ATH-1233',
    customer,
    vehicle,
    registration: 'KA 02 EV 1233',
    raisedOn,
    status: 'In review with ACKO',
    filter: 'in-review',
  };
}
