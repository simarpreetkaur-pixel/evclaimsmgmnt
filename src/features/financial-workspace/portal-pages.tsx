'use client';
import { useState } from 'react';
import Overview from '@/features/overview';
import Reports from '@/features/reports';
import UnderlineTabs from '@/components/molecules/UnderlineTabs';
import { FinancialStatements } from './statements-screen';
import { SuggestedApproachOverviewSection } from './suggested-approach';

export function PortalOverview() {
  return (
    <>
      <SuggestedApproachOverviewSection />
      <Overview hideHeaderAndKpis />
    </>
  );
}

export function PortalReports() {
  const [tab, setTab] = useState('statements');
  return (
    <>
      <div className="px-6 pt-4">
        <UnderlineTabs
          value={tab}
          onValueChange={setTab}
          tabs={[
            { value: 'statements', label: 'Financial statements' },
            { value: 'reports', label: 'Business reports' },
          ]}
        />
      </div>
      {tab === 'statements' ? <FinancialStatements /> : <Reports />}
    </>
  );
}
