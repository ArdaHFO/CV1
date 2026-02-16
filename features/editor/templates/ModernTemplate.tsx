'use client';

import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';
import type { ResumeContent } from '@/types';
import { FormattedText } from '@/components/ui/formatted-text';

interface ModernTemplateProps {
  content: ResumeContent;
}

export function ModernTemplate({ content }: ModernTemplateProps) {
  const { personal_info, summary, experience, education, skills, custom_sections } = content;

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto shadow-lg">
      {/* Header */}
      <header className="border-b-4 border-zinc-900 pb-6 mb-6">
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">
          {personal_info.first_name} {personal_info.last_name}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
          {personal_info.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>{personal_info.email}</span>
            </div>
          )}
          {personal_info.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{personal_info.phone}</span>
            </div>
          )}
          {personal_info.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{personal_info.location}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-zinc-600 mt-2">
          {personal_info.website && (
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <a href={personal_info.website} className="hover:underline">
                {personal_info.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {personal_info.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="w-4 h-4" />
              <span>{personal_info.linkedin}</span>
            </div>
          )}
          {personal_info.github && (
            <div className="flex items-center gap-1">
              <Github className="w-4 h-4" />
              <span>{personal_info.github}</span>
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-3 uppercase tracking-wide">
            About Me
          </h2>
          <p className="text-zinc-700 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-3 uppercase tracking-wide">
            Work Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">{exp.position}</h3>
                    <p className="text-zinc-600 font-medium">{exp.company}</p>
                  </div>
                  <div className="text-right text-sm text-zinc-500">
                    <p>{exp.location}</p>
                    <p>
                      {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                    </p>
                  </div>
                </div>
                {exp.description && (
                  <FormattedText
                    text={exp.description}
                    className="text-zinc-700 mt-2 leading-relaxed"
                  />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc list-inside mt-2 text-zinc-700 space-y-1">
                    {exp.achievements.map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-3 uppercase tracking-wide">
            Education
          </h2>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {edu.degree} - {edu.field}
                    </h3>
                    <p className="text-zinc-600 font-medium">{edu.institution}</p>
                    {edu.gpa && (
                      <p className="text-zinc-600 text-sm">GPA: {edu.gpa}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-zinc-500">
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

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-3 uppercase tracking-wide">
            Skills
          </h2>
          {Array.from(new Set(skills.map((s) => s.category))).map((category) => (
            <div key={category} className="mb-3">
              <h3 className="text-sm font-semibold text-zinc-700 mb-2">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {skills
                  .filter((s) => s.category === category)
                  .map((skill) => (
                    <span
                      key={skill.id}
                      className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded text-sm"
                    >
                      {skill.name}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Custom Sections */}
      {custom_sections && custom_sections.length > 0 && (
        <>
          {custom_sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <section key={section.id} className="mb-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-3 uppercase tracking-wide">
                  {section.title}
                </h2>
                <FormattedText
                  text={section.content}
                  className="text-zinc-700 leading-relaxed"
                />
              </section>
            ))}
        </>
      )}
    </div>
  );
}
