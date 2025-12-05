// Jessica Core API Client
// Connects to backend at http://localhost:8000

const API_BASE = 'http://localhost:8000';

// Types
export interface ChatResponse {
  response: string;
  routing: {
    provider: 'local' | 'claude' | 'grok' | 'gemini';
    tier: number;
    reason: string;
  };
}

export interface StatusResponse {
  local_ollama: boolean;
  local_memory: boolean;
  claude_api: boolean;
  grok_api: boolean;
  gemini_api: boolean;
  mem0_api: boolean;
}

export interface MemorySearchResult {
  results: Array<{
    memory: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>;
}

export interface TranscriptionResponse {
  text: string;
  error?: string;
}

// API Functions

export async function sendMessage(
  message: string,
  provider?: 'claude' | 'grok' | 'gemini' | 'local'
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...(provider && { provider }) }),
  });
  
  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getStatus(): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE}/status`);
  
  if (!response.ok) {
    throw new Error(`Status request failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function searchMemories(query: string): Promise<MemorySearchResult> {
  const response = await fetch(`${API_BASE}/memory/cloud/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  
  if (!response.ok) {
    throw new Error(`Memory search failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getAllMemories(): Promise<MemorySearchResult> {
  const response = await fetch(`${API_BASE}/memory/cloud/all`);
  
  if (!response.ok) {
    throw new Error(`Get memories failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function transcribeAudio(audioFile: File): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const response = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`);
  }
  
  return response.json();
}

// Provider display helpers
export const providerColors: Record<string, string> = {
  local: 'text-emerald-400',
  claude: 'text-orange-400',
  grok: 'text-blue-400',
  gemini: 'text-purple-400',
};

export const providerNames: Record<string, string> = {
  local: 'Dolphin (Local)',
  claude: 'Claude',
  grok: 'Grok',
  gemini: 'Gemini',
};

