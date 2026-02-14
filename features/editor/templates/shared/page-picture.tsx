'use client';

import { useResumeStore } from '../../store/resume';
import Image from 'next/image';

export function PagePicture() {
  const picture = useResumeStore((state) => state.resume.data.basics.picture);

  if (!picture) return null;

  return (
    <div className="page-picture relative w-32 h-32 rounded-full overflow-hidden border-4 border-(--page-primary-color)">
      <Image
        src={picture}
        alt="Profile"
        fill
        className="object-cover"
      />
    </div>
  );
}
