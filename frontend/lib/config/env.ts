/**
 * Environment configuration
 * Centralized access to environment variables
 */

export const env = {
  // API Keys (removed from frontend - now server-side only)
  // ANTHROPIC_API_KEY, XAI_API_KEY, GOOGLE_AI_API_KEY removed - use backend proxy endpoints
  // GROQ_API_KEY and MEM0_API_KEY kept for server-side Next.js API routes only
  
  GROQ_API_KEY: process.env.GROQ_API_KEY || '', // Used in server-side Next.js routes only
  LETTA_API_KEY: process.env.LETTA_API_KEY || '', // Used in server-side Next.js routes only
  MEM0_API_KEY: process.env.MEM0_API_KEY || '', // Deprecated - kept for migration period

  // Firebase
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',

  // Backend API
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',

  // Zo Computer API (replaces Google Workspace integrations)
  ZO_API_BASE_URL: process.env.ZO_API_BASE_URL || 'https://api.zo.computer/v1',
  ZO_API_KEY: process.env.ZO_API_KEY || '', // Server-side only
  
  // Letta API (replaces Mem0)
  LETTA_API_BASE_URL: process.env.LETTA_API_BASE_URL || 'https://api.letta.ai/v1',
} as const;

