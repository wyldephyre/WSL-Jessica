import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/services/transcriptionService';
import { handleApiError, ValidationError, ExternalServiceError } from '@/lib/errors/AppError';

// Groq Whisper API file size limit (approximately 25MB)
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

interface GroqError extends Error {
  status?: number;
  response?: { status?: number };
  code?: number;
  fileSize?: number;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;
    
    if (!file) {
      throw new ValidationError('No audio file provided');
    }

    // Validate file size before processing
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log('[API] /api/transcribe: received file:', file.name, `${fileSizeMB}MB`, file.type);
    
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File is too large (${fileSizeMB}MB). Maximum file size is 25MB. ` +
        'Please compress your audio file or split it into smaller segments.'
      );
    }

    console.log('[API] /api/transcribe: sending to Groq Whisper (anti-Big Tech!)...');

    // Keep everything in-memory; pass the Blob/File straight to Whisper
    const verbose = await transcribeAudio(file);

    // Shape response for existing UI while returning full verbose JSON
    const response = {
      success: true,
      transcription: verbose?.text || '',
      language: verbose?.language || null,
      verbose, // includes segments with timestamps
    };

    console.log('[API] /api/transcribe: transcription complete. chars=', response.transcription.length);
    return NextResponse.json(response);
    
  } catch (error) {
    // Use unified error handling
    if (error instanceof ValidationError) {
      return handleApiError(error);
    }

    // Handle Groq API errors
    const groqError = error as GroqError;
    const status = groqError?.status || groqError?.response?.status || groqError?.code;
    
    if (status === 401) {
      return handleApiError(new ExternalServiceError('Groq API', 'Invalid API key. Please check your GROQ_API_KEY environment variable.'));
    } else if (status === 413 || groqError?.message?.includes('413') || groqError?.message?.includes('Request Entity Too Large')) {
      const fileSizeMB = groqError?.fileSize ? (groqError.fileSize / (1024 * 1024)).toFixed(2) : 'unknown';
      return handleApiError(new ExternalServiceError(
        'Groq API',
        `File is too large (${fileSizeMB}MB). Maximum file size is 25MB. ` +
        'Please compress your audio file or split it into smaller segments.'
      ));
    } else if (status === 429) {
      return handleApiError(new ExternalServiceError('Groq API', 'Rate limit exceeded. Please try again later.'));
    }

    // Fallback to generic error handling
    return handleApiError(error);
  }
}

