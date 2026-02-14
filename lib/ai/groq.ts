// lib/ai/groq.ts

if (!process.env.GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY environment variable');
}

// Helper function for CV optimization with Groq
export async function optimizeResumeContentGroq(
  resumeContent: string,
  jobDescription: string
): Promise<string> {
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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq optimization error:', error);
    throw error;
  }
}

// Helper function for cover letter generation with Groq
export async function generateCoverLetterGroq(
  resumeContent: string,
  jobListing: string,
  tone: 'professional' | 'friendly' | 'formal' = 'professional'
): Promise<string> {
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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq cover letter generation error:', error);
    throw error;
  }
}

// Helper function for improving resume sections with Groq
export async function improveResumeSectionGroq(
  sectionName: string,
  currentContent: string,
  context?: string
): Promise<string> {
  const prompt = `You are an expert resume writer. Improve the given resume section to be more professional, impactful, and achievement-focused. Use action verbs and quantify results where possible.

Section: ${sectionName}
Current Content:
${currentContent}
${context ? `\nAdditional Context:\n${context}` : ''}

Provide an improved version without any additional commentary.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq section improvement error:', error);
    throw error;
  }
}

// Helper function for AI-powered resume review with Groq
export async function reviewResumeGroq(
  resumeContent: string
): Promise<string> {
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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq review error:', error);
    throw error;
  }
}

// Helper function for extracting keywords from resume with Groq
export async function extractKeywordsGroq(
  resumeContent: string
): Promise<string> {
  const prompt = `You are an expert in CV analysis. Extract the most important keywords and skills from the following resume that would help in job search and ATS (Applicant Tracking System) optimization.

Resume:
${resumeContent}

Provide a JSON response with this structure:
{
  "technicalSkills": ["skill1", "skill2", "skill3"],
  "softSkills": ["skill1", "skill2"],
  "industries": ["industry1", "industry2"],
  "jobTitles": ["title1", "title2"],
  "tools": ["tool1", "tool2"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "Brief description of the candidate's expertise"
}

Make sure the keywords are specific and relevant to the job market.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq keyword extraction error:', error);
    throw error;
  }
}
