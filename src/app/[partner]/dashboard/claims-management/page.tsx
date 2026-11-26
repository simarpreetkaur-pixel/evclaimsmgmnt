import ClaimsManagement from '@/features/claims-management';
import { PrototypeClaimsManagement } from '@/features/claims/PrototypeClaimsManagement';
import { PROTOTYPE_MODE } from '@/lib/prototype/session';

export default async function ClaimsManagementPage() {
  if (PROTOTYPE_MODE) {
    return <PrototypeClaimsManagement />;
  }

  return <ClaimsManagement />;
}
