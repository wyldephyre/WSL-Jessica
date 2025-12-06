/**
 * Environment configuration
 * Centralized access to environment variables
 */

export const env = {
  // API Keys
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  XAI_API_KEY: process.env.XAI_API_KEY || '',
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  MEM0_API_KEY: process.env.MEM0_API_KEY || '',

  // Firebase
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',

  // Backend API
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
} as const;

