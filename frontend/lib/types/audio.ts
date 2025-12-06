/**
 * Audio type definitions
 */

export interface AudioFile {
  id?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt?: Date | string;
  processed?: boolean;
  status?: 'uploaded' | 'processing' | 'completed' | 'error';
  transcription?: string;
  metadata?: Record<string, any>;
}

export interface TranscriptionResult {
  success: boolean;
  transcription?: string;
  language?: string;
  verbose?: any;
  error?: string;
}

