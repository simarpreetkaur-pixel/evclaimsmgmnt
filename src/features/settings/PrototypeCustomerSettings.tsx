'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeading, PAGE_LAYOUT_CLASS } from '@/components/molecules/PageHeading';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCustomerConfigs, useCustomerConfigStore, type CustomerConfig, type CustomerDealership } from '@/lib/prototype/customers';
import { getPrototypeEmail, getPrototypePersona } from '@/lib/prototype/session';
import { useUserProfileStore } from '@/lib/store/userProfile.store';

export function PrototypeCustomerSettings() {
  const router = useRouter();
  const { partner } = useParams<{ partner: string }>();
  const { userProfile } = useUserProfileStore();
  const customers = useCustomerConfigs();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const persona = getPrototypePersona(userProfile?.email || getPrototypeEmail());
    if (persona === 'kam' || persona === 'super') {
      setAllowed(true);
      return;
    }
    router.replace(`/${partner}/dashboard/overview`);
  }, [partner, router, userProfile?.email]);

  if (!allowed) {
    return null;
  }

  return (
    <div className={PAGE_LAYOUT_CLASS}>
      <PageHeading
        title="Settings"
        subtitle="Add the dealer ops emails for each dealership. They use these to sign in. Start with one, and add up to three."
      />
      <Accordion type="multiple" className="gap-4">
        {customers.map((customer) => (
          <CompanyAccess key={customer.id} customer={customer} />
        ))}
      </Accordion>
    </div>
  );
}

function CompanyAccess({ customer }: { customer: CustomerConfig }) {
  const saveCustomer = useCustomerConfigStore((state) => state.saveCustomer);
  const [savedDealerships, setSavedDealerships] = useState(() => customer.dealerships.map(copyDealership));
  const [drafts, setDrafts] = useState(() => customer.dealerships.map(copyDealership));
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);
  const openCardRef = useRef<HTMLDivElement>(null);
  const needle = query.trim().toLowerCase();
  const visible = drafts.filter((dealership) => dealership.name.toLowerCase().includes(needle));
  const savedById = new Map(savedDealerships.map((dealership) => [dealership.id, dealership]));

  const update = (id: string, next: CustomerDealership) => {
    setDrafts((current) => current.map((dealership) => (dealership.id === id ? next : dealership)));
    setSavedNoticeId((current) => (current === id ? null : current));
  };

  useEffect(() => {
    if (!openId) {
      return;
    }
    const closeOnOutside = (event: PointerEvent) => {
      if (openCardRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpenId(null);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [openId]);

  const persistEmails = (id: string, emails: string[], addedEmail: boolean) => {
    const cleaned = emailList(emails).slice(0, 3);
    const nextSaved = drafts.map((dealership) =>
      dealership.id === id
        ? { ...dealership, emails: cleaned }
        : savedById.get(dealership.id) ?? dealership,
    );
    const stored = nextSaved.map((dealership) => ({
      ...dealership,
      emails: emailList(dealership.emails).slice(0, 3),
    }));
    setSavedDealerships(stored.map(copyDealership));
    setDrafts((current) =>
      current.map((dealership) => {
        const saved = stored.find((item) => item.id === dealership.id);
        if (!saved || dealership.id !== id) {
          return dealership;
        }
        return { ...dealership, emails: saved.emails.length > 0 ? saved.emails : [''] };
      }),
    );
    saveCustomer({ ...customer, dealerships: stored });
    setSavedNoticeId(addedEmail ? id : null);
  };

  const saveDealership = (id: string) => {
    const previousEmails = savedById.get(id)?.emails ?? [];
    const nextEmails = drafts.find((dealership) => dealership.id === id)?.emails ?? [];
    persistEmails(id, nextEmails, hasNewEmail(previousEmails, nextEmails));
  };

  const removeEmail = (id: string, index: number) => {
    const current = drafts.find((dealership) => dealership.id === id);
    if (!current) {
      return;
    }
    const removed = current.emails[index]?.trim() ?? '';
    const remaining = current.emails.filter((_, emailIndex) => emailIndex !== index);
    persistEmails(id, remaining, false);
    toast.success('Email removed', {
      description: removed
        ? `${removed} can no longer sign in for ${current.name}.`
        : `The email field was removed for ${current.name}.`,
    });
  };

  return (
    <AccordionItem value={customer.id} className="overflow-hidden rounded-[14px] border border-pagination-border bg-white">
      <AccordionTrigger className="rounded-none bg-slate-50 px-6 py-4 hover:no-underline">
        <span className="flex flex-col gap-1">
          <span className="text-base font-semibold text-pagination-text">{customer.name}</span>
          <span className="text-sm font-normal text-pagination-text-muted">
            {drafts.length} {drafts.length === 1 ? 'dealership' : 'dealerships'}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 [&_p]:mb-0">
        <div className="flex flex-col gap-4 bg-zinc-50 pt-4">
          <div className="border-policy-search-border flex h-10 items-center gap-2 rounded-md border bg-white px-3">
            <Search className="size-4 text-pagination-text-muted" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${customer.name} dealerships`}
              aria-label={`Search ${customer.name} dealerships`}
              className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          {visible.length === 0 ? (
            <p className="text-sm text-pagination-text-muted">No dealership matches that search.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {visible.map((dealership) => {
                const open = openId === dealership.id;
                return (
                  <div
                    key={dealership.id}
                    ref={open ? openCardRef : undefined}
                    className="rounded-xl border border-claims-management-table-border bg-white shadow-xs"
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : dealership.id)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
                    >
                      <span className="text-sm font-semibold text-pagination-text">{dealership.name}</span>
                      <span className="text-sm text-pagination-text-muted">
                        {activeUserLabel(savedById.get(dealership.id)?.emails ?? dealership.emails)}
                      </span>
                    </button>
                    {open ? (
                      <div className="border-t border-slate-100 px-5 py-4">
                        <DealershipEmails
                          dealership={dealership}
                          saved={savedById.get(dealership.id)}
                          onChange={(next) => update(dealership.id, next)}
                          onSave={() => saveDealership(dealership.id)}
                          onRemove={(index) => removeEmail(dealership.id, index)}
                          showSaved={savedNoticeId === dealership.id}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function DealershipEmails({
  dealership,
  saved,
  onChange,
  onSave,
  onRemove,
  showSaved,
}: {
  dealership: CustomerDealership;
  saved?: CustomerDealership;
  onChange: (dealership: CustomerDealership) => void;
  onSave: () => void;
  onRemove: (index: number) => void;
  showSaved: boolean;
}) {
  const emails = dealership.emails.length > 0 ? dealership.emails.slice(0, 3) : [''];
  const newestRef = useRef<HTMLInputElement>(null);
  const [focusNewest, setFocusNewest] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const dirty = emailKey(dealership.emails) !== emailKey(saved?.emails ?? []);
  const pendingEmail = pendingDelete === null ? '' : emails[pendingDelete]?.trim() ?? '';

  useEffect(() => {
    if (!focusNewest) {
      return;
    }
    newestRef.current?.focus();
    setFocusNewest(false);
  }, [focusNewest, emails.length]);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {emails.map((email, index) => (
          <div key={`${dealership.id}-${index}`} className="flex items-center gap-2">
            <Input
              ref={index === emails.length - 1 ? newestRef : undefined}
              type="email"
              value={email}
              onChange={(event) => {
                const next = [...emails];
                next[index] = event.target.value;
                onChange({ ...dealership, emails: next });
              }}
              placeholder="name@dealership.com"
              aria-label={`${dealership.name} dealer ops email ${index + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              className="size-9 shrink-0 px-0"
              onClick={() => setPendingDelete(index)}
              aria-label={`Remove email ${index + 1} for ${dealership.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {emails.length < 3 ? (
          <Button
            type="button"
            variant="outline"
            className="h-8 px-3 text-sm"
            onClick={() => {
              setFocusNewest(true);
              onChange({ ...dealership, emails: [...emails, ''] });
            }}
          >
            <Plus className="size-4" />
            Add email
          </Button>
        ) : (
          <p className="text-xs text-pagination-text-muted">Three emails is the maximum for a dealership.</p>
        )}
        {dirty ? (
          <Button
            type="button"
            onClick={onSave}
            className="bg-create-claim-button text-create-claim-button-text hover:bg-create-claim-button-hover h-8 px-4 text-sm font-medium"
          >
            Save
          </Button>
        ) : showSaved ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check className="size-4" aria-hidden />
            Saved
          </span>
        ) : null}
      </div>
      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this email?</DialogTitle>
            <DialogDescription>
              {pendingEmail
                ? `${pendingEmail} will no longer be able to sign in for ${dealership.name}.`
                : `This email field will be removed for ${dealership.name}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingDelete === null) {
                  return;
                }
                const index = pendingDelete;
                setPendingDelete(null);
                onRemove(index);
              }}
            >
              Remove email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function emailList(emails: string[] | undefined) {
  return (emails ?? []).map((email) => email.trim()).filter(Boolean);
}

function emailKey(emails: string[]) {
  return emailList(emails).join('|');
}

function hasNewEmail(previous: string[], next: string[]) {
  const saved = new Set(emailList(previous));
  return emailList(next).some((email) => !saved.has(email));
}

function activeUserLabel(emails: string[]) {
  const count = emails.filter((email) => email.trim().length > 0).length;
  return count === 1 ? 'Active user · 1' : `Active users · ${count}`;
}

function copyDealership(dealership: CustomerDealership): CustomerDealership {
  return {
    ...dealership,
    emails: dealership.emails?.length ? [...dealership.emails] : [''],
  };
}
