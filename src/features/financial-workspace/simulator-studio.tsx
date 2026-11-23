'use client';
import { useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SegmentedTabs from '@/components/molecules/SegmentedTabs';
import UnderlineTabs from '@/components/molecules/UnderlineTabs';
import { STORIES, storyComplete, type Story } from './stories';
import { Deliverables } from './deliverables';
import { useFinancialWorkspace, type ApproachMode } from './provider';
import { SuggestedApproachStudio } from './suggested-approach';
import {
  EngineeringReadySimulatorView,
  EngineeringReadyV2SimulatorView,
  EngineeringReadyV3SimulatorView,
} from './engineering-ready';

export function SimulatorStudio({
  children,
  onLaunch,
  onClose,
}: {
  children: ReactNode;
  onLaunch: (id: string) => void;
  onClose?: () => void;
}) {
  const { configure, pending, setSelectedVan, approachMode, setApproachMode } =
    useFinancialWorkspace();
  const [subTab, setSubTab] = useState<'controls' | 'stories' | 'deliverables'>('controls');
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { partner } = useParams<{ partner: string }>();

  async function launch(story: Story) {
    await configure(story.topology, story.scenario, story.role);
    if (story.id === 'F01') setSelectedVan('all');
    onLaunch(story.id);
    router.push(`/${partner}/dashboard/${story.route}`);
  }

  const mainTabs: { id: ApproachMode; label: string }[] = [
    { id: 'engineering-ready-v3.1', label: 'Engineering ready v3.1' },
    { id: 'engineering-ready-v3', label: 'Engineering ready v3.0' },
  ];

  return (
    <div className="space-y-4">
      {/* Main Top-Level Tabs: Engineering ready v3.1 | Engineering ready v3.0 */}
      <div className="border-b border-border">
        <UnderlineTabs
          variant="flush"
          value={
            approachMode === 'engineering-ready-v3' || approachMode === 'engineering-ready-v3.1'
              ? approachMode
              : 'engineering-ready-v3.1'
          }
          onValueChange={(v) => setApproachMode(v as ApproachMode)}
          tabs={mainTabs.map((t) => ({ value: t.id, label: t.label }))}
        />
      </div>

      {/* When "Engineering ready v3.1" or "Engineering ready v3.0" is selected */}
      {approachMode === 'engineering-ready-v3' || approachMode === 'engineering-ready-v3.1' ? (
        <EngineeringReadyV3SimulatorView onClose={onClose}>
          {children}
        </EngineeringReadyV3SimulatorView>
      ) : approachMode === 'engineering-ready-v2' ? (
        <EngineeringReadyV2SimulatorView onClose={onClose}>
          {children}
        </EngineeringReadyV2SimulatorView>
      ) : approachMode === 'engineering-ready' ? (
        <EngineeringReadySimulatorView onClose={onClose}>{children}</EngineeringReadySimulatorView>
      ) : (
        /* When Approach 1, Approach 2, or Approach 3 is selected, render its sub-tabs: Controls | Stories | Deliverables */
        <div className="space-y-4">
          <SegmentedTabs
            value={subTab}
            onValueChange={(v) => setSubTab(v as 'controls' | 'stories' | 'deliverables')}
            tabs={[
              { value: 'controls', label: 'Controls' },
              { value: 'stories', label: `Stories (${STORIES.length})` },
              { value: 'deliverables', label: 'Deliverables' },
            ]}
          />

          {subTab === 'controls' ? (
            <div className="space-y-6">
              <SuggestedApproachStudio onClose={onClose} />
              <div className="border-t border-border pt-4">{children}</div>
            </div>
          ) : subTab === 'deliverables' ? (
            <Deliverables />
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Search a persona, job, issue or story"
                aria-label="Search stories"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Launching a story resets the synthetic session. Role switching in Controls preserves
                work so you can experience handoffs.
              </p>
              {STORIES.filter((s) =>
                `${s.id} ${s.title} ${s.persona} ${s.jtbd} ${s.source}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              ).map((s) => (
                <div key={s.id} className="rounded-xl border border-border p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium text-share-policy-primary">
                        {s.id} · {s.persona} · {s.cadence}
                      </span>
                      <h3 className="mt-1 font-semibold">{s.title}</h3>
                    </div>
                    <Button size="sm" disabled={pending} onClick={() => void launch(s)}>
                      Play story
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.jtbd}</p>
                  <p className="mt-3 text-xs">Maps to: {s.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StoryGuide({ id, onClose }: { id: string; onClose: () => void }) {
  const { snapshot } = useFinancialWorkspace();
  const [expanded, setExpanded] = useState(true);
  const story = STORIES.find((s) => s.id === id);
  if (!story) return null;
  const complete = storyComplete(story, snapshot);
  return (
    <section className="m-5 mb-0 rounded-xl border border-share-policy-primary/25 bg-icon-select-accent-bg/30 p-4">
      <div className="flex justify-between items-center gap-4">
        <div>
          <p className="text-xs text-share-policy-primary">
            GUIDED STORY · {story.id} · {story.persona}
          </p>
          <h2 className="mt-1 text-sm font-semibold">{story.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">
            {complete === null
              ? 'Review the expected outcome'
              : complete
                ? 'Expected state observed'
                : 'Scenario in progress'}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Collapse' : 'Show steps'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Exit story
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-6 text-sm">
          <ol className="list-decimal pl-4 space-y-1">
            {story.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div>
            <p className="font-medium">Expected outcome</p>
            <p className="mt-1 text-muted-foreground">{story.expected}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {story.source} · Fixture clock: 17 Oct 2026, 10:42 IST
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
