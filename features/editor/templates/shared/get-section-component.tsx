'use client';

import { cn } from '@/lib/utils';

interface SectionOptions {
  sectionClassName?: string;
}

// Placeholder section components
function DefaultSection({ id, sectionClassName }: { id: string; sectionClassName?: string }) {
  return (
    <section className={cn('section', sectionClassName)}>
      <h6 className="section-heading text-lg font-bold mb-3">
        {id.charAt(0).toUpperCase() + id.slice(1)}
      </h6>
      <div className="section-content">
        <p className="text-sm text-gray-600">
          {id} section content will be displayed here.
        </p>
      </div>
    </section>
  );
}

// Section component mapping
const sectionComponents: Record<string, React.ComponentType<any>> = {
  summary: DefaultSection,
  experience: DefaultSection,
  education: DefaultSection,
  skills: DefaultSection,
  projects: DefaultSection,
  certifications: DefaultSection,
  languages: DefaultSection,
  interests: DefaultSection,
};

export function getSectionComponent(sectionId: string, options: SectionOptions = {}) {
  const Component = sectionComponents[sectionId] || DefaultSection;
  
  return ({ id }: { id: string }) => (
    <Component id={id} sectionClassName={options.sectionClassName} />
  );
}
