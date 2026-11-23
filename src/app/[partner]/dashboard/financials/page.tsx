import Financials from '@/features/financials';
import { PrototypeFinancials } from '@/features/financials/PrototypeFinancials';
import { FINANCIAL_SIMULATOR_ENABLED } from '@/features/financial-workspace/config';
import { FinancialLedger } from '@/features/financial-workspace/ledger-screen';
import { PROTOTYPE_MODE } from '@/lib/prototype/session';

export default function FinancialsPage() {
  const screen = FINANCIAL_SIMULATOR_ENABLED ? <FinancialLedger /> : <Financials />;
  if (PROTOTYPE_MODE) {
    return <PrototypeFinancials fallback={screen} />;
  }
  return screen;
}
