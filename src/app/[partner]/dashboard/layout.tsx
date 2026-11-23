import { Suspense, type ReactNode } from 'react';

import { LayoutWrapper } from '@/components/templates/DashboardLayout';

export function generateStaticParams() {
  return [{ partner: 'demo' }];
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LayoutWrapper>{children}</LayoutWrapper>
    </Suspense>
  );
}
