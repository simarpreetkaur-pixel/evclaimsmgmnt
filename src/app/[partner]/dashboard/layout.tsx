import { Suspense, type ReactNode } from 'react';

import { LayoutWrapper } from '@/components/templates/DashboardLayout';
import { PROTOTYPE_MODE } from '@/lib/prototype/session';
import { PROTOTYPE_DEALERSHIPS } from '@/lib/prototype/dealerships';

export function generateStaticParams() {
  // Prototype builds (e.g. GitHub Pages) pre-render every demo dealership so
  // switching dealerships and reloading a dashboard URL both work statically.
  const prototypeParams = PROTOTYPE_MODE
    ? PROTOTYPE_DEALERSHIPS.map((dealership) => ({ partner: dealership.id }))
    : [];
  return [{ partner: 'demo' }, ...prototypeParams];
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LayoutWrapper>{children}</LayoutWrapper>
    </Suspense>
  );
}
