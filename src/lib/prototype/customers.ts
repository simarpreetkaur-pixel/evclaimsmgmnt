'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

import { PROTOTYPE_DEALERSHIPS } from '@/lib/prototype/dealerships';

export type FieldEntry = 'extracted' | 'entered';

export type CustomerDocument = {
  id: string;
  name: string;
  required: boolean;
};

export type CustomerField = {
  id: string;
  label: string;
  kind: 'standard' | 'bin';
  entry: FieldEntry;
  required: boolean;
  collected: boolean;
  documentId?: string;
  hint?: string;
};

export type CustomerDealership = {
  id: string;
  name: string;
  emails: string[];
  ongoing: number;
  raised: number;
  approved: number;
  decided: number;
  avgDaysToPayment: number;
};

export type CustomerConfig = {
  id: string;
  name: string;
  batteries: number;
  builtin: boolean;
  documents: CustomerDocument[];
  fields: CustomerField[];
  dealerships: CustomerDealership[];
};

const DEALERSHIP_STATS: Record<
  string,
  Pick<CustomerDealership, 'ongoing' | 'raised' | 'approved' | 'decided' | 'avgDaysToPayment'>
> = {
  ather_indiranagar: { ongoing: 14, raised: 38, approved: 33, decided: 38, avgDaysToPayment: 9 },
  ather_koramangala: { ongoing: 9, raised: 22, approved: 18, decided: 21, avgDaysToPayment: 11 },
  ather_andheri_west: { ongoing: 6, raised: 15, approved: 12, decided: 14, avgDaysToPayment: 8 },
  ather_whitefield: { ongoing: 11, raised: 27, approved: 24, decided: 26, avgDaysToPayment: 10 },
  ather_hsr: { ongoing: 4, raised: 12, approved: 11, decided: 12, avgDaysToPayment: 7 },
  ather_jayanagar: { ongoing: 8, raised: 19, approved: 15, decided: 18, avgDaysToPayment: 12 },
  hero_vida_connaught_place: { ongoing: 7, raised: 16, approved: 13, decided: 15, avgDaysToPayment: 13 },
  hero_vida_whitefield: { ongoing: 5, raised: 11, approved: 8, decided: 10, avgDaysToPayment: 14 },
  hero_vida_banjara_hills: { ongoing: 10, raised: 21, approved: 16, decided: 20, avgDaysToPayment: 12 },
  hero_vida_indiranagar: { ongoing: 3, raised: 8, approved: 7, decided: 8, avgDaysToPayment: 9 },
  hero_vida_jp_nagar: { ongoing: 6, raised: 14, approved: 11, decided: 13, avgDaysToPayment: 15 },
};

function seededDealerships(prefix: string): CustomerDealership[] {
  return PROTOTYPE_DEALERSHIPS.filter((dealership) => dealership.id.startsWith(prefix)).map((dealership) => ({
    id: dealership.id,
    name: dealership.display_name,
    emails: [dealership.id === 'ather_indiranagar' ? 'mesimarpreet@gmail.com' : `${dealership.id.replace(/_/g, '.')}@dealership.com`],
    ...(DEALERSHIP_STATS[dealership.id] ?? {
      ongoing: 0,
      raised: 0,
      approved: 0,
      decided: 0,
      avgDaysToPayment: 0,
    }),
  }));
}

function manualFields(): CustomerField[] {
  return [
    {
      id: 'customer-said',
      label: 'What the customer said',
      kind: 'standard',
      entry: 'entered',
      required: true,
      collected: true,
      hint: 'At least 40 characters',
    },
    {
      id: 'failed-on',
      label: 'When did it fail?',
      kind: 'standard',
      entry: 'entered',
      required: true,
      collected: true,
      hint: 'Today or earlier',
    },
    {
      id: 'closest-match',
      label: 'Closest failure match',
      kind: 'standard',
      entry: 'entered',
      required: true,
      collected: true,
    },
    {
      id: 'odometer',
      label: 'Odometer, km',
      kind: 'standard',
      entry: 'entered',
      required: true,
      collected: true,
      hint: 'Typed by the dealership',
    },
    {
      id: 'job-card',
      label: 'Job card number',
      kind: 'standard',
      entry: 'extracted',
      required: true,
      collected: true,
      documentId: 'claim-document',
    },
    {
      id: 'service-history-rows',
      label: 'Service history details',
      kind: 'standard',
      entry: 'entered',
      required: false,
      collected: false,
      hint: 'The file is uploaded. The visits are not extracted.',
    },
    {
      id: 'state-of-health',
      label: 'State of health',
      kind: 'standard',
      entry: 'extracted',
      required: false,
      collected: false,
      documentId: 'battery-images',
      hint: 'Not taken from the documents',
    },
    {
      id: 'cell-imbalance',
      label: 'Cell imbalance',
      kind: 'standard',
      entry: 'extracted',
      required: false,
      collected: false,
      documentId: 'battery-images',
      hint: 'Not taken from the documents',
    },
  ];
}

export const SEED_CUSTOMERS: CustomerConfig[] = [
  {
    id: 'ather',
    name: 'Ather',
    batteries: 1,
    builtin: true,
    documents: [
      { id: 'battery-images', name: 'Battery images', required: true },
      { id: 'service-history', name: 'Service history', required: false },
      { id: 'claim-document', name: 'Ather claim document', required: true },
      { id: 'purchase-invoice', name: 'Purchase invoice', required: true },
    ],
    fields: manualFields(),
    dealerships: seededDealerships('ather_'),
  },
  {
    id: 'hero-vida',
    name: 'Hero Vida',
    batteries: 2,
    builtin: true,
    documents: [
      { id: 'battery-images', name: 'Battery images', required: true },
      { id: 'service-history', name: 'Service history', required: false },
      { id: 'claim-document', name: 'Hero Vida claim document', required: true },
      { id: 'purchase-invoice', name: 'Purchase invoice', required: true },
    ],
    fields: manualFields(),
    dealerships: seededDealerships('hero_vida_'),
  },
].map((customer) => syncBatteryFields(customer, customer.batteries));

export function syncBatteryFields(customer: CustomerConfig, batteries: number): CustomerConfig {
  const count = Math.min(4, Math.max(1, batteries));
  const others = customer.fields.filter((field) => field.kind !== 'bin');
  const existing = customer.fields.filter((field) => field.kind === 'bin');
  const imageDoc = customer.documents.find((document) => document.id === 'battery-images') ?? customer.documents[0];
  const bins: CustomerField[] = Array.from({ length: count }, (_, index) => {
    const current = existing[index];
    const label = count === 1 ? 'Battery identification number' : `Battery ${index + 1} identification number`;
    if (current) {
      return {
        ...current,
        label: count === 1 ? label : current.label || label,
        collected: true,
        required: true,
        entry: 'extracted',
        documentId: current.documentId || imageDoc?.id,
      };
    }
    return {
      id: `bin-${index + 1}`,
      label,
      kind: 'bin',
      entry: 'extracted',
      required: true,
      collected: true,
      documentId: imageDoc?.id,
    };
  });
  const jobIndex = others.findIndex((field) => field.id === 'job-card');
  const fields =
    jobIndex >= 0
      ? [...others.slice(0, jobIndex + 1), ...bins, ...others.slice(jobIndex + 1)]
      : [...others, ...bins];
  return { ...customer, batteries: count, fields };
}

export function blankCustomer(): CustomerConfig {
  const draft: CustomerConfig = {
    id: `customer-${Date.now()}`,
    name: '',
    batteries: 1,
    builtin: false,
    documents: [
      { id: 'battery-images', name: 'Battery images', required: true },
      { id: 'claim-document', name: 'Claim document', required: true },
      { id: 'purchase-invoice', name: 'Purchase invoice', required: true },
      { id: 'service-history', name: 'Service history', required: false },
    ],
    fields: manualFields(),
    dealerships: [],
  };
  return syncBatteryFields(draft, 1);
}

export function cloneCustomer(customer: CustomerConfig): CustomerConfig {
  return JSON.parse(JSON.stringify(customer)) as CustomerConfig;
}

const STORAGE_KEY = 'pp_customer_configs';

type PersistedCustomers = {
  overrides: Record<string, CustomerConfig>;
  added: CustomerConfig[];
};

type CustomerConfigStore = PersistedCustomers & {
  hydrated: boolean;
  hydrate: () => void;
  saveCustomer: (customer: CustomerConfig) => void;
};

export const useCustomerConfigStore = create<CustomerConfigStore>((set, get) => ({
  overrides: {},
  added: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated || typeof window === 'undefined') {
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedCustomers;
        set({
          overrides: parsed.overrides ?? {},
          added: parsed.added ?? [],
          hydrated: true,
        });
        return;
      }
    } catch {
      // Keep the seeded customers if the saved config cannot be read.
    }
    set({ hydrated: true });
  },
  saveCustomer: (customer) => {
    const seedIds = new Set(SEED_CUSTOMERS.map((item) => item.id));
    const current = { overrides: get().overrides, added: get().added };
    const next: PersistedCustomers = seedIds.has(customer.id)
      ? { overrides: { ...current.overrides, [customer.id]: customer }, added: current.added }
      : {
          overrides: current.overrides,
          added: current.added.some((item) => item.id === customer.id)
            ? current.added.map((item) => (item.id === customer.id ? customer : item))
            : [...current.added, customer],
        };
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    set(next);
  },
}));

export function useCustomerConfigs(): CustomerConfig[] {
  const overrides = useCustomerConfigStore((state) => state.overrides);
  const added = useCustomerConfigStore((state) => state.added);
  const hydrate = useCustomerConfigStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return [
    ...SEED_CUSTOMERS.map((customer) => withDealershipEmails(overrides[customer.id] ?? customer, customer)),
    ...added.map((customer) => withDealershipEmails(customer)),
  ];
}

function withDealershipEmails(customer: CustomerConfig, seed?: CustomerConfig): CustomerConfig {
  return {
    ...customer,
    dealerships: customer.dealerships.map((dealership) => {
      const emails = dealership.emails ?? [];
      const seeded = seed?.dealerships.find((item) => item.id === dealership.id)?.emails;
      return {
        ...dealership,
        emails: emails.some((email) => email.length > 0) ? emails.slice(0, 3) : seeded?.length ? seeded : [''],
      };
    }),
  };
}

export function portfolioDealerships(customers: CustomerConfig[]) {
  return customers.flatMap((customer) =>
    customer.dealerships
      .filter((dealership) => dealership.name.trim().length > 0)
      .map((dealership) => ({ ...dealership, customerId: customer.id, customerName: customer.name })),
  );
}

type PortfolioSelectionStore = {
  pickedIds: string[] | null;
  setPickedIds: (ids: string[] | null) => void;
  superView: 'desk' | 'portfolio';
  setSuperView: (view: 'desk' | 'portfolio') => void;
  brandIds: string[];
  setBrandIds: (ids: string[]) => void;
};

export const usePortfolioSelectionStore = create<PortfolioSelectionStore>((set) => ({
  pickedIds: null,
  setPickedIds: (pickedIds) => set({ pickedIds }),
  superView: 'desk',
  setSuperView: (superView) => set({ superView }),
  brandIds: ['ather'],
  setBrandIds: (brandIds) => set({ brandIds }),
}));
