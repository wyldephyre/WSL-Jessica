'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface TranscriptionResult {
  success: boolean;
  transcription?: string;
  language?: string;
  verbose?: any;
  error?: string;
}

export default function AudioUpload() {
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setFileName(file.name);

    // Validate file type
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type: ${file.type}. Please upload an audio file (mp3, wav, m4a, etc.)`);
      return;
    }

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File is too large (${fileSizeMB}MB). Maximum file size is 25MB.`);
      return;
    }

    try {
      // Step 1: Upload file metadata
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload successful:', uploadData);

      // Step 2: Transcribe audio
      setUploading(false);
      setTranscribing(true);

      const transcribeFormData = new FormData();
      transcribeFormData.append('audio', file);

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: transcribeFormData,
      });

      if (!transcribeResponse.ok) {
        const transcribeError = await transcribeResponse.json();
        throw new Error(transcribeError.error || 'Transcription failed');
      }

      const transcribeData = await transcribeResponse.json();
      setResult(transcribeData);
      setTranscribing(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setUploading(false);
      setTranscribing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.mp4', '.webm'],
    },
    maxFiles: 1,
    disabled: uploading || transcribing,
  });

  return (
    <div className="w-full">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? 'border-gray-400 bg-gray-800/60'
              : 'border-gray-600 bg-gray-800/20 hover:border-gray-500 hover:bg-gray-800/40'
          }
          ${uploading || transcribing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          {uploading ? (
            <div className="text-gray-300">
              <p className="text-lg font-semibold">Uploading...</p>
              <p className="text-sm text-gray-400 mt-2">{fileName}</p>
            </div>
          ) : transcribing ? (
            <div className="text-gray-300">
              <p className="text-lg font-semibold">Transcribing audio...</p>
              <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
            </div>
          ) : isDragActive ? (
            <p className="text-lg font-semibold text-gray-200">Drop the audio file here</p>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-200">
                Drag & drop an audio file here
              </p>
              <p className="text-sm text-gray-400">or click to browse</p>
              <p className="text-xs text-gray-500 mt-2">
                Supports: MP3, WAV, M4A, MP4, WebM (max 25MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
          <p className="text-red-200 font-semibold">Error</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Transcription Result */}
      {result && result.success && result.transcription && (
        <div className="mt-4 p-6 bg-gray-800/40 border border-gray-700/30 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Transcription</h3>
            {result.language && (
              <span className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded">
                {result.language}
              </span>
            )}
          </div>
          <div className="bg-gray-900/60 rounded p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-200 whitespace-pre-wrap">{result.transcription}</p>
          </div>
          {fileName && (
            <p className="text-xs text-gray-400 mt-3">File: {fileName}</p>
          )}
        </div>
      )}

      {/* Loading Spinner */}
      {(uploading || transcribing) && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        </div>
      )}
    </div>
  );
}

