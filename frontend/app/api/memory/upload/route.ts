/**
 * Memory File Upload API
 * Handles file uploads for memories (images, PDFs, documents)
 * Extracts text and stores files in Firebase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';
import { analyzeImage } from '@/lib/services/visionService';
import { requireAuth } from '@/lib/middleware/auth';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/csv',
];

/**
 * Extract text from PDF (basic implementation)
 * For production, use a proper PDF parsing library
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Basic implementation - for production, use pdf-parse or similar
  // For now, return a placeholder
  return '[PDF content - text extraction requires additional library]';
}

/**
 * Extract text and information from image using vision AI
 * Uses Claude or Gemini vision APIs to extract contacts and visual context
 */
async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<{
  extractedText: string;
  contacts?: string;
  context?: string;
  provider?: string;
}> {
  try {
    console.log('[Memory Upload] Analyzing image with vision AI...');
    const analysis = await analyzeImage(buffer, mimeType, {
      extractContacts: true,
      extractContext: true,
      provider: 'auto',
    });
    
    // Format the extracted information for memory storage
    const parts: string[] = [];
    
    if (analysis.contacts && !analysis.contacts.includes('No contact information')) {
      parts.push('CONTACT INFORMATION:');
      parts.push(analysis.contacts);
      parts.push('');
    }
    
    if (analysis.context && !analysis.context.includes('No visual context')) {
      parts.push('VISUAL CONTEXT:');
      parts.push(analysis.context);
    }
    
    const formattedText = parts.length > 0 
      ? parts.join('\n')
      : analysis.fullText || '[Image analyzed - no specific information extracted]';
    
    return {
      extractedText: formattedText,
      contacts: analysis.contacts,
      context: analysis.context,
      provider: analysis.provider,
    };
  } catch (error) {
    console.error('[Memory Upload] Vision analysis failed:', error);
    // Return a fallback message instead of throwing
    return {
      extractedText: `[Image: ${mimeType} - Vision analysis unavailable. Error: ${error instanceof Error ? error.message : String(error)}]`,
    };
  }
}

/**
 * Extract text from document based on type
 * Note: Images are handled separately via extractTextFromImage
 */
async function extractTextFromFile(file: File, buffer: Buffer): Promise<string> {
  if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'text/csv') {
    return new TextDecoder().decode(buffer);
  }
  
  if (file.type === 'application/pdf') {
    return await extractTextFromPDF(buffer);
  }
  
  // Images are handled separately - don't process them here
  // This prevents redundant calls to extractTextFromImage
  
  // For Word documents, we'd need a library like mammoth
  if (file.type.includes('wordprocessingml')) {
    return '[Word document - text extraction requires additional library]';
  }
  
  return '[File content - unable to extract text automatically]';
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth(request);
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') || 'personal';
    const description = formData.get('description') || '';
    
    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Validate file type
    const isValidType = 
      SUPPORTED_IMAGE_TYPES.includes(file.type) || 
      SUPPORTED_DOCUMENT_TYPES.includes(file.type);
    
    if (!isValidType) {
      throw new ValidationError(
        `Unsupported file type: ${file.type}. Supported: images (JPEG, PNG, GIF, WebP), PDFs, and text documents.`
      );
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from file
    let extractedText = '';
    let extractedContacts: string | undefined;
    let extractedContext: string | undefined;
    let visionProvider: string | undefined;
    
    try {
      if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        // Use vision AI for images
        const imageAnalysis = await extractTextFromImage(buffer, file.type);
        extractedText = imageAnalysis.extractedText;
        extractedContacts = imageAnalysis.contacts;
        extractedContext = imageAnalysis.context;
        visionProvider = imageAnalysis.provider;
      } else {
        // Use standard text extraction for documents
        extractedText = await extractTextFromFile(file, buffer);
      }
    } catch (error) {
      console.warn('[Memory Upload] Text extraction failed:', error);
      extractedText = `[File: ${file.name} - Text extraction unavailable]`;
    }

    // Upload file to Firebase Storage
    // Note: Firebase Storage client SDK has limitations in server-side API routes
    // If upload fails, we'll continue without the file URL
    let downloadURL: string | null = null;
    let storagePath: string | null = null;
    
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      storagePath = `memories/${userId}/${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, buffer, {
        contentType: file.type,
      });

      // Get download URL
      downloadURL = await getDownloadURL(storageRef);
      console.log('[Memory Upload] File uploaded to Firebase Storage:', storagePath);
    } catch (storageError) {
      console.warn('[Memory Upload] Firebase Storage upload failed (continuing without file URL):', storageError);
      // Continue without storage - we still have the extracted text
      // The memory will be saved with extracted text but no file URL
    }

    // Prepare memory content
    const memoryContent = description 
      ? `${description}\n\n[Attached file: ${file.name}]\n${extractedText}`
      : `[Attached file: ${file.name}]\n${extractedText}`;

    return NextResponse.json({
      success: true,
      fileUrl: downloadURL || null,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      extractedText,
      memoryContent,
      context,
      storagePath: storagePath || null,
      // Vision analysis results (if image)
      contacts: extractedContacts,
      visualContext: extractedContext,
      visionProvider,
      storageUploaded: !!downloadURL,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

