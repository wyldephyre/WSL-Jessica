import { env } from '@/lib/config/env';
import { Groq } from 'groq-sdk';
// Firebase removed - Zo Computer handles task storage

interface ExtractedTask {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}

/**
 * Extract tasks from transcription using Groq
 */
export async function extractAndSaveWithGroq(
  transcription: string,
  _options?: { source?: string }
): Promise<{
  tasks: ExtractedTask[];
  events: any[];
}> {
  // Optional source/metadata can be passed by callers; ignored for now.
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const groq = new Groq({
    apiKey: env.GROQ_API_KEY,
  });

  // Prompt for task extraction
  const prompt = `Extract tasks and events from this transcription. Return JSON with "tasks" and "events" arrays.

Transcription:
${transcription}

Return JSON format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Optional description",
      "dueDate": "YYYY-MM-DD or null",
      "priority": "high|medium|low",
      "category": "Optional category"
    }
  ],
  "events": [
    {
      "title": "Event title",
      "startTime": "ISO 8601 datetime",
      "endTime": "ISO 8601 datetime",
      "location": "Optional location"
    }
  ]
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a task extraction assistant. Extract tasks and calendar events from transcriptions. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    const parsed = JSON.parse(content);
    const tasks = parsed.tasks || [];
    const events = parsed.events || [];

    // TODO: Save tasks to Zo Computer API instead of Firestore
    // Tasks are now handled by Zo Computer
    // For now, return extracted tasks without saving locally
    // await zoCreateTasks(tasks); // When Zo API is ready

    return { tasks, events };
  } catch (error) {
    console.error('Task extraction error:', error);
    throw error;
  }
}

