# Gemini 1.5 Flash AI Integration Guide

## Overview
This CV Builder application now uses **Google's Gemini 1.5 Flash 001** (Free Tier) as its primary AI service for all resume optimization, enhancement, and writing features.

## Features Enabled

### 1. **Resume Optimization**
- Analyzes your CV against a job description
- Identifies keyword matches and gaps
- Provides specific suggestions to improve relevance
- Endpoint: `POST /api/ai` with `action: "optimize"`

### 2. **Professional Summary Generation**
- Creates compelling professional summaries based on experience
- Highlights key qualifications
- Customized for desired positions
- Endpoint: `POST /api/ai` with `action: "generate-summary"`

### 3. **Cover Letter Generation**
- Generates personalized cover letters
- Matches job requirements with your experience
- Available tones: professional, friendly, formal
- Endpoint: `POST /api/ai` with `action: "cover-letter"`

### 4. **Section Improvement**
- Enhances any resume section
- Uses action verbs and quantifies results
- Maintains authenticity while improving professionalism
- Endpoint: `POST /api/ai` with `action: "improve-section"`

### 5. **Resume Review**
- Comprehensive CV analysis
- Identifies strengths and weaknesses
- Provides actionable recommendations
- Endpoint: `POST /api/ai` with `action: "review"`

## Configuration

### Environment Variables
Add the following to `.env.local`:

```env
# Gemini AI Configuration
GEMINI_API_KEY=AIzaSyCH-WhqCKgqFjyTQG0ujss7daqfTPTG1ZY
```

### API Key
- Obtain your Gemini API key from [Google AI Studio](https://aistudio.google.com)
- The key has been configured in: `.env.local`

## Available Endpoints

### Main AI Service
**POST** `/api/ai`

Request format:
```json
{
  "action": "optimize|cover-letter|improve-section|review|generate-summary",
  "resumeContent": {...},
  "jobDescription": "...",
  ...
}
```

### Individual Endpoints (Legacy)
- `POST /api/ai/optimize` - CV Optimization
- `POST /api/ai/cover-letter` - Cover Letter Generation
- `POST /api/ai/improve` - Section Improvement

## Usage in Editor

### UI Features
1. **Generate Summary Button** - Creates a professional summary with one click
2. **Optimize for Job Button** - Opens dialog to paste job description and optimize CV
3. **Copy Results** - Easy copying of AI-generated content

### Example Code
```typescript
import { callAI, optimizeResumeForJob } from '@/lib/ai/client';

// Method 1: Direct call
const result = await callAI({
  action: 'optimize',
  resumeContent: content,
  jobDescription: jobDesc,
});

// Method 2: Using helper functions
const optimized = await optimizeResumeForJob(content, jobDesc);
```

## Model Details

### Gemini 1.5 Flash 001 (Free Tier)
- **Speed**: Ultra-fast responses (optimized for speed)
- **Cost**: ✅ **FREE** with generous quotas
- **Capabilities**: Advanced AI understanding and generation
- **Context Window**: 1 million tokens (handles large documents)
- **Model ID**: `gemini-1.5-flash-001`
- **Free Tier Limits**: 15 requests per minute, 1500 requests per day

## Cost Optimization

✅ **Completely FREE** - No costs!
- Gemini 1.5 Flash 001 is the fastest free model available
- Ultra-fast responses perfect for real-time optimization
- 1500 requests per day is more than enough for personal use
- Unlimited local testing and development
- Perfect for CV optimization without any expenses

**Why Gemini 1.5 Flash 001?**
- ⚡ Fastest response times among free models
- 🧠 Full AI reasoning and understanding capabilities
- 💾 1 million token context (handles full CVs + job descriptions)
- 💰 Completely free with generous quotas
- 🚀 Perfect for production use

**Free Tier Limits (sufficient for most users):**
- 15 requests per minute
- 1500 requests per day
- 1 million token context window

## API Response Format

```json
{
  "success": true,
  "action": "optimize",
  "result": "AI-generated content here...",
  "model": "gemini-1.5-flash"
}
```

## Error Handling

All AI endpoints return detailed error information:
```json
{
  "success": false,
  "error": "Failed to optimize resume",
  "details": "Detailed error message"
}
```

## Rate Limiting

- Gemini API has generous free tier limits
- Current setup supports unlimited local testing
- Production deployments may need rate limiting configuration

## Future Enhancements

Possible additions:
- [ ] Batch processing multiple CVs
- [ ] Custom prompts for specialized roles
- [ ] Multi-language support
- [ ] Real-time feedback during editing
- [ ] Job market trend analysis
- [ ] Interview preparation suggestions

## Troubleshooting

### API Key Issues
- Verify key in `.env.local`: `GEMINI_API_KEY=...`
- Check key validity on [Google AI Studio](https://aistudio.google.com)
- Restart development server after changing key

### Response Issues
- Check browser console for error details
- Verify job description is properly formatted
- Ensure resume content is complete

### Rate Limiting
- Clear browser cache and retry
- Use shorter job descriptions for faster responses
- Contact Google Cloud support for quota increases

## Files Modified/Created

### New Files
- `/lib/ai/gemini.ts` - Gemini AI implementation
- `/lib/ai/client.ts` - Frontend client utilities
- `/app/api/ai/route.ts` - Unified AI service endpoint

### Modified Files
- `/app/api/ai/optimize/route.ts` - Updated to use Gemini
- `/app/api/ai/cover-letter/route.ts` - Updated to use Gemini
- `/app/api/ai/improve/route.ts` - Updated to use Gemini
- `/app/editor/[id]/page.tsx` - Added AI UI features
- `.env.local` - Added Gemini API key
- `.env.example` - Added Gemini configuration reference

## Support

For issues with Gemini:
- Check [Google AI Documentation](https://ai.google.dev/docs)
- Review error messages in browser console
- Verify API quotas in Google Cloud Console

---

**Last Updated**: February 2026
**Status**: ✅ Active and fully integrated (FREE TIER)
**Model**: Gemini 1.5 Flash 001 (v0.24.1 SDK) - No costs!
