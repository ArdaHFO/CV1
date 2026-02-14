'use client';

import type { ResumeContent } from '@/types';
import { LatexPreview } from './latexRenderer';
import { FormattedText } from '@/components/ui/formatted-text';

interface AcademicTemplateProps {
  content: ResumeContent;
  latexCode?: string;
  onLatexChange?: (latex: string) => void;
  hideLatexCode?: boolean;
}

// Helper function to generate LaTeX from CV content
function generateLatexFromContent(content: ResumeContent): string {
  const { personal_info, summary, experience, education, skills } = content;
  
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}

\\begin{document}

% Header
\\begin{center}
    {\\LARGE\\bfseries ${personal_info.first_name} ${personal_info.last_name}}\\\\[4pt]
    ${personal_info.email ? `${personal_info.email}` : ''} \\quad 
    ${personal_info.phone ? `${personal_info.phone}` : ''} \\quad 
    ${personal_info.location ? `${personal_info.location}` : ''}\\\\
    ${personal_info.website ? `\\href{${personal_info.website}}{${personal_info.website}}` : ''}
\\end{center}

${summary ? `\\section*{Summary}
${summary}

` : ''}% Experience
${experience && experience.length > 0 ? `\\section*{Professional Experience}

${experience.map(exp => `\\textbf{${exp.position}} \\hfill ${exp.start_date} -- ${exp.is_current ? 'Present' : exp.end_date}\\\\
\\textit{${exp.company}}, ${exp.location}
${exp.description ? `
\\begin{itemize}[leftmargin=*, noitemsep]
    \\item ${exp.description.replace(/\n/g, '\n    \\item ')}
\\end{itemize}
` : ''}
`).join('\n')}` : ''}

${education && education.length > 0 ? `\\section*{Education}

${education.map(edu => `\\textbf{${edu.degree} in ${edu.field}} \\hfill ${edu.start_date} -- ${edu.is_current ? 'Present' : edu.end_date}\\\\
\\textit{${edu.institution}}, ${edu.location}${edu.gpa ? ` \\quad GPA: ${edu.gpa}` : ''}

`).join('\n')}` : ''}

${skills && skills.length > 0 ? `\\section*{Skills}

\\begin{itemize}[leftmargin=*, noitemsep]
${skills.map(skill => `    \\item \\textbf{${skill.name}}${skill.level ? ` (${skill.level})` : ''}`).join('\n')}
\\end{itemize}` : ''}

\\end{document}`;
}

// Export the function for use in editor
export { generateLatexFromContent };

export function AcademicTemplate({ content, latexCode, onLatexChange, hideLatexCode = false }: AcademicTemplateProps) {
  const { personal_info, summary, experience, education, skills } = content;
  
  const defaultLatex = generateLatexFromContent(content);
  const displayLatex = latexCode || defaultLatex;

  // If we have custom LaTeX code and we're in editor mode (hideLatexCode=true),
  // render the LaTeX directly to show custom sections
  if (hideLatexCode && latexCode) {
    return (
      <div className="template-academic bg-white p-8 max-w-[210mm] mx-auto">
        <LatexPreview latexCode={displayLatex} />
      </div>
    );
  }

  return (
    <div className="template-academic bg-white p-8 max-w-[210mm] mx-auto">
      {/* Academic CV Layout */}
      <div className="text-center border-b border-gray-300 pb-4 mb-6">
        <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-1">
          {personal_info.first_name} {personal_info.last_name}
        </h1>
        <div className="text-sm text-zinc-600 space-x-2">
          {personal_info.email && <span>{personal_info.email}</span>}
          {personal_info.phone && (
            <>
              <span>•</span>
              <span>{personal_info.phone}</span>
            </>
          )}
          {personal_info.location && (
            <>
              <span>•</span>
              <span>{personal_info.location}</span>
            </>
          )}
        </div>
        {personal_info.website && (
          <div className="text-sm text-blue-600 mt-1">
            <a href={personal_info.website} target="_blank" rel="noopener noreferrer">
              {personal_info.website}
            </a>
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-lg font-serif font-bold text-zinc-900 mb-2 border-b border-gray-200">
            SUMMARY
          </h2>
          <p className="text-sm text-zinc-700 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Education (First in academic CVs) */}
      {education && education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-serif font-bold text-zinc-900 mb-3 border-b border-gray-200">
            EDUCATION
          </h2>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="text-sm">
                <div className="flex justify-between items-baseline">
                  <div className="font-semibold text-zinc-900">
                    {edu.degree} in {edu.field}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}
                  </div>
                </div>
                <div className="text-zinc-600 italic">{edu.institution}, {edu.location}</div>
                {edu.gpa && (
                  <div className="text-zinc-600 mt-1">GPA: {edu.gpa}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-serif font-bold text-zinc-900 mb-3 border-b border-gray-200">
            PROFESSIONAL EXPERIENCE
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-sm">
                <div className="flex justify-between items-baseline">
                  <div className="font-semibold text-zinc-900">{exp.position}</div>
                  <div className="text-xs text-zinc-500">
                    {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                  </div>
                </div>
                <div className="text-zinc-600 italic">{exp.company}, {exp.location}</div>
                {exp.description && (
                  <FormattedText
                    text={exp.description}
                    className="text-zinc-700 mt-2 leading-relaxed text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-serif font-bold text-zinc-900 mb-3 border-b border-gray-200">
            SKILLS
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {skills.map((skill) => (
              <div key={skill.id} className="text-zinc-700">
                <span className="font-medium">{skill.name}</span>
                {skill.level && <span className="text-zinc-500 text-xs ml-2">({skill.level})</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LaTeX Code Section - Only show when not in editor */}
      {!hideLatexCode && (
      <div className="mt-8 pt-6 border-t-2 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <h3 className="text-base font-semibold text-zinc-900">LaTeX Source Code</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <pre className="text-zinc-800 whitespace-pre-wrap">{displayLatex}</pre>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          💡 This CV can be compiled with LaTeX. Copy the code above and use it with Overleaf or your local LaTeX compiler.
        </p>
      </div>
      )}
    </div>
  );
}
