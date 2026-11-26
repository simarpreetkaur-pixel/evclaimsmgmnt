import { FINANCIAL_SIMULATOR_ENABLED } from '@/features/financial-workspace/config';
import { PrototypeCustomerSettings } from '@/features/settings/PrototypeCustomerSettings';
import { PROTOTYPE_MODE } from '@/lib/prototype/session';
import { redirect } from 'next/navigation';

type SettingsPageProps = {
  params: Promise<{ partner: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { partner } = await params;
  if (PROTOTYPE_MODE) {
    return <PrototypeCustomerSettings />;
  }
  redirect(
    `/${partner}/dashboard/settings/${FINANCIAL_SIMULATOR_ENABLED ? 'access-management' : 'configure-metrics'}`,
  );
}
