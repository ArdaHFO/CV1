'use client';

import * as PhosphorIcons from '@phosphor-icons/react';

interface PageIconProps {
  icon: string;
  className?: string;
}

export function PageIcon({ icon, className }: PageIconProps) {
  // Phosphor icon adını component'e çevirme
  const IconComponent = (PhosphorIcons as any)[icon];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={className} />;
}
