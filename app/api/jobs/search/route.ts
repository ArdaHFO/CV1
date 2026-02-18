import { NextRequest, NextResponse } from 'next/server';
import type { Job, JobSearchParams } from '@/types';

// Apify API configuration
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = 'curious_coder~linkedin-jobs-scraper';
const WORKDAY_APIFY_TOKEN = process.env.APIFY_WORKDAY_TOKEN;
const WORKDAY_ACTOR_ID = 'jobo.world~workday-jobs-search';
const CAREERONE_APIFY_TOKEN = process.env.APIFY_CAREERONE_TOKEN;
const CAREERONE_ACTOR_ID = 'websift~careerone-job-scraper';

// Function to call Apify LinkedIn Jobs Scraper
async function searchLinkedInJobs(
  keywords: string,
  location: string,
  employmentType: string,
  experienceLevel: string,
  datePosted: string,
  remoteOnly: boolean,
  limit: number | null
): Promise<Job[]> {
  if (!APIFY_API_TOKEN) {
    console.log('Apify API token not configured, using mock data');
    return [];
  }

  try {
    // Step 1: Build LinkedIn job search URL
    const searchQuery = keywords || 'developer';
    const searchLocation = remoteOnly ? 'Remote' : (location || '');
    
    // Construct LinkedIn job search URL with all filters
    const params = new URLSearchParams();
    params.append('keywords', searchQuery);
    if (searchLocation) {
      params.append('location', searchLocation);
    }
    
    // Job Type Filter
    if (employmentType && employmentType !== 'all') {
      // LinkedIn job type filters: F for full-time, P for part-time, C for contract, I for internship
      const jobTypeMap: Record<string, string> = {
        'full-time': 'F',
        'part-time': 'P',
        'contract': 'C',
        'internship': 'I',
      };
      const jobTypeCode = jobTypeMap[employmentType];
      if (jobTypeCode) {
        params.append('f_JT', jobTypeCode);
      }
    }
    
    // Experience Level Filter
    if (experienceLevel && experienceLevel !== 'all') {
      // LinkedIn experience filters: 1=Internship, 2=Entry, 3=Associate, 4=Mid-Senior, 5=Director, 6=Executive
      const expLevelMap: Record<string, string> = {
        'entry': '2',
        'mid': '3,4',
        'senior': '4,5',
        'lead': '5,6',
      };
      const expCode = expLevelMap[experienceLevel];
      if (expCode) {
        params.append('f_E', expCode);
      }
    }
    
    // Date Posted Filter
    if (datePosted && datePosted !== 'all') {
      // LinkedIn time filters: r86400 (24h), r604800 (week), r2592000 (month)
      const dateMap: Record<string, string> = {
        '24h': 'r86400',
        'week': 'r604800',
        'month': 'r2592000',
      };
      const dateCode = dateMap[datePosted];
      if (dateCode) {
        params.append('f_TPR', dateCode);
      }
    }
    
    // Remote Filter
    if (remoteOnly) {
      params.append('f_WT', '2'); // 2 = Remote
    }
    
    const linkedInSearchUrl = `https://www.linkedin.com/jobs/search/?${params.toString()}`;
    
    console.log('LinkedIn URL:', linkedInSearchUrl);
    console.log(`Requesting ${limit === null ? 'all available' : limit} jobs (scraping may take 1-3 minutes)`);
    console.log('Filters:', { employmentType, experienceLevel, datePosted, remoteOnly });
    
    // Step 2: Start actor run with URLs
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: [linkedInSearchUrl],
          ...(limit !== null ? { maxItems: Math.min(limit, 50) } : {}),
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Failed to start Apify run:', runResponse.statusText, errorText);
      return [];
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const defaultDatasetId = runData.data.defaultDatasetId;
    
    console.log(`Apify run started: ${runId}`);
    console.log('LinkedIn job scraping typically takes 60-120 seconds...');

    // Step 2: Wait for the run to complete (poll status)
    // LinkedIn scraping can take time, but for finite limits we can stop early
    let status = 'RUNNING';
    let attempts = 0;
    const targetCount = limit ?? Number.POSITIVE_INFINITY;
    const maxAttempts = limit === null ? 90 : limit <= 25 ? 45 : 60;
    const pollInterval = 2000; // Check every 2 seconds
    let reachedTargetCount = false;

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`
      );
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.data.status;
        const elapsed = Math.round((attempts + 1) * pollInterval / 1000);
        console.log(`Apify status check ${attempts + 1}/${maxAttempts} (${elapsed}s elapsed): ${status}`);
      }

      // Early stop: if user selected a finite amount and dataset already has that many,
      // we can stop waiting and return immediately.
      if (limit !== null) {
        try {
          const probeResponse = await fetch(
            `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${APIFY_API_TOKEN}&limit=1&offset=${Math.max(targetCount - 1, 0)}`
          );
          if (probeResponse.ok) {
            const probeItems = await probeResponse.json();
            if (Array.isArray(probeItems) && probeItems.length > 0) {
              reachedTargetCount = true;
              console.log(`Early stop: reached requested ${targetCount} jobs, returning immediately.`);
              break;
            }
          }
        } catch (probeError) {
          console.warn('Dataset probe failed, continuing polling:', probeError);
        }
      }
      
      attempts++;
    }

    if (status !== 'SUCCEEDED' && !reachedTargetCount) {
      const totalTime = Math.round(attempts * pollInterval / 1000);
      console.warn(`Apify run not finished after ${totalTime}s (status: ${status}). Returning currently available dataset items.`);
    }

    if (reachedTargetCount && status === 'RUNNING') {
      try {
        await fetch(
          `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}/abort?token=${APIFY_API_TOKEN}`,
          { method: 'POST' }
        );
      } catch (abortError) {
        console.warn('Could not abort Apify run after early stop:', abortError);
      }
    }
    
    const totalTime = Math.round(attempts * pollInterval / 1000);
    console.log(`Proceeding to dataset fetch after ${totalTime} seconds.`);

    // Step 3: Fetch results from dataset
    const datasetUrl = `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${APIFY_API_TOKEN}${
      limit !== null ? `&limit=${limit}` : ''
    }`;
    const datasetResponse = await fetch(
      datasetUrl
    );

    if (!datasetResponse.ok) {
      console.error('Failed to fetch dataset:', datasetResponse.statusText);
      return [];
    }

    const jobsData = await datasetResponse.json();
    
    console.log(`Apify returned ${jobsData.length} jobs`);
    if (jobsData.length > 0) {
      console.log('Sample job data from Apify:', JSON.stringify(jobsData[0], null, 2));
    }

    // Step 4: Transform Apify data to our Job interface (LinkedIn Jobs Scraper format)
    const jobs: Job[] = jobsData.map((item: any, index: number) => {
      // Log the raw item to see exact field names
      if (index === 0) {
        console.log('Raw Apify job object fields:', Object.keys(item));
      }
      
      // Apify LinkedIn Jobs Scraper returns specific fields:
      // id, link, title, companyName, location, salaryInfo, postedAt, descriptionText, employmentType, etc.
      
      const jobId = item.id || `apify-${Date.now()}-${index}`;
      const title = item.title || 'No Title Available';
      const company = item.companyName || item.company || 'Unknown Company';
      const location = item.location || 'Location not specified';
      
      // Description: prefer text over HTML
      const description = item.descriptionText || item.descriptionHtml?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || item.description || 'No description available';
      
      // Apply URL
      const url = item.link || item.applyUrl || item.url || '#';
      
      // Salary: salaryInfo is an array like ["$17.00", "$19.00"]
      let salary = 'Not specified';
      if (Array.isArray(item.salaryInfo) && item.salaryInfo.length > 0) {
        if (item.salaryInfo.length === 2) {
          salary = `${item.salaryInfo[0]} - ${item.salaryInfo[1]}`;
        } else {
          salary = item.salaryInfo[0];
        }
      } else if (item.salary || item.salaryRange) {
        salary = item.salary || item.salaryRange;
      }
      
      // Skills: extract from jobFunction, industries, or parse from description
      // Helper: normalize a skill entry to a plain string
      const toSkillStr = (s: unknown): string => {
        if (typeof s === 'string') return s.trim();
        if (s && typeof s === 'object') {
          const obj = s as Record<string, unknown>;
          return String(obj.name || obj.label || obj.title || '').trim();
        }
        return '';
      };

      let skills: string[] = [];
      if (item.jobFunction) {
        skills.push(toSkillStr(item.jobFunction));
      }
      if (item.industries) {
        // industries might be string or array
        if (typeof item.industries === 'string') {
          skills.push(...item.industries.split(',').map((s: string) => s.trim()));
        } else if (Array.isArray(item.industries)) {
          skills.push(...(item.industries as unknown[]).map(toSkillStr));
        }
      }
      if (Array.isArray(item.skills)) {
        skills.push(...(item.skills as unknown[]).map(toSkillStr));
      }
      // Add benefits as skills if available
      if (Array.isArray(item.benefits)) {
        skills.push(...(item.benefits as unknown[]).map(toSkillStr));
      }
      // Remove duplicates
      skills = [...new Set(skills)].filter(Boolean);
      
      // Requirements: extract from seniorityLevel or parse description
      let requirements: string[] = [];
      if (item.seniorityLevel) {
        requirements.push(`Seniority Level: ${item.seniorityLevel}`);
      }
      if (item.applicantsCount) {
        requirements.push(`${item.applicantsCount} applicants`);
      }
      // Try to extract requirements from description
      const descLower = description.toLowerCase();
      if (descLower.includes('bachelor') || descLower.includes('degree')) {
        requirements.push('Bachelor\'s degree or equivalent experience');
      }
      if (descLower.includes('year') && descLower.includes('experience')) {
        const match = description.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
        if (match) {
          requirements.push(`${match[1]}+ years of experience`);
        }
      }
      
      // Employment type normalization
      let employmentType = 'full-time';
      if (item.employmentType) {
        employmentType = item.employmentType.toLowerCase().replace(/[_\s]/g, '-');
      }
      
      // Posted date: postedAt format is "2023-08-16"
      const postedDate = item.postedAt || item.postedDate || item.publishedAt || new Date().toISOString().split('T')[0];
      
      const transformedJob = {
        id: jobId,
        title: title,
        company: company,
        location: location,
        description: description,
        requirements: requirements,
        skills: skills,
        salary_range: salary,
        employment_type: employmentType,
        posted_date: postedDate,
        apply_url: url,
        source: 'linkedin',
      };
      
      if (index === 0) {
        console.log('Transformed first job:', JSON.stringify(transformedJob, null, 2));
      }
      
      return transformedJob;
    });
    
    console.log(`Transformed ${jobs.length} jobs successfully`);

    return jobs;
  } catch (error) {
    console.error('Error calling Apify API:', error);
    return [];
  }
}

// Function to call Apify CareerOne Job Scraper (run-sync then fetch dataset)
async function searchCareerOneJobs(
  keywords: string,
  location: string,
  limit: number | null,
  employmentType?: string,
  datePosted?: string,
): Promise<Job[]> {
  if (!CAREERONE_APIFY_TOKEN) {
    console.warn('APIFY_CAREERONE_TOKEN not configured, skipping CareerOne search');
    return [];
  }
  try {
    const maxResults = limit ?? 25;

    // Map employment type → CareerOne jobTypes / contractTypes
    const jobTypesMap: Record<string, string> = {
      'full-time': 'Full time',
      'part-time': 'Part time',
      'internship': 'Casual/Vacation',
    };
    const jobTypes = employmentType && jobTypesMap[employmentType]
      ? [jobTypesMap[employmentType]]
      : undefined;
    const contractTypes = employmentType === 'contract' ? ['Contract'] : undefined;

    // Map datePosted → dayRange (only send when > 0, actor treats 0 as "0 days" = no results)
    const dayRangeMap: Record<string, number> = { '24h': 1, 'week': 7, 'month': 30 };
    const dayRangeVal = datePosted ? dayRangeMap[datePosted] : undefined;
    const dayRange = dayRangeVal && dayRangeVal > 0 ? dayRangeVal : undefined;

    const body: Record<string, unknown> = {
      searchTerm: keywords || 'developer',
      maxResults,
      sortBy: 'Date Posted',
      allowSurrounding: true,
      // NOTE: Do NOT send location — the actor's geocoding service returns 403.
      // CareerOne is AU/NZ only; keyword search returns relevant results without location.
      ...(dayRange !== undefined ? { dayRange } : {}),
      ...(jobTypes ? { jobTypes } : {}),
      ...(contractTypes ? { contractTypes } : {}),
    };

    console.log('Calling CareerOne Apify actor (run-sync-get-dataset-items):', body);

    // run-sync-get-dataset-items blocks until done and returns items array directly
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${CAREERONE_ACTOR_ID}/run-sync-get-dataset-items?token=${CAREERONE_APIFY_TOKEN}&timeout=120${limit !== null ? `&limit=${limit}` : ''}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(130_000),
      }
    );

    if (!runResponse.ok) {
      const err = await runResponse.text();
      const isLocationError = err.includes('IndexError') || err.includes('list index out of range') || err.includes('get_best_fit_location');
      if (isLocationError) {
        console.error('CareerOne: location not found in AU/NZ database. Try an Australian city (Sydney, Melbourne, Brisbane, Perth, Adelaide).');
      } else {
        console.error('CareerOne Apify error:', runResponse.status, runResponse.statusText, err);
      }
      return [];
    }

    const items: any[] = await runResponse.json();
    console.log(`CareerOne actor returned ${items.length} items`);
    if (items.length > 0) {
      console.log('Sample CareerOne item fields:', JSON.stringify(Object.keys(items[0])));
      console.log('Sample CareerOne item:', JSON.stringify(items[0]).substring(0, 500));
    }

    const validTypes = ['full-time', 'part-time', 'contract', 'internship'] as const;
    type EmpType = typeof validTypes[number];

    const jobs: Job[] = items.map((item: any, index: number) => {
      const jobId = item.id || item.jobId || item.jobAdId || `careerone-${Date.now()}-${index}`;

      // CareerOne actor schema may vary:
      // - Seek-style: heading, advertiser, content
      // - CareerOne-style: job_title, company_name, job_description, URL
      const title =
        item.job_title ||
        item.heading ||
        item.title ||
        item.jobTitle ||
        item.position ||
        'No Title';

      // CareerOne uses advertiser.description (object) or advertiser as string
      const advertiser = item.advertiser;
      const company = (typeof advertiser === 'object' && advertiser !== null)
        ? (advertiser.description || advertiser.name || advertiser.label || JSON.stringify(advertiser))
        : (advertiser || item.company_name || item.company || item.companyName || item.employer || item.company_name || 'Unknown Company');

      // Location: may be string or object with 'label'/'area'
      const locRaw = item.location || item.locationName || item.locationLabel || item.suburb || item.city;
      const loc = (typeof locRaw === 'object' && locRaw !== null)
        ? (locRaw.label || locRaw.area || locRaw.description || JSON.stringify(locRaw))
        : (locRaw || 'Location not specified');

      // Description: CareerOne uses 'content'/'teaser' (Seek-style) or 'job_description' (CareerOne-style)
      const rawDesc = item.job_description || item.job_description_html || item.content || item.description || item.jobDescription || item.summary || item.teaser || '';
      const description = typeof rawDesc === 'string'
        ? rawDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'No description available'
        : 'No description available';

      const url = item.URL || item.url || item.jobUrl || item.applyUrl || item.apply_url || item.link || '#';

      // Salary: may be object with label, or CareerOne-style pay_description
      const salaryRaw = item.pay_description || item.salary || item.salaryRange || item.wage || item.salaryLabel;
      const salary = (typeof salaryRaw === 'object' && salaryRaw !== null)
        ? (salaryRaw.label || salaryRaw.description || salaryRaw.currencyLabel || 'Not specified')
        : (salaryRaw || 'Not specified');

      const skills: string[] = [];
      if (Array.isArray(item.skills)) {
        skills.push(
          ...item.skills
            .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.label || ''))
            .filter(Boolean)
        );
      }
      // CareerOne-style fields
      if (Array.isArray(item.perks)) {
        skills.push(
          ...item.perks
            .map((p: any) => (typeof p === 'string' ? p : p?.name || p?.label || ''))
            .filter(Boolean)
        );
      }
      if (Array.isArray(item.skills_details)) {
        skills.push(
          ...item.skills_details
            .map((sd: any) => (typeof sd === 'string' ? sd : sd?.name || sd?.label || ''))
            .filter(Boolean)
        );
      }
      if (item.category) skills.push(String(item.category));
      if (item.industry) skills.push(String(item.industry));
      // classification may be object {description:'...'} or string
      const classif = item.classification;
      if (classif) skills.push(typeof classif === 'object' ? (classif.description || classif.label || '') : classif);
      const subClassif = item.subClassification;
      if (subClassif) skills.push(typeof subClassif === 'object' ? (subClassif.description || subClassif.label || '') : subClassif);
      const workTypeSkill = item.workType || item.workTypes;
      if (workTypeSkill && typeof workTypeSkill === 'string') skills.push(workTypeSkill);

      const requirements: string[] = [];
      const descLower = description.toLowerCase();
      if (descLower.includes('bachelor') || descLower.includes('degree')) {
        requirements.push("Bachelor's degree or equivalent experience");
      }
      const expMatch = description.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
      if (expMatch) requirements.push(`${expMatch[1]}+ years of experience`);

      // workType can be array ['Full time'] or string or object
      const workTypeRaw = Array.isArray(item.workType) ? item.workType[0]
        : (typeof item.workType === 'object' && item.workType !== null) ? (item.workType.label || item.workType.description || '')
        : (item.workType || item.workTypes || item.employmentType || item.jobType || '');
      let rawType = String(workTypeRaw).toLowerCase().replace(/[_\s]/g, '-');
      if (rawType.includes('full')) rawType = 'full-time';
      else if (rawType.includes('part')) rawType = 'part-time';
      else if (rawType.includes('contract') || rawType.includes('casual')) rawType = 'contract';
      else if (rawType.includes('intern')) rawType = 'internship';
      const employmentType: EmpType = (validTypes.includes(rawType as EmpType) ? rawType : 'full-time') as EmpType;

      const postedDate =
        item.created_at ||
        item.listingDate ||
        item.postedDate ||
        item.datePosted ||
        item.publishedAt ||
        item.expiresAt ||
        new Date().toISOString().split('T')[0];
      // Normalize to YYYY-MM-DD if ISO string
      const postedDateStr = typeof postedDate === 'string' ? postedDate.split('T')[0] : new Date().toISOString().split('T')[0];

      return {
        id: String(jobId),
        title,
        company,
        location: typeof loc === 'string' ? loc : JSON.stringify(loc),
        description,
        requirements,
        skills: [...new Set(skills)].filter(Boolean),
        salary_range: typeof salary === 'string' ? salary : String(salary),
        employment_type: employmentType,
        posted_date: postedDateStr,
        apply_url: url,
        source: 'careerone',
      } satisfies Job;
    });

    return jobs;
  } catch (error) {
    console.error('Error calling CareerOne Apify actor:', error);
    return [];
  }
}

// Function to call Apify Workday Jobs Search (synchronous run)
async function searchWorkdayJobs(
  keywords: string,
  location: string,
  limit: number | null
): Promise<Job[]> {
  if (!WORKDAY_APIFY_TOKEN) {
    console.warn('APIFY_WORKDAY_TOKEN not configured, skipping Workday search');
    return [];
  }
  try {
    const maxItems = limit ?? 25;

    const body: Record<string, unknown> = {
      position: keywords || 'developer',
      ...(location ? { location } : {}),
      maxItems,
    };

    console.log('Calling Workday Apify actor (sync):', body);

    const response = await fetch(
      `https://api.apify.com/v2/acts/${WORKDAY_ACTOR_ID}/run-sync-get-dataset-items?token=${WORKDAY_APIFY_TOKEN}&timeout=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // 2 minute timeout for sync run
        signal: AbortSignal.timeout(130_000),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Workday Apify error:', response.statusText, err);
      return [];
    }

    const raw = await response.json();

    // run-sync-get-dataset-items returns an array directly
    const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? []);

    console.log(`Workday actor returned ${items.length} items`);
    if (items.length > 0) {
      console.log('Sample Workday item fields:', Object.keys(items[0]));
    }

    const jobs: Job[] = items.map((item: any, index: number) => {
      const jobId = item.id || item.jobId || item.requisitionId || `workday-${Date.now()}-${index}`;
      const title = item.title || item.jobTitle || item.positionTitle || 'No Title';
      const company = item.company || item.companyName || item.organization || item.employer || 'Unknown Company';
      const loc = item.location || item.locationName || item.jobLocation || item.primaryLocation || 'Location not specified';

      const rawDesc = item.description || item.jobDescription || item.summary || '';
      const description = typeof rawDesc === 'string'
        ? rawDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'No description available'
        : 'No description available';

      const url = item.url || item.applyUrl || item.externalJobUrl || item.jobUrl || item.link || '#';

      const salary = item.salaryRange || item.compensation || item.salary || 'Not specified';

      const skills: string[] = [];
      const _toStr = (s: unknown) => typeof s === 'string' ? s.trim() : (s && typeof s === 'object' ? String((s as Record<string,unknown>).name || (s as Record<string,unknown>).label || '') : '');
      if (Array.isArray(item.skills)) skills.push(...(item.skills as unknown[]).map(_toStr).filter(Boolean));
      if (item.jobCategory) skills.push(typeof item.jobCategory === 'string' ? item.jobCategory : String(item.jobCategory));
      if (item.department) skills.push(item.department);

      const requirements: string[] = [];
      if (item.experienceLevel || item.seniorityLevel) requirements.push(item.experienceLevel || item.seniorityLevel);
      const descLower = description.toLowerCase();
      if (descLower.includes('bachelor') || descLower.includes('degree')) {
        requirements.push("Bachelor's degree or equivalent experience");
      }
      const expMatch = description.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
      if (expMatch) requirements.push(`${expMatch[1]}+ years of experience`);

      const validTypes = ['full-time', 'part-time', 'contract', 'internship'] as const;
      type EmpType = typeof validTypes[number];
      let employmentType: EmpType = 'full-time';
      if (item.employmentType || item.jobType || item.timeType) {
        const raw = (item.employmentType || item.jobType || item.timeType)
          .toLowerCase().replace(/[_\s]/g, '-');
        employmentType = (validTypes.includes(raw as EmpType) ? raw : 'full-time') as EmpType;
      }

      const postedDate = item.postedDate || item.datePosted || item.startDate || new Date().toISOString().split('T')[0];

      return {
        id: String(jobId),
        title,
        company,
        location: typeof loc === 'string' ? loc : JSON.stringify(loc),
        description,
        requirements,
        skills: [...new Set(skills)].filter(Boolean),
        salary_range: salary,
        employment_type: employmentType,
        posted_date: postedDate,
        apply_url: url,
        source: 'workday',
      } satisfies Job;
    });

    return jobs;
  } catch (error) {
    console.error('Error calling Workday Apify actor:', error);
    return [];
  }
}

// Mock job data - fallback when Apify is not configured or fails
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Tech Innovations Inc.',
    location: 'New York, USA',
    description: 'We are seeking an experienced Frontend Developer to join our dynamic team. You will be responsible for building modern, responsive web applications using React and TypeScript.',
    requirements: [
      '5+ years of experience in frontend development',
      'Expert knowledge of React, TypeScript, and Next.js',
      'Experience with state management (Redux, Zustand)',
      'Strong understanding of web performance optimization',
      'Excellent problem-solving skills',
    ],
    skills: [
      'React',
      'TypeScript',
      'Next.js',
      'Redux',
      'Zustand',
      'HTML',
      'CSS',
      'JavaScript',
      'Git',
      'Webpack',
    ],
    salary_range: '$120,000 - $160,000',
    employment_type: 'full-time',
    posted_date: '2026-02-10',
    apply_url: 'https://example.com/apply/1',
    source: 'mock',
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'Digital Solutions Ltd.',
    location: 'San Francisco, USA',
    description: 'Join our innovative team building scalable web applications. We need a versatile developer comfortable with both frontend and backend technologies.',
    requirements: [
      '3+ years of full stack development experience',
      'Proficiency in React and Node.js',
      'Experience with PostgreSQL or MongoDB',
      'Knowledge of REST APIs and GraphQL',
      'Understanding of cloud platforms (AWS, GCP)',
    ],
    skills: [
      'React',
      'Node.js',
      'TypeScript',
      'PostgreSQL',
      'MongoDB',
      'REST API',
      'GraphQL',
      'AWS',
      'Docker',
      'Kubernetes',
    ],
    salary_range: '$100,000 - $140,000',
    employment_type: 'full-time',
    posted_date: '2026-02-12',
    apply_url: 'https://example.com/apply/2',
    source: 'mock',
  },
  {
    id: '3',
    title: 'React Developer',
    company: 'StartupHub',
    location: 'Remote',
    description: 'Fast-growing startup seeking a passionate React developer to help build the next generation of web applications. Great opportunity for growth.',
    requirements: [
      '2+ years of React development',
      'Experience with modern JavaScript (ES6+)',
      'Familiarity with responsive design',
      'Good communication skills',
      'Ability to work independently',
    ],
    skills: [
      'React',
      'JavaScript',
      'TypeScript',
      'HTML',
      'CSS',
      'Tailwind CSS',
      'Git',
      'REST API',
    ],
    salary_range: '$80,000 - $110,000',
    employment_type: 'full-time',
    posted_date: '2026-02-13',
    apply_url: 'https://example.com/apply/3',
    source: 'mock',
  },
  {
    id: '4',
    title: 'UI/UX Designer & Frontend Developer',
    company: 'Creative Agency',
    location: 'London, UK',
    description: 'Unique role combining design and development. Create beautiful, user-friendly interfaces and bring them to life with code.',
    requirements: [
      'Strong portfolio demonstrating UI/UX skills',
      'Proficiency in Figma or Adobe XD',
      'Frontend development experience (React preferred)',
      'Understanding of design systems',
      'Creative problem-solving abilities',
    ],
    skills: [
      'Figma',
      'Adobe XD',
      'React',
      'JavaScript',
      'CSS',
      'Tailwind CSS',
      'Design Systems',
      'Prototyping',
    ],
    salary_range: '£50,000 - £70,000',
    employment_type: 'full-time',
    posted_date: '2026-02-09',
    apply_url: 'https://example.com/apply/4',
    source: 'mock',
  },
  {
    id: '5',
    title: 'Frontend Developer Intern',
    company: 'BigTech Corp',
    location: 'Seattle, USA',
    description: 'Summer internship opportunity for aspiring frontend developers. Work on real projects, learn from experienced mentors, and grow your skills.',
    requirements: [
      'Currently pursuing CS degree or related field',
      'Basic knowledge of HTML, CSS, JavaScript',
      'Familiarity with React or similar frameworks',
      'Enthusiasm to learn',
      'Team player',
    ],
    skills: [
      'HTML',
      'CSS',
      'JavaScript',
      'React',
      'Git',
    ],
    salary_range: '$25/hour',
    employment_type: 'internship',
    posted_date: '2026-02-11',
    apply_url: 'https://example.com/apply/5',
    source: 'mock',
  },
  {
    id: '6',
    title: 'Senior Software Engineer',
    company: 'Enterprise Solutions',
    location: 'Boston, USA',
    description: 'Lead development of enterprise-grade applications. Work with cutting-edge technologies and mentor junior developers.',
    requirements: [
      '7+ years of software development experience',
      'Strong architectural and design skills',
      'Experience with microservices',
      'Leadership and mentoring abilities',
      'Excellent communication skills',
    ],
    skills: [
      'React',
      'Node.js',
      'TypeScript',
      'Microservices',
      'Docker',
      'Kubernetes',
      'AWS',
      'PostgreSQL',
      'Redis',
      'CI/CD',
    ],
    salary_range: '$150,000 - $190,000',
    employment_type: 'full-time',
    posted_date: '2026-02-08',
    apply_url: 'https://example.com/apply/6',
    source: 'mock',
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywords = searchParams.get('keywords') || '';
    const location = searchParams.get('location') || '';
    const employmentType = searchParams.get('employment_type') || '';
    const experienceLevel = searchParams.get('experience_level') || '';
    const datePosted = searchParams.get('date_posted') || '';
    const remoteOnly = searchParams.get('remote') === 'true';
    const limitParam = searchParams.get('limit') || '25';
    const limit = limitParam === 'all'
      ? null
      : Math.min(Math.max(parseInt(limitParam, 10) || 25, 1), 50);
    const source = searchParams.get('source') || 'linkedin'; // 'linkedin' | 'workday' | 'careerone'

    let jobs: Job[] = [];

    if (source === 'careerone') {
      console.log('Fetching jobs from CareerOne via Apify...');
      jobs = await searchCareerOneJobs(keywords, location, limit, employmentType, datePosted);
      console.log(`CareerOne actor returned ${jobs.length} jobs`);
    } else if (source === 'workday') {
      // Workday via Apify synchronous actor
      console.log('Fetching jobs from Workday via Apify...');
      jobs = await searchWorkdayJobs(keywords, location, limit);
      console.log(`Workday actor returned ${jobs.length} jobs`);
    } else if (APIFY_API_TOKEN) {
      // LinkedIn via Apify
      console.log('Fetching jobs from LinkedIn via Apify...');
      console.log('Search params:', { keywords, location, employmentType, experienceLevel, datePosted, remoteOnly, limit: limit ?? 'all' });
      jobs = await searchLinkedInJobs(keywords, location, employmentType, experienceLevel, datePosted, remoteOnly, limit);
      console.log(`Apify function returned ${jobs.length} jobs`);
    } else {
      console.log('Apify token not configured');
    }

    // If Apify returned no results or is not configured, use mock data
    // NOTE: Do NOT fall back to mock for careerone/workday — those are real searches
    if (jobs.length === 0 && source !== 'careerone' && source !== 'workday') {
      console.log('Using mock data as fallback');
      let filteredJobs = mockJobs;

      // Filter by keywords (search in title, company, description, skills)
      if (keywords) {
        const keywordLower = keywords.toLowerCase();
        filteredJobs = filteredJobs.filter(
          (job) =>
            job.title.toLowerCase().includes(keywordLower) ||
            job.company.toLowerCase().includes(keywordLower) ||
            job.description.toLowerCase().includes(keywordLower) ||
            job.skills.some((skill) => {
              const s = typeof skill === 'string' ? skill : (skill as { name?: string })?.name ?? '';
              return s.toLowerCase().includes(keywordLower);
            })
        );
      }

      // Filter by location
      if (location && !remoteOnly) {
        const locationLower = location.toLowerCase();
        filteredJobs = filteredJobs.filter((job) =>
          job.location.toLowerCase().includes(locationLower)
        );
      }

      // Filter by remote
      if (remoteOnly) {
        filteredJobs = filteredJobs.filter((job) =>
          job.location.toLowerCase().includes('remote')
        );
      }

      // Filter by employment type
      if (employmentType && employmentType !== 'all') {
        filteredJobs = filteredJobs.filter((job) => job.employment_type === employmentType);
      }

      // Filter by experience level (basic filtering based on job title)
      if (experienceLevel && experienceLevel !== 'all') {
        filteredJobs = filteredJobs.filter((job) => {
          const titleLower = job.title.toLowerCase();
          if (experienceLevel === 'entry') return titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('intern');
          if (experienceLevel === 'mid') return !titleLower.includes('senior') && !titleLower.includes('junior') && !titleLower.includes('intern');
          if (experienceLevel === 'senior') return titleLower.includes('senior') || titleLower.includes('lead');
          if (experienceLevel === 'lead') return titleLower.includes('lead') || titleLower.includes('manager') || titleLower.includes('director');
          return true;
        });
      }

      // Filter by date posted
      if (datePosted && datePosted !== 'all') {
        const now = new Date();
        filteredJobs = filteredJobs.filter((job) => {
          const posted = new Date(job.posted_date);
          const diffTime = now.getTime() - posted.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          
          if (datePosted === '24h') return diffDays <= 1;
          if (datePosted === 'week') return diffDays <= 7;
          if (datePosted === 'month') return diffDays <= 30;
          return true;
        });
      }

      // Limit results
      jobs = limit === null ? filteredJobs : filteredJobs.slice(0, limit);
    }

    // Enforce final result count regardless of upstream source behavior
    if (limit !== null) {
      jobs = jobs.slice(0, limit);
    }
    
    console.log(`Final API response: ${jobs.length} jobs from ${jobs[0]?.source || 'mock'} source`);

    return NextResponse.json({
      success: true,
      jobs: jobs,
      total: jobs.length,
      source: jobs[0]?.source || 'mock',
    });
  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search jobs' },
      { status: 500 }
    );
  }
}
