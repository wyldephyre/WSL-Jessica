/**
 * Detect Gmail intent from user message
 */

export interface GmailIntent {
  hasIntent: boolean;
  action?: 'list' | 'read' | 'markRead';
  filters?: {
    unread?: boolean;
    from?: string;
    subject?: string;
    query?: string; // Raw Gmail search query
  };
  messageId?: string;
}

/**
 * Detect if message contains Gmail intent
 */
export function detectGmailIntent(message: string): GmailIntent {
  const lowerMessage = message.toLowerCase();

  // Keywords for Gmail actions
  const listKeywords = [
    'check email',
    'check emails',
    'check my email',
    'show emails',
    'show messages',
    'list emails',
    'unread emails',
    'new emails',
    'emails from',
    'messages from',
  ];

  const readKeywords = [
    'read email',
    'read message',
    'show email',
    'open email',
    'view email',
  ];

  const markReadKeywords = [
    'mark as read',
    'mark read',
    'read it',
  ];

  // Check for list intent
  if (listKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    const filters: GmailIntent['filters'] = {};

    // Check for unread filter
    if (lowerMessage.includes('unread') || lowerMessage.includes('new')) {
      filters.unread = true;
    }

    // Extract "from" filter
    const fromMatch = message.match(/(?:from|by)\s+([\w.@-]+@[\w.@-]+)/i);
    if (fromMatch) {
      filters.from = fromMatch[1];
    }

    // Extract subject filter
    const subjectMatch = message.match(/(?:subject|about|regarding):\s*(.+?)(?:\s|$)/i);
    if (subjectMatch) {
      filters.subject = subjectMatch[1].trim();
    }

    // Build Gmail query
    const queryParts: string[] = [];
    if (filters.unread) {
      queryParts.push('is:unread');
    }
    if (filters.from) {
      queryParts.push(`from:${filters.from}`);
    }
    if (filters.subject) {
      queryParts.push(`subject:"${filters.subject}"`);
    }
    filters.query = queryParts.join(' ');

    return {
      hasIntent: true,
      action: 'list',
      filters,
    };
  }

  // Check for read intent
  if (readKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    // Try to extract message ID (if provided)
    const idMatch = message.match(/(?:id|message)[:\s]+([a-zA-Z0-9]+)/i);
    
    return {
      hasIntent: true,
      action: 'read',
      messageId: idMatch?.[1],
    };
  }

  // Check for mark as read intent
  if (markReadKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    const idMatch = message.match(/(?:id|message)[:\s]+([a-zA-Z0-9]+)/i);
    
    return {
      hasIntent: true,
      action: 'markRead',
      messageId: idMatch?.[1],
    };
  }

  return {
    hasIntent: false,
  };
}

