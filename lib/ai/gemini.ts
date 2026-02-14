import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function for CV optimization with Gemini
export async function optimizeResumeContentGemini(
  resumeContent: string,
  jobDescription: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert career coach and resume writer. Your task is to analyze a job description and provide suggestions to optimize a resume to better match the position.

Job Description:
${jobDescription}

Current Resume Content:
${resumeContent}

Analyze the resume against the job description and provide optimization suggestions in JSON format with the following structure:
{
  "keywordMatches": {
    "matched": ["skill1", "skill2"],
    "missing": ["skill3", "skill4"]
  },
  "suggestions": [
    {
      "category": "experience|skills|keywords",
      "suggestion": "specific improvement",
      "reason": "why this matters"
    }
  ],
  "priorityScore": 1-10,
  "matchPercentage": 85
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    return text;
  } catch (error) {
    console.error('Gemini optimization error:', error);
    throw error;
  }
}

// Helper function for cover letter generation with Gemini
export async function generateCoverLetterGemini(
  resumeContent: string,
  jobListing: string,
  tone: 'professional' | 'friendly' | 'formal' = 'professional'
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const toneDescription = {
    professional: 'professional and corporate',
    friendly: 'warm and approachable',
    formal: 'formal and respect-focused',
  }[tone];

  const prompt = `You are an expert cover letter writer. Write a compelling, personalized cover letter that:
1. Highlights relevant experience from the resume
2. Addresses the specific job requirements
3. Demonstrates genuine interest and fit
4. Uses a ${toneDescription} tone
5. Is concise (250-350 words)

Job Listing:
${jobListing}

Resume:
${resumeContent}

Write only the cover letter content, without any additional commentary.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini cover letter generation error:', error);
    throw error;
  }
}

// Helper function for improving resume sections with Gemini
export async function improveResumeSectionGemini(
  sectionName: string,
  currentContent: string,
  context?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert resume writer. Improve the given resume section to be more professional, impactful, and achievement-focused. Use action verbs and quantify results where possible.

Section: ${sectionName}
Current Content:
${currentContent}
${context ? `\nAdditional Context:\n${context}` : ''}

Provide an improved version without any additional commentary.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini section improvement error:', error);
    throw error;
  }
}

// Helper function for AI-powered resume review with Gemini
export async function reviewResumeGemini(
  resumeContent: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a professional resume reviewer. Conduct a comprehensive review of the following resume and provide detailed feedback.

Resume:
${resumeContent}

Provide a JSON response with this structure:
{
  "overallScore": 1-10,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": [
    {
      "area": "formatting|content|structure",
      "recommendation": "specific advice",
      "impact": "how this will help"
    }
  ],
  "summary": "brief overall assessment"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    return text;
  } catch (error) {
    console.error('Gemini review error:', error);
    throw error;
  }
}

// Helper function for generating resume summary with Gemini
export async function generateResumeSummaryGemini(
  experienceHighlights: string,
  desiredPosition: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert resume writer. Write a compelling professional summary for a resume.

Desired Position: ${desiredPosition}
Key Experience Highlights:
${experienceHighlights}

Write a 2-3 sentence professional summary that:
1. Highlights key qualifications
2. Demonstrates relevance to the desired position
3. Is compelling and action-oriented

Provide only the summary text without additional commentary.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini summary generation error:', error);
    throw error;
  }
}
