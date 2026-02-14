/**
 * Simple LaTeX to HTML renderer for preview purposes
 * This is NOT a full LaTeX compiler, just a basic visual preview
 */

export function renderLatexToHTML(latexCode: string): string {
  let html = latexCode;

  // Remove LaTeX preamble (documentclass, usepackage, etc.)
  html = html.replace(/\\documentclass\[.*?\]\{.*?\}/g, '');
  html = html.replace(/\\usepackage(\[.*?\])?\{.*?\}/g, '');
  html = html.replace(/\\title(format|spacing)\{.*?\}(\[.*?\])?/g, '');
  html = html.replace(/\\begin\{document\}/g, '');
  html = html.replace(/\\end\{document\}/g, '');
  html = html.replace(/% .*$/gm, ''); // Remove comments

  // Center environment
  html = html.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div style="text-align: center; margin-bottom: 1.5rem;">$1</div>');

  // Sections
  html = html.replace(/\\section\*\{([^}]+)\}/g, '<h2 style="font-size: 1.125rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem;">$1</h2>');
  html = html.replace(/\\subsection\*\{([^}]+)\}/g, '<h3 style="font-size: 1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">$1</h3>');

  // Text formatting
  html = html.replace(/\{\\LARGE\\bfseries\s+([^}]+)\}/g, '<h1 style="font-size: 1.875rem; font-weight: bold; margin-bottom: 0.25rem;">$1</h1>');
  html = html.replace(/\{\\Large\\bfseries\s+([^}]+)\}/g, '<h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;">$1</h1>');
  html = html.replace(/\{\\large\\bfseries\s+([^}]+)\}/g, '<h2 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">$1</h2>');
  html = html.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
  html = html.replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>');

  // Links
  html = html.replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a href="$1" style="color: #2563eb; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$2</a>');
  html = html.replace(/\\url\{([^}]+)\}/g, '<a href="$1" style="color: #2563eb; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>');

  // Itemize/enumerate
  html = html.replace(/\\begin\{itemize\}(\[.*?\])?([\s\S]*?)\\end\{itemize\}/g, (match, opts, content) => {
    const items = content.split('\\item').filter((item: string) => item.trim());
    const itemsHtml = items.map((item: string) => `<li style="margin-bottom: 0.25rem;">${item.trim()}</li>`).join('');
    return `<ul style="list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem;">${itemsHtml}</ul>`;
  });

  html = html.replace(/\\begin\{enumerate\}(\[.*?\])?([\s\S]*?)\\end\{enumerate\}/g, (match, opts, content) => {
    const items = content.split('\\item').filter((item: string) => item.trim());
    const itemsHtml = items.map((item: string) => `<li style="margin-bottom: 0.25rem;">${item.trim()}</li>`).join('');
    return `<ol style="list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem;">${itemsHtml}</ol>`;
  });

  // Description lists
  html = html.replace(/\\begin\{description\}([\s\S]*?)\\end\{description\}/g, (match, content) => {
    const items = content.split('\\item').filter((item: string) => item.trim());
    const itemsHtml = items.map((item: string) => {
      const trimmed = item.trim();
      const labelMatch = trimmed.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
      if (labelMatch) {
        return `<dt style="font-weight: 600; margin-top: 0.5rem;">${labelMatch[1]}</dt><dd style="margin-left: 1.5rem; margin-bottom: 0.25rem;">${labelMatch[2]}</dd>`;
      }
      return `<dd style="margin-left: 1.5rem; margin-bottom: 0.25rem;">${trimmed}</dd>`;
    }).join('');
    return `<dl style="margin-bottom: 1rem;">${itemsHtml}</dl>`;
  });

  // Line breaks
  html = html.replace(/\\\\\s*\[.*?\]/g, '<br style="margin-bottom: 0.5rem;">');
  html = html.replace(/\\\\/g, '<br>');

  // Spacing commands
  html = html.replace(/\\quad/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  html = html.replace(/\\qquad/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
  
  // Handle \hfill with better styling - convert to flex container
  html = html.replace(/([^<>\n]+)\\hfill\s*([^<>\n]+)/g, '<div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;"><span>$1</span><span style="text-align: right;">$2</span></div>');
  
  html = html.replace(/\\vspace\{.*?\}/g, '<div style="margin: 1rem 0;"></div>');

  // Special characters
  html = html.replace(/\\&/g, '&amp;');
  html = html.replace(/\\%/g, '%');
  html = html.replace(/\\_/g, '_');
  html = html.replace(/\\#/g, '#');
  html = html.replace(/\\\$/g, '$');

  // Clean up extra whitespace and newlines
  html = html.replace(/\n\s*\n/g, '<br>');
  html = html.replace(/^\s+|\s+$/g, '');

  return html;
}

/**
 * Component to render LaTeX preview
 */
export function LatexPreview({ latexCode }: { latexCode: string }) {
  const htmlContent = renderLatexToHTML(latexCode);

  return (
    <div 
      className="latex-preview text-sm text-zinc-800 leading-relaxed space-y-4"
      style={{ fontFamily: 'Georgia, serif' }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
