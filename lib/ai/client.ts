/**
 * Gemini AI Client
 * Helper functions for calling Gemini AI features from the frontend
 */

export type AIAction = 
  | 'optimize'
  | 'cover-letter'
  | 'improve-section'
  | 'review'
  | 'generate-summary';

interface AIRequest {
  action: AIAction;
  [key: string]: any;
}

interface AIResponse {
  success: boolean;
  action: AIAction;
  result?: string;
  error?: string;
  details?: string;
  model?: string;
}

/**
 * Call Gemini AI service
 */
export async function callAI(request: AIRequest): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
}

/**
 * Optimize resume for a job description
 */
export async function optimizeResumeForJob(
  resumeContent: any,
  jobDescription: string
): Promise<string> {
  const response = await callAI({
    action: 'optimize',
    resumeContent,
    jobDescription,
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to optimize resume');
  }

  return response.result || '';
}

/**
 * Generate a cover letter
 */
export async function generateCoverLetter(
  resumeContent: any,
  jobListing: string,
  tone: 'professional' | 'friendly' | 'formal' = 'professional'
): Promise<string> {
  const response = await callAI({
    action: 'cover-letter',
    resumeContent,
    jobListing,
    tone,
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to generate cover letter');
  }

  return response.result || '';
}

/**
 * Improve a resume section
 */
export async function improveSection(
  sectionName: string,
  content: string,
  context?: string
): Promise<string> {
  const response = await callAI({
    action: 'improve-section',
    sectionName,
    content,
    context,
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to improve section');
  }

  return response.result || '';
}

/**
 * Review a resume
 */
export async function reviewResume(resumeContent: any): Promise<string> {
  const response = await callAI({
    action: 'review',
    resumeContent,
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to review resume');
  }

  return response.result || '';
}

/**
 * Generate a professional summary
 */
export async function generateSummary(
  experienceHighlights: string,
  desiredPosition: string
): Promise<string> {
  const response = await callAI({
    action: 'generate-summary',
    experienceHighlights,
    desiredPosition,
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to generate summary');
  }

  return response.result || '';
}
