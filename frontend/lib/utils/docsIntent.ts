/**
 * Detect Google Docs intent from user message
 */

export interface DocsIntent {
  hasIntent: boolean;
  action?: 'create' | 'read' | 'append' | 'update';
  documentId?: string;
  title?: string;
  content?: string;
}

/**
 * Detect if message contains Google Docs intent
 */
export function detectDocsIntent(message: string): DocsIntent {
  const lowerMessage = message.toLowerCase();

  // Keywords for Docs actions
  const createKeywords = [
    'create document',
    'create doc',
    'new document',
    'new doc',
    'make a document',
    'make a doc',
  ];

  const readKeywords = [
    'read document',
    'read doc',
    'show document',
    'show doc',
    'open document',
    'view document',
  ];

  const appendKeywords = [
    'add to document',
    'add to doc',
    'append to document',
    'append to doc',
    'write to document',
    'write to doc',
    'update document',
    'update doc',
  ];

  // Check for create intent
  if (createKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    // Extract title
    const titleMatch = message.match(/(?:called|named|titled|title):\s*(.+?)(?:\s|$)/i);
    const titleFromMessage = message.split(/(?:create|new|make)/i)[1]?.split(/(?:with|containing|that says)/i)[0]?.trim();

    return {
      hasIntent: true,
      action: 'create',
      title: titleMatch?.[1]?.trim() || titleFromMessage || 'Untitled Document',
    };
  }

  // Check for read intent
  if (readKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    // Try to extract document ID
    const idMatch = message.match(/(?:id|document)[:\s]+([a-zA-Z0-9_-]+)/i);
    
    return {
      hasIntent: true,
      action: 'read',
      documentId: idMatch?.[1],
    };
  }

  // Check for append intent
  if (appendKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    // Extract document ID
    const idMatch = message.match(/(?:id|document)[:\s]+([a-zA-Z0-9_-]+)/i);
    
    // Extract content (after "that says", "with", "containing", etc.)
    const contentMatch = message.match(/(?:that says|with|containing|content):\s*(.+?)(?:\s|$)/i);
    const contentFromMessage = message.split(/(?:add|append|write|update)/i)[1]?.split(/(?:to|document|doc)/i)[1]?.trim();

    return {
      hasIntent: true,
      action: 'append',
      documentId: idMatch?.[1],
      content: contentMatch?.[1]?.trim() || contentFromMessage,
    };
  }

  return {
    hasIntent: false,
  };
}

