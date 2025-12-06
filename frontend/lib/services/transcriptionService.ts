import { env } from '@/lib/config/env';
import { Groq } from 'groq-sdk';

/**
 * Transcribe audio file using Groq Whisper API
 */
export async function transcribeAudio(file: File): Promise<{
  text: string;
  language?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}> {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const groq = new Groq({
    apiKey: env.GROQ_API_KEY,
  });

  try {
    // Convert File to File object for Groq API
    // Groq API accepts File objects directly
    const transcription = await groq.audio.transcriptions.create({
      file: file, // Use file directly
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
    });

    // Handle different response formats
    if (typeof transcription === 'string') {
      return {
        text: transcription,
      };
    }

    // Handle verbose JSON response
    const verbose = transcription as any;
    return {
      text: verbose.text || '',
      language: verbose.language,
      segments: verbose.segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
      })),
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

