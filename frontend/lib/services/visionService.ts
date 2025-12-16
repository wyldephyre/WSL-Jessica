/**
 * Analyze an image for text/context/contact info.
 *
 * NOTE: Vision extraction is currently a stub to keep uploads fast and avoid
 * bundling/operational complexity until the vision provider pipeline is finalized.
 */
export async function analyzeImage(
  _buffer: Buffer,
  _mimeType: string,
  _options?: {
    extractContacts?: boolean;
    extractContext?: boolean;
    provider?: 'auto' | 'groq' | 'gemini' | 'claude';
  }
): Promise<{
  fullText: string;
  contacts?: string;
  context?: string;
  provider: string;
}> {
  return {
    fullText: 'Image received. Vision analysis is not implemented yet.',
    contacts: 'No contact information found.',
    context: 'No visual context extracted.',
    provider: 'none',
  };
}

