import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server-user';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { consumeUsage } from '@/lib/database/billing';
import type { ResumeContent } from '@/types';

export const runtime = 'nodejs';

// Use the internal lib directly to avoid pdf-parse's canvas/DOMMatrix polyfill shim
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer, options?: Record<string, unknown>) => Promise<{ text: string }>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth') as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> };

// Helper function to create empty resume template
function createEmptyResumeContent(fileName: string): ResumeContent {
  return {
    personal_info: {
      first_name: 'Your',
      last_name: 'Name',
      email: 'your.email@example.com',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
    },
    summary: 'Edit your professional summary here. Your CV was imported successfully. Please fill in your information manually.',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    publications: [],
    custom_sections: [],
  };
}

async function extractTextFromFile(fileBuffer: Buffer, fileExtension: string): Promise<string> {
  if (fileExtension === 'pdf') {
    const parsed = await pdfParse(fileBuffer);
    return parsed.text || '';
  }

  if (fileExtension === 'docx' || fileExtension === 'doc') {
    const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
    return parsed.value || '';
  }

  return '';
}

function normalizeResumeContent(input: Partial<ResumeContent>, fileName: string): ResumeContent {
  const base = createEmptyResumeContent(fileName);

  const safeArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

  // Normalize skills: AI may return strings or partial objects missing id/category
  const normalizeSkills = (raw: unknown): import('@/types').Skill[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map((s: unknown, idx: number) => {
      if (typeof s === 'string') {
        return { id: `skill-${idx}`, name: s, category: 'Technical', level: 'intermediate' as const };
      }
      const obj = s as Record<string, unknown>;
      const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
      const level = validLevels.includes(obj.level as typeof validLevels[number])
        ? (obj.level as typeof validLevels[number])
        : 'intermediate' as const;
      return {
        id: String(obj.id || `skill-${idx}`),
        name: String(obj.name || ''),
        category: String(obj.category || 'Technical'),
        level,
      };
    });
  };

  return {
    ...base,
    ...input,
    personal_info: {
      ...base.personal_info,
      ...(input.personal_info || {}),
    },
    experience: safeArray(input.experience),
    education: safeArray(input.education),
    skills: normalizeSkills(input.skills),
    languages: safeArray(input.languages),
    certifications: safeArray(input.certifications),
    projects: safeArray(input.projects),
    publications: safeArray(input.publications),
    custom_sections: safeArray(input.custom_sections),
  };
}

function extractJsonPayload(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1).trim();
  }

  return raw.trim();
}

async function parseCVWithAI(
  fileBuffer: Buffer,
  fileName: string,
  fileExtension: string
): Promise<ResumeContent> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not found, returning empty template');
    return createEmptyResumeContent(fileName);
  }

  try {
    const text = await extractTextFromFile(fileBuffer, fileExtension);

    if (!text.trim()) {
      return createEmptyResumeContent(fileName);
    }

    const prompt = `Extract resume data from the text below and return ONLY valid JSON that matches this schema:\n\n{
  "personal_info": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "experience": [
    {"company": "", "position": "", "start_date": "", "end_date": "", "description": ""}
  ],
  "education": [
    {"institution": "", "degree": "", "start_date": "", "end_date": "", "description": ""}
  ],
  "skills": [
    {"name": "", "level": ""}
  ],
  "languages": [],
  "certifications": [],
  "projects": [],
  "publications": [],
  "custom_sections": []
}\n\nResume text:\n${text}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Return only JSON. No markdown or commentary.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
    }

    const raw = data.choices?.[0]?.message?.content || '';
    const jsonPayload = extractJsonPayload(raw);
    const parsed = JSON.parse(jsonPayload) as Partial<ResumeContent>;

    return normalizeResumeContent(parsed, fileName);
  } catch (error) {
    console.error('AI parsing error:', error);
    return createEmptyResumeContent(fileName);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase is not configured' },
        { status: 500 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const email = user.email ?? `user-${user.id}@placeholder.local`;
      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        null;
      const avatarUrl =
        (user.user_metadata?.avatar_url as string | undefined) ||
        (user.user_metadata?.picture as string | undefined) ||
        null;

      await (supabaseAdmin as any)
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email,
            full_name: fullName,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check CV import billing quota before processing
    // Wrapped in try-catch: if billing DB is unavailable (e.g. migration not yet run),
    // we allow the import rather than blocking the user.
    try {
      const billingResult = await consumeUsage(userId, 'cv-import');
      if (!billingResult.allowed) {
        return NextResponse.json(
          { success: false, error: billingResult.message, code: 'import_limit_reached' },
          { status: 403 }
        );
      }
    } catch (billingError) {
      console.error('[CV_UPLOAD] Billing check failed, allowing import:', billingError);
      // Fall through – never block a user due to a billing system error
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['pdf', 'docx', 'doc'].includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload PDF or DOCX.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse CV (currently returns template)
    const content = await parseCVWithAI(buffer, file.name, fileExtension);

    // Create resume with parsed content
    const title = `Imported CV - ${file.name.replace(/\.[^/.]+$/, '')}`;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data: resume, error: resumeError } = await (supabaseAdmin as any)
      .from('resumes')
      .insert({
        user_id: userId,
        title,
        slug,
        is_default: false,
        view_count: 0,
      })
      .select()
      .single();

    if (resumeError || !resume) {
      return NextResponse.json(
        { success: false, error: 'Failed to create resume' },
        { status: 500 }
      );
    }

    const { error: versionError } = await (supabaseAdmin as any)
      .from('resume_versions')
      .insert({
        resume_id: resume.id,
        version_number: 1,
        template_type: 'modern',
        is_active: true,
        content,
      });

    if (versionError) {
      console.error('Failed to create resume version:', versionError);
    }

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      content: content,
      message: 'CV uploaded successfully. Please review and edit your information.',
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
