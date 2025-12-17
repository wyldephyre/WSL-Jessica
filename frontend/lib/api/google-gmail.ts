/**
 * Gmail API Client
 * Implementation using Gmail API v1
 */

import { gmail } from 'googleapis';
import { getValidGoogleToken } from './google-oauth';

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  unread?: boolean;
  labels?: string[];
}

export interface GmailMessageDetail extends GmailMessage {
  body?: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
}

export interface GmailListParams {
  query?: string; // Gmail search query (e.g., "is:unread", "from:example@gmail.com")
  maxResults?: number;
  pageToken?: string;
}

/**
 * List Gmail messages
 */
export async function listGmailMessages(
  accessToken: string,
  params: GmailListParams = {}
): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> {
  const auth = {
    access_token: accessToken,
  };

  const gmailClient = gmail({
    version: 'v1',
    auth,
  });

  const response = await gmailClient.users.messages.list({
    userId: 'me',
    q: params.query,
    maxResults: params.maxResults || 10,
    pageToken: params.pageToken,
  });

  if (!response.data.messages || response.data.messages.length === 0) {
    return { messages: [] };
  }

  // Get full message details
  const messagePromises = response.data.messages.map(async (msg) => {
    if (!msg.id) return null;

    const messageResponse = await gmailClient.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'To', 'Date'],
    });

    const message = messageResponse.data;
    const headers = message.payload?.headers || [];
    
    const getHeader = (name: string) => 
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value;

    const labelIds = message.labelIds || [];
    const isUnread = !labelIds.includes('READ');

    return {
      id: message.id || '',
      threadId: message.threadId || '',
      snippet: message.snippet || '',
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      unread: isUnread,
      labels: labelIds,
    } as GmailMessage;
  });

  const messages = (await Promise.all(messagePromises)).filter(
    (msg): msg is GmailMessage => msg !== null
  );

  return {
    messages,
    nextPageToken: response.data.nextPageToken || undefined,
  };
}

/**
 * Get a single Gmail message with full content
 */
export async function getGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessageDetail> {
  const auth = {
    access_token: accessToken,
  };

  const gmailClient = gmail({
    version: 'v1',
    auth,
  });

  const response = await gmailClient.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const message = response.data;
  if (!message) {
    throw new Error('Message not found');
  }

  const headers = message.payload?.headers || [];
  const getHeader = (name: string) => 
    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value;

  // Extract body content
  let body = '';
  let htmlBody = '';

  const extractBody = (part: any): void => {
    if (part.body?.data) {
      const content = Buffer.from(part.body.data, 'base64').toString('utf-8');
      if (part.mimeType === 'text/html') {
        htmlBody += content;
      } else if (part.mimeType === 'text/plain') {
        body += content;
      }
    }

    if (part.parts) {
      part.parts.forEach((p: any) => extractBody(p));
    }
  };

  if (message.payload) {
    extractBody(message.payload);
  }

  const labelIds = message.labelIds || [];
  const isUnread = !labelIds.includes('READ');

  // Extract attachments
  const attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }> = [];

  const extractAttachments = (part: any): void => {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || 'application/octet-stream',
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId,
      });
    }

    if (part.parts) {
      part.parts.forEach((p: any) => extractAttachments(p));
    }
  };

  if (message.payload) {
    extractAttachments(message.payload);
  }

  return {
    id: message.id || '',
    threadId: message.threadId || '',
    snippet: message.snippet || '',
    subject: getHeader('Subject'),
    from: getHeader('From'),
    to: getHeader('To'),
    date: getHeader('Date'),
    unread: isUnread,
    labels: labelIds,
    body: body || undefined,
    htmlBody: htmlBody || undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}

/**
 * Mark a Gmail message as read
 */
export async function markGmailMessageAsRead(
  accessToken: string,
  messageId: string
): Promise<void> {
  const auth = {
    access_token: accessToken,
  };

  const gmailClient = gmail({
    version: 'v1',
    auth,
  });

  await gmailClient.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
}

