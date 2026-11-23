import Overview from '@/features/overview';
import { PrototypeOverview } from '@/features/overview/PrototypeOverview';
import { FINANCIAL_SIMULATOR_ENABLED } from '@/features/financial-workspace/config';
import { PortalOverview } from '@/features/financial-workspace/portal-pages';
import { PROTOTYPE_MODE } from '@/lib/prototype/session';

export default function OverviewPage() {
  if (PROTOTYPE_MODE) {
    return <PrototypeOverview />;
  }

  return FINANCIAL_SIMULATOR_ENABLED ? <PortalOverview /> : <Overview />;
}
