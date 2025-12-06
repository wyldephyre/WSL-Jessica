import { env } from '@/lib/config/env';
import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiModel: any = null;

/**
 * Get or create Gemini model
 */
export function getGeminiModel() {
  if (!geminiModel) {
    if (!env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }
    const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return geminiModel;
}

