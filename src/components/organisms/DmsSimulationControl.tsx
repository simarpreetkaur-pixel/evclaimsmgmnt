'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DMS_SIMULATION_OPTIONS, useDmsSimulationStore } from '@/lib/prototype/dmsSimulation';
import {
  getPrototypeEmail,
  getPrototypePersona,
  PROTOTYPE_PERSONAS,
  signInPrototype,
  type PrototypePersona,
} from '@/lib/prototype/session';
import { USER_PROFILE_QUERY_KEY } from '@/lib/query/userProfile.queries';
import { useUserProfileStore } from '@/lib/store/userProfile.store';
import type { UserProfile } from '@/lib/types/userProfile';
import { cn } from '@/lib/utils';

export function DmsSimulationControl() {
  const queryClient = useQueryClient();
  const userProfile = useUserProfileStore((state) => state.userProfile);
  const setUserProfile = useUserProfileStore((state) => state.setUserProfile);
  const mode = useDmsSimulationStore((state) => state.mode);
  const setMode = useDmsSimulationStore((state) => state.setMode);
  const hydrate = useDmsSimulationStore((state) => state.hydrate);
  const [open, setOpen] = useState(false);
  const persona = getPrototypePersona(userProfile?.email || getPrototypeEmail());
  const showDms = persona === 'ops' || persona === 'super';

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const applyPersona = (nextPersona: PrototypePersona) => {
    const next = PROTOTYPE_PERSONAS.find((item) => item.id === nextPersona);
    if (!next) {
      return;
    }
    signInPrototype(next.email);
    const current = useUserProfileStore.getState().userProfile;
    const profile: UserProfile = {
      id: current?.id ?? 'local-demo-user',
      enabled: current?.enabled ?? true,
      realm: current?.realm ?? 'partner-portal',
      firstName: next.name,
      lastName: '',
      email: next.email,
      createdOn: current?.createdOn ?? new Date().toISOString(),
      updatedOn: new Date().toISOString(),
    };
    queryClient.setQueryData(USER_PROFILE_QUERY_KEY, profile);
    setUserProfile(profile);
    if (nextPersona === 'owner') {
      setOpen(false);
    }
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Simulate
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Simulate</SheetTitle>
            <SheetDescription>Switch the profile you are viewing as.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-pagination-text">Profile</p>
              {PROTOTYPE_PERSONAS.map((option) => {
                const selected = option.id === persona;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => applyPersona(option.id)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left',
                      selected
                        ? 'border-create-claim-button bg-create-claim-button/5'
                        : 'border-claims-management-table-border bg-white hover:bg-muted',
                    )}
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold text-pagination-text">{option.title}</span>
                      <span className="text-sm text-pagination-text-muted">
                        {option.name} · {option.email}
                      </span>
                    </span>
                    {selected ? (
                      <Check className="text-create-claim-button size-4 shrink-0" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {showDms ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-pagination-text">DMS</p>
                <p className="text-sm text-pagination-text-muted">
                  Dealership ops can raise a claim with DMS or without it. The super profile can do both.
                </p>
                {DMS_SIMULATION_OPTIONS.map((option) => {
                  const selected = option.mode === mode;
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setMode(option.mode);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left',
                        selected
                          ? 'border-create-claim-button bg-create-claim-button/5'
                          : 'border-claims-management-table-border bg-white hover:bg-muted',
                      )}
                    >
                      <span className="text-sm font-semibold text-pagination-text">{option.title}</span>
                      {selected ? (
                        <Check className="text-create-claim-button size-4 shrink-0" aria-hidden />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
