'use client';

import { EnvelopeIcon, GlobeIcon, MapPinIcon, PhoneIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/types";
import { FormattedText } from '@/components/ui/formatted-text';

interface AzurillTemplateProps {
  content: ResumeContent;
}

const sectionClassName = cn(
  // Heading Decoration in Sidebar Layout
  "group-data-[layout=sidebar]:[&>h6]:px-4",
  "group-data-[layout=sidebar]:[&>h6]:relative",
  "group-data-[layout=sidebar]:[&>h6]:inline-flex",
  "group-data-[layout=sidebar]:[&>h6]:items-center",
  "group-data-[layout=sidebar]:[&>h6]:before:content-['']",
  "group-data-[layout=sidebar]:[&>h6]:before:absolute",
  "group-data-[layout=sidebar]:[&>h6]:before:left-0",
  "group-data-[layout=sidebar]:[&>h6]:before:rounded-full",
  "group-data-[layout=sidebar]:[&>h6]:before:size-2",
  "group-data-[layout=sidebar]:[&>h6]:before:border",
  "group-data-[layout=sidebar]:[&>h6]:before:border-blue-500",
  "group-data-[layout=sidebar]:[&>h6]:after:content-['']",
  "group-data-[layout=sidebar]:[&>h6]:after:absolute",
  "group-data-[layout=sidebar]:[&>h6]:after:right-0",
  "group-data-[layout=sidebar]:[&>h6]:after:rounded-full",
  "group-data-[layout=sidebar]:[&>h6]:after:size-2",
  "group-data-[layout=sidebar]:[&>h6]:after:border",
  "group-data-[layout=sidebar]:[&>h6]:after:border-blue-500",

  // Section in Sidebar Layout
  "group-data-[layout=sidebar]:[&_.section-item-header>div]:flex-col",
  "group-data-[layout=sidebar]:[&_.section-item-header>div]:items-start",

  // Section in Main Layout
  "group-data-[layout=main]:[&>.section-content]:relative",
  "group-data-[layout=main]:[&>.section-content]:ml-4",
  "group-data-[layout=main]:[&>.section-content]:pl-4",
  "group-data-[layout=main]:[&>.section-content]:border-l",
  "group-data-[layout=main]:[&>.section-content]:border-blue-500",

  // Timeline Marker in Main Layout
  "group-data-[layout=main]:[&>.section-content]:after:content-['']",
  "group-data-[layout=main]:[&>.section-content]:after:absolute",
  "group-data-[layout=main]:[&>.section-content]:after:top-5",
  "group-data-[layout=main]:[&>.section-content]:after:left-0",
  "group-data-[layout=main]:[&>.section-content]:after:size-2.5",
  "group-data-[layout=main]:[&>.section-content]:after:translate-x-[-50%]",
  "group-data-[layout=main]:[&>.section-content]:after:translate-y-[-50%]",
  "group-data-[layout=main]:[&>.section-content]:after:rounded-full",
  "group-data-[layout=main]:[&>.section-content]:after:border",
  "group-data-[layout=main]:[&>.section-content]:after:border-blue-500",
  "group-data-[layout=main]:[&>.section-content]:after:bg-white",
);

/**
 * Template: Azurill
 */
export function AzurillTemplate({ content }: AzurillTemplateProps) {
  const { personal_info, summary, experience, education, skills } = content;

  return (
    <div className="template-azurill bg-white p-8 max-w-[210mm] mx-auto">
      {/* Header */}
      <div className="page-header flex flex-col items-center gap-4 mb-8">
        <div className="page-basics space-y-3 text-center">
          <div className="basics-header">
            <h2 className="basics-name text-3xl font-bold text-zinc-900">
              {personal_info.first_name} {personal_info.last_name}
            </h2>
            <p className="basics-headline text-lg text-gray-600">{summary}</p>
          </div>

          <div className="basics-items flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-zinc-700">
            {personal_info.email && (
              <div className="basics-item-email flex items-center gap-1.5">
                <EnvelopeIcon className="w-4 h-4" />
                <a href={`mailto:${personal_info.email}`} className="hover:underline">
                  {personal_info.email}
                </a>
              </div>
            )}

            {personal_info.phone && (
              <div className="basics-item-phone flex items-center gap-1.5">
                <PhoneIcon className="w-4 h-4" />
                <a href={`tel:${personal_info.phone}`} className="hover:underline">
                  {personal_info.phone}
                </a>
              </div>
            )}

            {personal_info.location && (
              <div className="basics-item-location flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4" />
                <span>{personal_info.location}</span>
              </div>
            )}

            {personal_info.website && (
              <div className="basics-item-website flex items-center gap-1.5">
                <GlobeIcon className="w-4 h-4" />
                <a href={personal_info.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {personal_info.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside data-layout="sidebar" className="group w-64 shrink-0 space-y-6">
          {/* Skills */}
          {skills && skills.length > 0 && (
            <section className={sectionClassName}>
              <h6 className="text-base font-bold mb-3 text-zinc-900">Skills</h6>
              <div className="section-content space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="text-sm">
                    <span className="font-medium text-zinc-900">{skill.name}</span>
                    {skill.level && (
                      <span className="text-xs text-zinc-500 ml-2">({skill.level})</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Main */}
        <main data-layout="main" className="group grow space-y-6">
          {/* Experience */}
          {experience && experience.length > 0 && (
            <section className={sectionClassName}>
              <h6 className="text-lg font-bold mb-4 text-zinc-900">Work Experience</h6>
              <div className="section-content space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900">{exp.position}</h3>
                        <p className="text-sm text-zinc-600 font-medium">{exp.company}</p>
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        <p>{exp.location}</p>
                        <p>
                          {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                        </p>
                      </div>
                    </div>
                    {exp.description && (
                      <FormattedText
                        text={exp.description}
                        className="text-sm text-zinc-700 mt-2 leading-relaxed"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <section className={sectionClassName}>
              <h6 className="text-lg font-bold mb-4 text-zinc-900">Education</h6>
              <div className="section-content space-y-3">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900">
                          {edu.degree} in {edu.field}
                        </h3>
                        <p className="text-sm text-zinc-600">{edu.institution}</p>
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        <p>{edu.location}</p>
                        <p>
                          {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
