import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server-user';
import { createResume } from '@/lib/database/resumes';
import type { ResumeContent } from '@/types';

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

// Helper to extract text from PDF/DOCX using AI
async function parseCVWithAI(fileBuffer: Buffer, fileName: string): Promise<ResumeContent> {
  // Check if GROQ API key is available
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not found, returning empty template');
    return createEmptyResumeContent(fileName);
  }

  try {
    // For now, return empty template since we need PDF/DOCX parsing libraries
    // TODO: Install pdf-parse and mammoth for actual file parsing
    console.log('AI parsing not fully implemented yet, returning template');
    return createEmptyResumeContent(fileName);
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
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
    const content = await parseCVWithAI(buffer, file.name);

    // Create resume with parsed content
    const title = `Imported CV - ${file.name.replace(/\.[^/.]+$/, '')}`;
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

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      content: content,
      message: 'CV uploaded successfully. Please fill in your information in the editor.',
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
