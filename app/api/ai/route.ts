import { NextRequest, NextResponse } from 'next/server';
import {
  optimizeResumeContentGroq,
  generateCoverLetterGroq,
  improveResumeSectionGroq,
  reviewResumeGroq,
  extractKeywordsGroq,
} from '@/lib/ai/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    let result: string;

    switch (action) {
      case 'optimize':
        if (!params.resumeContent || !params.jobDescription) {
          return NextResponse.json(
            { error: 'resumeContent and jobDescription are required for optimize action' },
            { status: 400 }
          );
        }
        result = await optimizeResumeContentGroq(
          JSON.stringify(params.resumeContent, null, 2),
          JSON.stringify(params.jobDescription, null, 2)
        );
        break;

      case 'cover-letter':
        if (!params.resumeContent || !params.jobListing) {
          return NextResponse.json(
            { error: 'resumeContent and jobListing are required for cover-letter action' },
            { status: 400 }
          );
        }
        result = await generateCoverLetterGroq(
          JSON.stringify(params.resumeContent, null, 2),
          JSON.stringify(params.jobListing, null, 2),
          params.tone || 'professional'
        );
        break;

      case 'improve-section':
        if (!params.sectionName || !params.content) {
          return NextResponse.json(
            { error: 'sectionName and content are required for improve-section action' },
            { status: 400 }
          );
        }
        result = await improveResumeSectionGroq(
          params.sectionName,
          params.content,
          params.context
        );
        break;

      case 'review':
        if (!params.resumeContent) {
          return NextResponse.json(
            { error: 'resumeContent is required for review action' },
            { status: 400 }
          );
        }
        result = await reviewResumeGroq(JSON.stringify(params.resumeContent, null, 2));
        break;

      case 'extract-keywords':
        if (!params.resumeContent) {
          return NextResponse.json(
            { error: 'resumeContent is required for extract-keywords action' },
            { status: 400 }
          );
        }
        result = await extractKeywordsGroq(
          JSON.stringify(params.resumeContent, null, 2)
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      model: 'groq-llama-3.3-70b-versatile',
    });
  } catch (error) {
    console.error('AI service error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI service error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
