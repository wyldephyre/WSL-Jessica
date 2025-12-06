import { NextRequest, NextResponse } from 'next/server';
import { extractAndSaveWithGroq } from '@/lib/services/taskExtractionService';
import { handleApiError, ValidationError, ExternalServiceError } from '@/lib/errors/AppError';

interface GroqError extends Error {
  status?: number;
}

interface ExtractTasksRequestBody {
  transcript?: string;
  transcription?: string;
  mode?: string;
}

export async function POST(request: NextRequest) {
  try {
    // MVP policy: Groq-only extraction to avoid Anthropic billing errors

    const body = (await request.json()) as ExtractTasksRequestBody;
    const transcript = body?.transcript || body?.transcription;
    // mode ignored for MVP; always use Groq
    
    if (!transcript) {
      throw new ValidationError('No transcription provided');
    }

    const result = await extractAndSaveWithGroq(transcript, { source: 'api:extract-tasks:groq-only' });

    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    // Use unified error handling
    if (error instanceof ValidationError || error instanceof ExternalServiceError) {
      return handleApiError(error);
    }

    // Handle specific API errors
    const groqError = error as GroqError;
    if (groqError.status === 401) {
      return handleApiError(new ExternalServiceError('Groq API', 'Invalid API key. Please check your GROQ_API_KEY environment variable.'));
    } else if (groqError.status === 429) {
      return handleApiError(new ExternalServiceError('Groq API', 'Rate limit exceeded. Please try again later.'));
    }

    // Fallback to generic error handling
    return handleApiError(error);
  }
}

