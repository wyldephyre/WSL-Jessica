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
    attendees?: string[];
    description?: string;
  };
  date?: string;
  time?: string;
  notes?: string;
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
    // Try to extract event details with improved parsing
    const titleMatch = message.match(/(?:title|event|meeting|appointment|called|named):\s*(.+?)(?:\s+(?:at|on|when|with)|$)/i);
    const timeMatch = message.match(/(?:at|on|when|for):\s*([\d:]+(?:\s*(?:am|pm))?)/i);
    const dateMatch = message.match(/(?:on|for)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    const locationMatch = message.match(/(?:at|in|location):\s*(.+?)(?:\s+(?:at|on|when)|$)/i);
    const attendeesMatch = message.match(/(?:with|attendees?):\s*([\w\s,@.]+)/i);
    const notesMatch = message.match(/(?:notes?|description|details?):\s*(.+?)(?:\s+(?:at|on|when)|$)/i);

    // Extract title (first part of message before time/date keywords)
    let title = titleMatch?.[1]?.trim();
    if (!title) {
      // Try to extract from beginning of message
      const beforeKeyword = message.split(/(?:schedule|book|create|add|set up)/i)[1];
      if (beforeKeyword) {
        title = beforeKeyword.split(/(?:at|on|when|with|for)/i)[0]?.trim();
      }
    }

    return {
      hasIntent: true,
      action: 'create',
      eventData: {
        title: title || undefined,
        startTime: timeMatch?.[1]?.trim() || undefined,
        location: locationMatch?.[1]?.trim() || undefined,
        attendees: attendeesMatch?.[1]?.split(/[,\s]+/).filter(Boolean) || undefined,
        description: notesMatch?.[1]?.trim() || undefined,
      },
      date: dateMatch?.[1]?.trim() || undefined,
      time: timeMatch?.[1]?.trim() || undefined,
      notes: notesMatch?.[1]?.trim() || undefined,
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

