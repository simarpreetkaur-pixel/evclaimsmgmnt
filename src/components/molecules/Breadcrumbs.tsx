'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Breadcrumb = {
  label: string;
  href: string;
  isCurrent: boolean;
};

const getBreadcrumbs = (pathname: string): Breadcrumb[] => {
  const paths = pathname.split('/').filter(Boolean);
  const baseSegments = paths.slice(0, 2);
  const breadcrumbSegments = paths.slice(2);

  const items = breadcrumbSegments.map((segment, index) => {
    const fullPath = [...baseSegments, ...breadcrumbSegments.slice(0, index + 1)];

    const isCurrent = index === breadcrumbSegments.length - 1;

    return {
      label: segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      href: `/${fullPath.join('/')}`,
      isCurrent,
    };
  });

  const onlySegment = breadcrumbSegments.length === 1 ? breadcrumbSegments[0] : null;
  if (onlySegment === 'create-claim' || onlySegment === 'claim-details') {
    return [
      {
        label: 'Claims Management',
        href: `/${[...baseSegments, 'claims-management'].join('/')}`,
        isCurrent: false,
      },
      ...items,
    ];
  }

  return items;
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex flex-wrap items-center gap-3 text-sm text-muted-foreground')}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => router.back()}
        aria-label="Go back"
        className="size-8 rounded-md border-input bg-white text-muted-foreground shadow-xs"
      >
        <ArrowLeftIcon className="size-4" />
      </Button>

      {breadcrumbs.map((item, index) => {
        const content = !item.isCurrent ? (
          <Link href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
            {item.label}
          </Link>
        ) : (
          <span className="font-semibold text-foreground">{item.label}</span>
        );

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-3">
            {content}
            {!item.isCurrent && <ChevronRightIcon className="size-4 text-muted-foreground" />}
          </div>
        );
      })}
    </nav>
  );
}
