import { NextRequest, NextResponse } from 'next/server';
import type { ResumeContent, CVOptimizationResult, CVOptimizationSuggestion } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, jobRequirements, jobSkills, cvContent } = await request.json();

    if (!jobDescription || !cvContent) {
      return NextResponse.json(
        { success: false, error: 'Job description and CV content are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    const resumeContent = cvContent as ResumeContent;
    const usesPlaceholderKey =
      !apiKey ||
      apiKey.toLowerCase().includes('your_groq_api_key') ||
      apiKey.toLowerCase().includes('your_groq') ||
      apiKey.toLowerCase().includes('replace_me');

    // Check if Groq (Llama) is configured
    if (usesPlaceholderKey) {
      return NextResponse.json({
        success: true,
        result: generateMockOptimization(jobSkills, resumeContent),
        fallback: true,
        message: 'Using fallback optimization because Llama (Groq) API key is missing or invalid.',
      });
    }

    // Prepare CV summary for AI
    const cvSummary = {
      summary: resumeContent.summary || '',
      experience: resumeContent.experience.map((exp) => ({
        position: exp.position,
        company: exp.company,
        description: exp.description,
      })),
      skills: resumeContent.skills.map((s) => s.name),
      education: resumeContent.education.map((edu) => ({
        degree: edu.degree,
        field: edu.field,
        institution: edu.institution,
      })),
    };

    const prompt = `You are an expert CV optimization assistant. Analyze the following job posting and CV, then provide specific suggestions to optimize the CV for this job.

Job Description:
${jobDescription}

Job Requirements:
${jobRequirements?.join('\n') || 'N/A'}

Required Skills:
${jobSkills?.join(', ') || 'N/A'}

Current CV:
${JSON.stringify(cvSummary, null, 2)}

Provide a JSON response with:
1. job_match_score: A score from 0-100 indicating how well the CV matches the job
2. suggestions: Array of specific CV improvement suggestions with section, suggested text, reason, and priority
3. missing_skills: Skills mentioned in the job that are missing from the CV
4. matching_skills: Skills from the CV that match the job requirements
5. recommended_changes: High-level recommendations

Format your response as valid JSON.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert CV optimization assistant. Provide specific, actionable suggestions to improve CVs for job applications. Always respond with valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const providerError: any = {
          status: response.status,
          code: payload?.error?.code,
          type: payload?.error?.type,
          message: payload?.error?.message,
        };
        throw providerError;
      }

      const rawContent = payload?.choices?.[0]?.message?.content || '{}';
      const parsedResult = parseOptimizationResult(rawContent);

      return NextResponse.json({
        success: true,
        result: parsedResult,
        model: 'groq-llama-3.3-70b-versatile',
      });
    } catch (providerError: any) {
      console.error('Llama provider error, using fallback optimization:', providerError);
      const invalidKey =
        providerError?.status === 401 ||
        providerError?.code === 'invalid_api_key' ||
        providerError?.type === 'invalid_request_error';

      return NextResponse.json({
        success: true,
        result: generateMockOptimization(jobSkills, resumeContent),
        fallback: true,
        message: invalidKey
          ? 'Invalid Llama (Groq) API key. Using fallback optimization.'
          : 'Llama provider unavailable. Using fallback optimization.',
      });
    }
  } catch (error) {
    console.error('CV optimization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to optimize CV' },
      { status: 500 }
    );
  }
}

function parseOptimizationResult(rawContent: string): CVOptimizationResult {
  try {
    const direct = JSON.parse(rawContent);
    return normalizeOptimizationResult(direct);
  } catch {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return normalizeOptimizationResult(extracted);
    }
    throw new Error('Unable to parse Llama optimization response as JSON');
  }
}

function normalizeOptimizationResult(input: any): CVOptimizationResult {
  return {
    job_match_score: Number(input?.job_match_score ?? input?.matchPercentage ?? 0),
    suggestions: Array.isArray(input?.suggestions)
      ? input.suggestions.map((suggestion: any) => ({
          section: mapSuggestionSection(suggestion?.section || suggestion?.category),
          current: suggestion?.current,
          suggested: String(suggestion?.suggested || suggestion?.suggestion || ''),
          reason: String(suggestion?.reason || 'AI suggestion'),
          priority: mapSuggestionPriority(suggestion?.priority || suggestion?.priorityScore),
        }))
      : [],
    missing_skills: Array.isArray(input?.missing_skills)
      ? input.missing_skills.map(String)
      : Array.isArray(input?.keywordMatches?.missing)
      ? input.keywordMatches.missing.map(String)
      : [],
    matching_skills: Array.isArray(input?.matching_skills)
      ? input.matching_skills.map(String)
      : Array.isArray(input?.keywordMatches?.matched)
      ? input.keywordMatches.matched.map(String)
      : [],
    recommended_changes: Array.isArray(input?.recommended_changes)
      ? input.recommended_changes.map(String)
      : [],
  };
}

function mapSuggestionSection(value: any): CVOptimizationSuggestion['section'] {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('skill')) return 'skills';
  if (normalized.includes('education')) return 'education';
  if (normalized.includes('experience')) return 'experience';
  return 'summary';
}

function mapSuggestionPriority(value: any): CVOptimizationSuggestion['priority'] {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('high') || normalized === '8' || normalized === '9' || normalized === '10') {
    return 'high';
  }
  if (normalized.includes('low') || normalized === '1' || normalized === '2' || normalized === '3') {
    return 'low';
  }
  return 'medium';
}

// Mock optimization for when OpenAI is not configured
function generateMockOptimization(
  jobSkills: string[] = [],
  cvContent: ResumeContent
): CVOptimizationResult {
  const cvSkills = cvContent.skills.map((s) => s.name);
  const matchingSkills = cvSkills.filter((skill) =>
    jobSkills.some((jobSkill) => jobSkill.toLowerCase().includes(skill.toLowerCase()))
  );
  const missingSkills = jobSkills.filter(
    (jobSkill) =>
      !cvSkills.some((skill) => jobSkill.toLowerCase().includes(skill.toLowerCase()))
  );

  const suggestions: CVOptimizationSuggestion[] = [];

  if (missingSkills.length > 0) {
    suggestions.push({
      section: 'skills',
      suggested: `Add these relevant skills: ${missingSkills.slice(0, 3).join(', ')}`,
      reason: 'These skills are mentioned in the job requirements but missing from your CV',
      priority: 'high',
    });
  }

  if (!cvContent.summary || cvContent.summary.length < 50) {
    suggestions.push({
      section: 'summary',
      current: cvContent.summary || '',
      suggested:
        'Add a compelling professional summary that highlights your experience with the key technologies mentioned in the job posting',
      reason: 'A strong summary immediately shows hiring managers you are a good fit',
      priority: 'high',
    });
  }

  if (cvContent.experience.length > 0) {
    suggestions.push({
      section: 'experience',
      suggested:
        'Emphasize achievements and responsibilities that align with the job requirements. Use metrics and specific examples.',
      reason: 'Tailoring your experience to match job requirements increases relevance',
      priority: 'medium',
    });
  }

  const matchScore = Math.min(
    100,
    Math.round((matchingSkills.length / Math.max(jobSkills.length, 1)) * 70 + 30)
  );

  return {
    job_match_score: matchScore,
    suggestions,
    missing_skills: missingSkills,
    matching_skills: matchingSkills,
    recommended_changes: [
      'Tailor your professional summary to emphasize relevant experience',
      'Add or highlight skills that match the job requirements',
      'Quantify your achievements with specific metrics',
      'Use keywords from the job description throughout your CV',
    ],
  };
}
