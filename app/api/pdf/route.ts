import { NextRequest, NextResponse } from 'next/server';
import type { ResumeContent, TemplateType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { content, template = 'modern', fileName = 'cv.pdf', latexCode } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'CV content is required' },
        { status: 400 }
      );
    }

    // Generate HTML from CV content with template style
    const html = generateHTML(content, fileName, template, latexCode);

    // For production, you'd use a service like:
    // - Puppeteer (headless Chrome)
    // - wkhtmltopdf
    // - SendGrid's PDF service
    // - Vercel's built-in PDF support
    // 
    // For now, we'll return the HTML that can be printed as PDF client-side
    // or use a third-party service

    return NextResponse.json({
      success: true,
      html,
      message: 'PDF generation prepared. Use client-side printing or a PDF service.',
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generateHTML(content: ResumeContent, fileName: string, template: TemplateType = 'modern', latexCode?: string): string {
  const personalInfo = content.personal_info;
  const fullName = `${personalInfo.first_name} ${personalInfo.last_name}`;
  const isCurrentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatDate = (date: string) => {
    if (!date) return 'Present';
    const [year, month] = date.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  // Helper function to format text with markdown-like syntax
  const formatText = (text: string): string => {
    if (!text) return '';
    
    return text
      .split('\n')
      .map(line => {
        const trimmedLine = line.trim();
        
        // Handle bullet points
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          const content = trimmedLine.substring(1).trim();
          const formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          return `<div style="display: flex; gap: 8px; margin: 4px 0;"><span>•</span><span>${formattedContent}</span></div>`;
        }
        
        // Handle numbered lists
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          const [, number, content] = numberedMatch;
          const formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          return `<div style="display: flex; gap: 8px; margin: 4px 0;"><span>${number}.</span><span>${formattedContent}</span></div>`;
        }
        
        // Regular line with inline formatting
        if (!trimmedLine) return '<br/>';
        
        return line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
      })
      .join('\n');
  };

  // Generate template-specific HTML
  if (template === 'azurill') {
    return generateAzurillHTML(content, fileName, formatDate, formatText);
  } else if (template === 'academic') {
    return generateAcademicHTML(content, fileName, formatDate, latexCode, formatText);
  }

  // Default Modern template
  return generateModernHTML(content, fileName, formatDate, formatText);
}

function generateModernHTML(content: ResumeContent, fileName: string, formatDate: (date: string) => string, formatText: (text: string) => string): string {
  const personalInfo = content.personal_info;
  const fullName = `${personalInfo.first_name} ${personalInfo.last_name}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <meta name="template" content="modern">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 8.5in;
            height: 11in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
        }
        
        .header h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .contact-info {
            font-size: 11px;
            color: #666;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .contact-info span {
            display: inline-block;
        }
        
        .contact-info span:not(:last-child)::after {
            content: ' •';
            margin-left: 10px;
        }
        
        .section {
            margin-bottom: 15px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1f2937;
            text-transform: uppercase;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        
        .summary {
            font-size: 11px;
            line-height: 1.5;
            color: #666;
        }
        
        .entry {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        
        .entry-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        
        .entry-title {
            font-weight: bold;
            font-size: 12px;
            color: #1f2937;
        }
        
        .entry-subtitle {
            font-size: 11px;
            color: #666;
            font-style: italic;
        }
        
        .entry-date {
            font-size: 11px;
            color: #999;
        }
        
        .entry-location {
            font-size: 11px;
            color: #999;
        }
        
        .entry-description {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
            line-height: 1.4;
        }
        
        .achievements {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
            margin-left: 20px;
        }
        
        .achievements li {
            list-style: none;
            margin-bottom: 2px;
        }
        
        .achievements li:before {
            content: "• ";
            color: #2563eb;
            font-weight: bold;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 11px;
        }
        
        .skill-item {
            display: inline-block;
            background: #f0f0f0;
            padding: 3px 8px;
            border-radius: 3px;
            margin-right: 5px;
            margin-bottom: 5px;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .container {
                margin: 0;
                padding: 0.5in;
                max-width: 100%;
                height: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>${fullName}</h1>
            <div class="contact-info">
                ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ''}
                ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ''}
                ${personalInfo.location ? `<span>${personalInfo.location}</span>` : ''}
                ${personalInfo.linkedin ? `<span>${personalInfo.linkedin}</span>` : ''}
            </div>
        </div>
        
        <!-- Summary -->
        ${content.summary ? `
        <div class="section">
            <div class="section-title">Professional Summary</div>
            <div class="summary">${content.summary}</div>
        </div>
        ` : ''}
        
        <!-- Experience -->
        ${content.experience && content.experience.length > 0 ? `
        <div class="section">
            <div class="section-title">Professional Experience</div>
            ${content.experience.map(exp => `
            <div class="entry">
                <div class="entry-header">
                    <div>
                        <div class="entry-title">${exp.position}</div>
                        <div class="entry-subtitle">${exp.company}</div>
                    </div>
                    <div class="entry-date">${formatDate(exp.start_date)} - ${exp.is_current ? 'Present' : formatDate(exp.end_date || '')}</div>
                </div>
                ${exp.location ? `<div class="entry-location">${exp.location}</div>` : ''}
                ${exp.description ? `<div class="entry-description">${formatText(exp.description)}</div>` : ''}
                ${exp.achievements && exp.achievements.length > 0 ? `
                <ul class="achievements">
                    ${exp.achievements.map(ach => `<li>${ach}</li>`).join('')}
                </ul>
                ` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        <!-- Education -->
        ${content.education && content.education.length > 0 ? `
        <div class="section">
            <div class="section-title">Education</div>
            ${content.education.map(edu => `
            <div class="entry">
                <div class="entry-header">
                    <div>
                        <div class="entry-title">${edu.degree} in ${edu.field}</div>
                        <div class="entry-subtitle">${edu.institution}</div>
                    </div>
                    <div class="entry-date">${formatDate(edu.start_date)} - ${edu.is_current ? 'Present' : formatDate(edu.end_date || '')}</div>
                </div>
                ${edu.location ? `<div class="entry-location">${edu.location}</div>` : ''}
                ${edu.gpa ? `<div class="entry-description"><strong>GPA:</strong> ${edu.gpa}</div>` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        <!-- Skills -->
        ${content.skills && content.skills.length > 0 ? `
        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-grid">
                ${content.skills.map(skill => `
                <div class="skill-item">${skill.name}</div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>
    
    <script>
        // Auto-print when page loads (optional)
        // window.print();
    </script>
</body>
</html>
  `;

  return html;
}

function generateAzurillHTML(content: any, fileName: string, formatDate: Function, formatText: (text: string) => string): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="template" content="azurill">
    <title>${fileName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #27272a;
            background: white;
            padding: 32px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #e4e4e7;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 8px;
        }
        
        .header .headline {
            font-size: 16px;
            color: #52525b;
            margin-bottom: 16px;
        }
        
        .header .contact {
            display: flex;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 14px;
            color: #3f3f46;
        }
        
        .header .contact a {
            color: #2563eb;
            text-decoration: none;
        }
        
        .content {
            display: flex;
            gap: 32px;
        }
        
        .sidebar {
            width: 256px;
            flex-shrink: 0;
        }
        
        .main {
            flex-grow: 1;
        }
        
        .section {
            margin-bottom: 24px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 12px;
            position: relative;
            display: inline-flex;
            align-items: center;
            padding: 0 16px;
        }
        
        .sidebar .section-title::before,
        .sidebar .section-title::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 2px solid #2563eb;
        }
        
        .sidebar .section-title::before {
            left: 0;
        }
        
        .sidebar .section-title::after {
            right: 0;
        }
        
        .main .section {
            position: relative;
            margin-left: 16px;
            padding-left: 16px;
            border-left: 2px solid #2563eb;
        }
        
        .main .section::before {
            content: '';
            position: absolute;
            top: 20px;
            left: -6px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 2px solid #2563eb;
            background: white;
        }
        
        .main .section-title {
            font-size: 18px;
            padding: 0;
        }
        
        .skill-item {
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .skill-item .name {
            font-weight: 500;
            color: #18181b;
        }
        
        .skill-item .level {
            font-size: 12px;
            color: #71717a;
            margin-left: 8px;
        }
        
        .exp-item {
            margin-bottom: 16px;
        }
        
        .exp-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 4px;
        }
        
        .exp-title {
            font-size: 16px;
            font-weight: 600;
            color: #18181b;
        }
        
        .exp-company {
            font-size: 14px;
            font-weight: 500;
            color: #52525b;
        }
        
        .exp-meta {
            text-align: right;
            font-size: 12px;
            color: #71717a;
        }
        
        .exp-description {
            font-size: 14px;
            color: #3f3f46;
            margin-top: 8px;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        
        .edu-item {
            margin-bottom: 12px;
        }
        
        .edu-degree {
            font-size: 16px;
            font-weight: 600;
            color: #18181b;
        }
        
        .edu-institution {
            font-size: 14px;
            color: #52525b;
        }
        
        @media print {
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${content.personal_info.first_name} ${content.personal_info.last_name}</h1>
            ${content.summary ? `<p class="headline">${content.summary}</p>` : ''}
            <div class="contact">
                ${content.personal_info.email ? `<span>✉️ <a href="mailto:${content.personal_info.email}">${content.personal_info.email}</a></span>` : ''}
                ${content.personal_info.phone ? `<span>📱 <a href="tel:${content.personal_info.phone}">${content.personal_info.phone}</a></span>` : ''}
                ${content.personal_info.location ? `<span>📍 ${content.personal_info.location}</span>` : ''}
                ${content.personal_info.website ? `<span>🌐 <a href="${content.personal_info.website}" target="_blank">${content.personal_info.website.replace(/^https?:\/\//, '')}</a></span>` : ''}
            </div>
        </div>
        
        <div class="content">
            <aside class="sidebar">
                ${content.skills && content.skills.length > 0 ? `
                <div class="section">
                    <div class="section-title">Skills</div>
                    <div class="section-content">
                        ${content.skills.map((skill: any) => `
                        <div class="skill-item">
                            <span class="name">${skill.name}</span>
                            ${skill.level ? `<span class="level">(${skill.level})</span>` : ''}
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </aside>
            
            <main class="main">
                ${content.experience && content.experience.length > 0 ? `
                <div class="section">
                    <div class="section-title">Work Experience</div>
                    <div class="section-content">
                        ${content.experience.map((exp: any) => `
                        <div class="exp-item">
                            <div class="exp-header">
                                <div>
                                    <div class="exp-title">${exp.position}</div>
                                    <div class="exp-company">${exp.company}</div>
                                </div>
                                <div class="exp-meta">
                                    <div>${exp.location}</div>
                                    <div>${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}</div>
                                </div>
                            </div>
                            ${exp.description ? `<div class="exp-description">${formatText(exp.description)}</div>` : ''}
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${content.education && content.education.length > 0 ? `
                <div class="section">
                    <div class="section-title">Education</div>
                    <div class="section-content">
                        ${content.education.map((edu: any) => `
                        <div class="edu-item">
                            <div class="exp-header">
                                <div>
                                    <div class="edu-degree">${edu.degree} in ${edu.field}</div>
                                    <div class="edu-institution">${edu.institution}</div>
                                </div>
                                <div class="exp-meta">
                                    <div>${edu.location}</div>
                                    <div>${edu.start_date} - ${edu.is_current ? 'Present' : edu.end_date}</div>
                                </div>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </main>
        </div>
    </div>
</body>
</html>
  `;
  
  return html;
}

function generateAcademicHTML(content: any, fileName: string, formatDate: Function, latexCode: string | undefined, formatText: (text: string) => string): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="template" content="academic">
    <title>${fileName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1.6;
            color: #27272a;
            background: white;
            padding: 32px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            padding-bottom: 16px;
            margin-bottom: 24px;
            border-bottom: 1px solid #d4d4d8;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 4px;
        }
        
        .header .contact {
            font-size: 14px;
            color: #52525b;
        }
        
        .header .contact a {
            color: #2563eb;
            text-decoration: none;
        }
        
        .section {
            margin-bottom: 24px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e4e4e7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary {
            font-size: 14px;
            color: #3f3f46;
            line-height: 1.8;
        }
        
        .item {
            margin-bottom: 16px;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 4px;
        }
        
        .item-title {
            font-size: 14px;
            font-weight: 600;
            color: #18181b;
        }
        
        .item-subtitle {
            font-size: 14px;
            font-style: italic;
            color: #52525b;
        }
        
        .item-date {
            font-size: 12px;
            color: #71717a;
        }
        
        .item-description {
            font-size: 14px;
            color: #3f3f46;
            margin-top: 8px;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }
        
        .skill-item {
            font-size: 14px;
            color: #3f3f46;
        }
        
        .skill-item .name {
            font-weight: 500;
        }
        
        .skill-item .level {
            font-size: 12px;
            color: #71717a;
            margin-left: 8px;
        }
        
        .latex-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 2px solid #bfdbfe;
        }
        
        .latex-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .latex-header h3 {
            font-size: 16px;
            font-weight: 600;
            color: #18181b;
        }
        
        .latex-code {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            overflow-x: auto;
            color: #1f2937;
            white-space: pre-wrap;
        }
        
        .latex-note {
            font-size: 12px;
            color: #71717a;
            margin-top: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        @media print {
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${content.personal_info.first_name} ${content.personal_info.last_name}</h1>
            <div class="contact">
                ${content.personal_info.email ? `<span>${content.personal_info.email}</span>` : ''}
                ${content.personal_info.phone ? `<span> • ${content.personal_info.phone}</span>` : ''}
                ${content.personal_info.location ? `<span> • ${content.personal_info.location}</span>` : ''}
            </div>
            ${content.personal_info.website ? `
            <div class="contact" style="margin-top: 4px;">
                <a href="${content.personal_info.website}" target="_blank">${content.personal_info.website}</a>
            </div>
            ` : ''}
        </div>
        
        ${content.summary ? `
        <div class="section">
            <div class="section-title">Summary</div>
            <p class="summary">${content.summary}</p>
        </div>
        ` : ''}
        
        ${content.education && content.education.length > 0 ? `
        <div class="section">
            <div class="section-title">Education</div>
            ${content.education.map((edu: any) => `
            <div class="item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${edu.degree} in ${edu.field}</div>
                        <div class="item-subtitle">${edu.institution}, ${edu.location}</div>
                    </div>
                    <div class="item-date">${edu.start_date} - ${edu.is_current ? 'Present' : edu.end_date}</div>
                </div>
                ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${content.experience && content.experience.length > 0 ? `
        <div class="section">
            <div class="section-title">Professional Experience</div>
            ${content.experience.map((exp: any) => `
            <div class="item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${exp.position}</div>
                        <div class="item-subtitle">${exp.company}, ${exp.location}</div>
                    </div>
                    <div class="item-date">${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}</div>
                </div>
                ${exp.description ? `<div class="item-description">${formatText(exp.description)}</div>` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${content.skills && content.skills.length > 0 ? `
        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-grid">
                ${content.skills.map((skill: any) => `
                <div class="skill-item">
                    <span class="name">${skill.name}</span>
                    ${skill.level ? `<span class="level">(${skill.level})</span>` : ''}
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${latexCode ? `
        <div class="latex-section">
            <div class="latex-header">
                <svg style="width: 20px; height: 20px; color: #2563eb;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h3>LaTeX Source Code</h3>
            </div>
            <div class="latex-code">${latexCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <p class="latex-note">💡 This CV can be compiled with LaTeX. Copy the code above and use it with Overleaf or your local LaTeX compiler.</p>
        </div>
        ` : ''}
    </div>
</body>
</html>
  `;
  
  return html;
}
