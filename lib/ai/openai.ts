import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function for CV optimization
export async function optimizeResumeContent(
  resumeContent: string,
  jobDescription: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert career coach and resume writer. Your task is to analyze a job description and provide suggestions to optimize a resume to better match the position. Focus on:
1. Identifying key skills and requirements from the job description
2. Suggesting keyword improvements
3. Recommending experience highlights
4. Maintaining authenticity while maximizing relevance`,
      },
      {
        role: 'user',
        content: `Job Description:\n${jobDescription}\n\nCurrent Resume Content:\n${resumeContent}\n\nProvide optimization suggestions in JSON format.`,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  return response.choices[0].message.content || '{}';
}

// Helper function for cover letter generation
export async function generateCoverLetter(
  resumeContent: string,
  jobListing: string,
  tone: 'professional' | 'friendly' | 'formal' = 'professional'
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert cover letter writer. Write compelling, personalized cover letters that:
1. Highlight relevant experience from the resume
2. Address the specific job requirements
3. Demonstrate genuine interest and fit
4. Use a ${tone} tone
5. Keep it concise (250-350 words)`,
      },
      {
        role: 'user',
        content: `Job Listing:\n${jobListing}\n\nResume:\n${resumeContent}\n\nWrite a cover letter.`,
      },
    ],
    temperature: 0.8,
  });

  return response.choices[0].message.content || '';
}

// Helper function for improving resume sections
export async function improveResumeSection(
  sectionName: string,
  currentContent: string,
  context?: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert resume writer. Improve the given resume section to be more professional, impactful, and achievement-focused. Use action verbs and quantify results where possible.`,
      },
      {
        role: 'user',
        content: `Section: ${sectionName}\nCurrent Content:\n${currentContent}${
          context ? `\n\nAdditional Context:\n${context}` : ''
        }\n\nProvide an improved version.`,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || currentContent;
}
