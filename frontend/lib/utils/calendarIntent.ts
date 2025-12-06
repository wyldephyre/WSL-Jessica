/**
 * Detect calendar intent from user message
 */

export interface CalendarIntent {
  hasIntent: boolean;
  action?: 'create' | 'list' | 'update' | 'delete';
  eventData?: {
    title?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
  };
}

/**
 * Detect if message contains calendar intent
 */
export function detectCalendarIntent(message: string): CalendarIntent {
  const lowerMessage = message.toLowerCase();

  // Keywords for calendar actions
  const createKeywords = [
    'schedule',
    'book',
    'create event',
    'add to calendar',
    'set up meeting',
    'plan',
    'appointment',
  ];

  const listKeywords = [
    'show calendar',
    'what\'s on my calendar',
    'upcoming events',
    'list events',
    'calendar',
  ];

  // Check for create intent
  if (createKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    // Try to extract event details (simplified)
    const titleMatch = message.match(/(?:title|event|meeting|appointment):\s*(.+?)(?:\n|$)/i);
    const timeMatch = message.match(/(?:at|on|when):\s*(.+?)(?:\n|$)/i);

    return {
      hasIntent: true,
      action: 'create',
      eventData: {
        title: titleMatch?.[1]?.trim() || undefined,
        startTime: timeMatch?.[1]?.trim() || undefined,
      },
    };
  }

  // Check for list intent
  if (listKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return {
      hasIntent: true,
      action: 'list',
    };
  }

  return {
    hasIntent: false,
  };
}

