import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server-user';
import { createResume } from '@/lib/database/resumes';
import type { ResumeContent } from '@/types';

// Helper to extract text from PDF/DOCX using AI
async function parseCVWithAI(fileBuffer: Buffer, fileName: string): Promise<ResumeContent> {
  // Convert buffer to base64 for AI processing
  const base64 = fileBuffer.toString('base64');
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  const prompt = `You are an expert CV parser. Extract all information from this ${fileExtension?.toUpperCase()} file and return it in JSON format.

Extract:
- Personal info (first_name, last_name, email, phone, location, website, linkedin, github)
- Summary (professional summary/objective)
- Work experience (company, position, location, dates, description, achievements)
- Education (institution, degree, field, location, dates, gpa)
- Skills (categorized: Technical, Soft Skills, Languages, etc.)
- Any other sections (certifications, projects, publications, awards, etc. as custom sections)

Return ONLY valid JSON matching this TypeScript interface:
{
  "personal_info": {
    "first_name": string,
    "last_name": string,
    "email": string,
    "phone"?: string,
    "location"?: string,
    "website"?: string,
    "linkedin"?: string,
    "github"?: string
  },
  "summary"?: string,
  "experience": [
    {
      "id": string,
      "company": string,
      "position": string,
      "location"?: string,
      "start_date": string,
      "end_date"?: string,
      "is_current": boolean,
      "description": string,
      "achievements"?: string[]
    }
  ],
  "education": [
    {
      "id": string,
      "institution": string,
      "degree": string,
      "field": string,
      "location"?: string,
      "start_date": string,
      "end_date"?: string,
      "is_current": boolean,
      "gpa"?: string
    }
  ],
  "skills": [
    {
      "id": string,
      "name": string,
      "category": string,
      "level"?: "beginner" | "intermediate" | "advanced" | "expert"
    }
  ],
  "custom_sections"?: [
    {
      "id": string,
      "title": string,
      "content": string,
      "order": number
    }
  ]
}

File content (base64): ${base64.substring(0, 10000)}...`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a professional CV parser. Extract information accurately and return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error('AI parsing failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    // Extract JSON from response (might be wrapped in ```json ```)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const parsed = JSON.parse(jsonStr) as ResumeContent;

    // Ensure required fields exist
    if (!parsed.personal_info || !parsed.personal_info.first_name || !parsed.personal_info.last_name) {
      throw new Error('Failed to extract personal information');
    }

    // Generate IDs if missing
    if (!parsed.experience) parsed.experience = [];
    parsed.experience = parsed.experience.map((exp, idx) => ({
      ...exp,
      id: exp.id || `exp-${Date.now()}-${idx}`,
    }));

    if (!parsed.education) parsed.education = [];
    parsed.education = parsed.education.map((edu, idx) => ({
      ...edu,
      id: edu.id || `edu-${Date.now()}-${idx}`,
    }));

    if (!parsed.skills) parsed.skills = [];
    parsed.skills = parsed.skills.map((skill, idx) => ({
      ...skill,
      id: skill.id || `skill-${Date.now()}-${idx}`,
    }));

    if (parsed.custom_sections) {
      parsed.custom_sections = parsed.custom_sections.map((section, idx) => ({
        ...section,
        id: section.id || `custom-${Date.now()}-${idx}`,
        order: section.order || idx + 1,
      }));
    }

    return parsed;
  } catch (error) {
    console.error('AI parsing error:', error);
    throw new Error('Failed to parse CV with AI');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse CV with AI
    const content = await parseCVWithAI(buffer, file.name);

    // Create resume with parsed content
    const title = `Imported CV - ${content.personal_info.first_name} ${content.personal_info.last_name}`;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const resume = await createResume(userId, title, slug);

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Failed to create resume' },
        { status: 500 }
      );
    }

    // Store parsed content in localStorage (will be loaded by editor)
    // Note: We can't set localStorage from server, client will receive the content
    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      content: content,
      message: 'CV uploaded and parsed successfully',
    });
  } catch (error) {
    console.error('CV upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload CV',
      },
      { status: 500 }
    );
  }
}
