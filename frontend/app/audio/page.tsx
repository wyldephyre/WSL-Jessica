'use client';

import AudioUpload from '@/components/AudioUpload';

/**
 * Audio Page - Audio upload and processing
 */
export default function AudioPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-100">Audio Processing</h1>
          <p className="text-gray-500 mt-1">Upload and process audio files, voice memos, and Plaud dumps</p>
        </header>
        
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-8">
          <AudioUpload />
        </div>
        
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Drop your Plaud dumps, voice memos, or any audio files.</p>
          <p>Jessica will process them and extract tasks, events, and notes.</p>
        </div>
      </div>
    </div>
  );
}

