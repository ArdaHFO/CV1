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

    const prompt = `You are a world-class ATS (Applicant Tracking System) expert and professional CV writer. Deeply analyze the job posting and the candidate's CV below, then produce highly specific, actionable optimization suggestions. Your analysis must be genuine—do not produce generic advice.

=== JOB POSTING ===
${jobDescription}

Additional Requirements:
${jobRequirements?.join('\n') || 'N/A'}

Required/Mentioned Skills:
${jobSkills?.join(', ') || 'N/A'}

=== CANDIDATE CV ===
${JSON.stringify(cvSummary, null, 2)}

=== YOUR TASK ===

1. READ the job posting carefully. Identify:
   - The exact job title and seniority level
   - Must-have technical skills and tools
   - Soft skills emphasized
   - Key responsibilities the role involves
   - Industry-specific terminology and keywords used

2. COMPARE the CV against each requirement above. Look at every section: summary, each experience entry, skills list, education.

3. Return a JSON object with these EXACT fields:

{
  "job_match_score": <integer 0-100, calculated as: (matched_keywords / total_required_keywords) * 60 + experience_relevance_bonus(0-25) + structure_bonus(0-15)>,
  "match_breakdown": {
    "keywords": <0-100, what % of job keywords appear in the CV>,
    "experience": <0-100, how relevant is the experience level and domain>,
    "skills": <0-100, how well do skills match>,
    "summary": <0-100, does the summary speak to this specific role>
  },
  "suggestions": [
    {
      "section": "<one of: summary | experience | skills | education>",
      "experience_index": <for experience section: 0-based index of which job entry to modify, or null for skills/summary>,
      "current": "<the exact current text from that section, or empty string if it needs to be added>",
      "suggested": "<the FULL improved replacement text—not a vague tip, but the actual new text to use>",
      "reason": "<one specific sentence: why THIS change improves match with THIS job posting>",
      "priority": "<high | medium | low>",
      "impact": "<ATS | Readability | Relevance>"
    }
  ],
  "missing_skills": ["<skill name present in job but absent from CV>"],
  "matching_skills": ["<skill name present in BOTH job and CV>"],
  "recommended_changes": ["<high-level strategic suggestion as one sentence>"],
  "job_title_detected": "<job title as inferred from the posting>",
  "top_keywords": ["<5-10 most critical keywords from the job posting that must appear in the CV>"]
}

RULES:
- suggestions.suggested must be the ACTUAL FULL TEXT to put in the CV, not a description of what to do.
- For summary section: write a complete 3-4 sentence professional summary paragraph, incorporating the job title, key required skills, years of experience, and value proposition tailored to this exact role.
- For experience section: rewrite the COMPLETE description text for that job entry. Integrate 3-5 keywords from the job posting naturally. Use strong action verbs. Keep the candidate's real achievements but reframe them to align with the job requirements. The result must read as a real CV bullet/paragraph, NOT as a tip or instruction.
- For skills section, the "suggested" field is the skill name only (e.g. "Kubernetes").
- Do NOT suggest adding skills the candidate clearly does not have based on their CV—only rephrase or emphasize existing knowledge.
- missing_skills should only list skills explicitly required by the posting that are truly absent.
- Provide 5-8 suggestions. Cover summary, 2-3 experience entries, and skills. Focus on highest impact changes.
- Each suggestion must be self-contained and immediately usable — paste it directly into the CV with zero editing needed.
- Respond ONLY with the JSON object. No markdown, no prose, no code fences.`;

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
          max_tokens: 4000,
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
    match_breakdown: input?.match_breakdown
      ? {
          keywords: Number(input.match_breakdown.keywords ?? 0),
          experience: Number(input.match_breakdown.experience ?? 0),
          skills: Number(input.match_breakdown.skills ?? 0),
          summary: Number(input.match_breakdown.summary ?? 0),
        }
      : undefined,
    suggestions: Array.isArray(input?.suggestions)
      ? input.suggestions.map((suggestion: any) => ({
          section: mapSuggestionSection(suggestion?.section || suggestion?.category),
          experience_index:
            suggestion?.experience_index != null ? Number(suggestion.experience_index) : null,
          current: suggestion?.current,
          suggested: String(suggestion?.suggested || suggestion?.suggestion || ''),
          reason: String(suggestion?.reason || 'AI suggestion'),
          priority: mapSuggestionPriority(suggestion?.priority || suggestion?.priorityScore),
          impact: mapImpact(suggestion?.impact),
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
    job_title_detected: input?.job_title_detected ? String(input.job_title_detected) : undefined,
    top_keywords: Array.isArray(input?.top_keywords)
      ? input.top_keywords.map(String)
      : undefined,
  };
}

function mapImpact(value: any): CVOptimizationSuggestion['impact'] {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('ats')) return 'ATS';
  if (normalized.includes('read')) return 'Readability';
  if (normalized.includes('relev')) return 'Relevance';
  return 'Relevance';
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
