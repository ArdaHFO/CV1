import type { ResumeContent, Experience, Education, Skill } from '@/types';

/**
 * Parse LaTeX code and extract CV content
 * This parser extracts basic information from LaTeX code.
 * It's designed to be robust and not fail on custom sections or syntax variations.
 */
export function parseLatexToContent(latexCode: string): Partial<ResumeContent> | null {
  try {
    const content: Partial<ResumeContent> = {
      personal_info: {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        linkedin: '',
        github: '',
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
    };

    // Extract name from header - handle various formats
    const namePatterns = [
      /\{\\LARGE\\bfseries\s+([^}]+)\}/,
      /\{\\Large\\bfseries\s+([^}]+)\}/,
      /\{\\large\\bfseries\s+([^}]+)\}/,
      /\\textbf\{\\LARGE\s+([^}]+)\}/,
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = latexCode.match(pattern);
      if (nameMatch) {
        const fullName = nameMatch[1].trim();
        const nameParts = fullName.split(/\s+/);
        if (nameParts.length > 0) {
          content.personal_info!.first_name = nameParts[0];
          content.personal_info!.last_name = nameParts.slice(1).join(' ');
        }
        break;
      }
    }

    // Extract contact info (email, phone, location)
    const contactLines = latexCode.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
    if (contactLines) {
      const contactText = contactLines[1];
      
      // Email
      const emailMatch = contactText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      if (emailMatch) content.personal_info!.email = emailMatch[1];
      
      // Phone (basic pattern)
      const phoneMatch = contactText.match(/(\+?\d[\d\s\-\(\)]{8,})/);
      if (phoneMatch) content.personal_info!.phone = phoneMatch[1].trim();
      
      // Website from href
      const websiteMatch = contactText.match(/\\href\{([^}]+)\}/);
      if (websiteMatch) content.personal_info!.website = websiteMatch[1];
    }

    // Extract location (appears after phone)
    const locationMatch = latexCode.match(/\\quad\s*\\quad\s*([^\\]+?)\\\\(?:\n|\\)/);
    if (locationMatch) {
      content.personal_info!.location = locationMatch[1].trim();
    }

    // Extract summary - handle various section names
    const summaryPatterns = [
      /\\section\*\{Summary\}\s*\n([\s\S]*?)(?=\\section|\\end\{document\})/,
      /\\section\*\{Profile\}\s*\n([\s\S]*?)(?=\\section|\\end\{document\})/,
      /\\section\*\{About\}\s*\n([\s\S]*?)(?=\\section|\\end\{document\})/,
      /\\section\*\{Objective\}\s*\n([\s\S]*?)(?=\\section|\\end\{document\})/,
    ];
    
    for (const pattern of summaryPatterns) {
      const summaryMatch = latexCode.match(pattern);
      if (summaryMatch) {
        content.summary = summaryMatch[1].trim();
        break;
      }
    }

    // Extract experience - handle various section names
    const experiencePatterns = [
      /\\section\*\{Professional Experience\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
      /\\section\*\{Work Experience\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
      /\\section\*\{Experience\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
      /\\section\*\{Employment\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
    ];
    
    for (const pattern of experiencePatterns) {
      const experienceSection = latexCode.match(pattern);
      if (experienceSection) {
        const expText = experienceSection[1];
        const experiences: Experience[] = [];
        
        // Match each experience entry - more flexible pattern
        const expRegex = /\\textbf\{([^}]+)\}\s*\\hfill\s*([^\\]+?)\\\\[\s\n]*\\textit\{([^}]+)\}(?:,\s*)?([^\\]*)/g;
        let expMatch;
        let id = 1;
        
        while ((expMatch = expRegex.exec(expText)) !== null) {
          const [, position, dates, company, location] = expMatch;
          const dateParts = dates.split('--').map(d => d.trim());
          const startDate = dateParts[0] || '';
          const endDate = dateParts[1] || '';
          
          experiences.push({
            id: String(id++),
            position: position.trim(),
            company: company.trim(),
            location: location?.trim() || '',
            start_date: startDate,
            end_date: endDate === 'Present' ? '' : endDate,
            is_current: endDate.trim() === 'Present',
            description: '',
            achievements: [],
          });
        }
        
        if (experiences.length > 0) {
          content.experience = experiences;
        }
        break;
      }
    }

    // Extract education - handle various section names
    const educationPatterns = [
      /\\section\*\{Education\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
      /\\section\*\{Academic Background\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
      /\\section\*\{Academic Qualifications\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
    ];
    
    for (const pattern of educationPatterns) {
      const educationSection = latexCode.match(pattern);
      if (educationSection) {
        const eduText = educationSection[1];
        const educations: Education[] = [];
        
        // Match each education entry - more flexible
        const eduRegex = /\\textbf\{([^}]+?)(?:\s+in\s+([^}]+))?\}\s*\\hfill\s*([^\\]+?)\\\\[\s\n]*\\textit\{([^}]+)\}(?:,\s*)?([^\\]*?)(?:\\quad GPA:\s*([^\n\\]+))?/g;
        let eduMatch;
        let id = 1;
        
        while ((eduMatch = eduRegex.exec(eduText)) !== null) {
          const [, degree, field, dates, institution, location, gpa] = eduMatch;
          const dateParts = dates.split('--').map(d => d.trim());
          const startDate = dateParts[0] || '';
          const endDate = dateParts[1] || '';
          
          educations.push({
            id: String(id++),
            degree: degree.trim(),
            field: field?.trim() || 'General Studies',
            institution: institution.trim(),
            location: location?.trim() || '',
            start_date: startDate,
            end_date: endDate === 'Present' ? '' : endDate,
            is_current: endDate.trim() === 'Present',
            gpa: gpa?.trim() || '',
          });
        }
        
        if (educations.length > 0) {
          content.education = educations;
        }
        break;
      }
    }

    // Extract skills - handle various section names
    const skillsPatterns = [
      /\\section\*\{Skills\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
      /\\section\*\{Technical Skills\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
      /\\section\*\{Competencies\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
      /\\section\*\{Expertise\}([\s\S]*?)(?=\\section\*\{|\\end\{document\})/,
    ];
    
    for (const pattern of skillsPatterns) {
      const skillsSection = latexCode.match(pattern);
      if (skillsSection) {
        const skillsText = skillsSection[1];
        const skills: Skill[] = [];
        
        // Match each skill from itemize - more flexible
        const skillRegex = /\\item\s*\\textbf\{([^}]+)\}(?:\s*\(([^)]+)\))?/g;
        let skillMatch;
        let id = 1;
        
        while ((skillMatch = skillRegex.exec(skillsText)) !== null) {
          const [, name, level] = skillMatch;
          const normalizedLevel = level?.trim().toLowerCase();
          const validLevel = ['beginner', 'intermediate', 'advanced', 'expert'].includes(normalizedLevel || '') 
            ? normalizedLevel as 'beginner' | 'intermediate' | 'advanced' | 'expert'
            : undefined;
          
          skills.push({
            id: String(id++),
            name: name.trim(),
            category: 'General',
            level: validLevel,
          });
        }
        
        if (skills.length > 0) {
          content.skills = skills;
        }
        break;
      }
    }

    return content;
  } catch (error) {
    console.error('Error parsing LaTeX:', error);
    // Return null to indicate parsing failed, but don't crash
    return null;
  }
}

/**
 * Validate LaTeX syntax (basic check)
 */
export function validateLatexSyntax(latexCode: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for balanced braces
  const openBraces = (latexCode.match(/\{/g) || []).length;
  const closeBraces = (latexCode.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
  }
  
  // Check for unclosed environments
  const beginEnv = (latexCode.match(/\\begin\{/g) || []).length;
  const endEnv = (latexCode.match(/\\end\{/g) || []).length;
  if (beginEnv !== endEnv) {
    errors.push(`Unbalanced environments: ${beginEnv} \\begin, ${endEnv} \\end`);
  }
  
  // Check for document structure
  if (!latexCode.includes('\\documentclass')) {
    errors.push('Missing \\documentclass declaration');
  }
  
  if (!latexCode.includes('\\begin{document}')) {
    errors.push('Missing \\begin{document}');
  }
  
  if (!latexCode.includes('\\end{document}')) {
    errors.push('Missing \\end{document}');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
