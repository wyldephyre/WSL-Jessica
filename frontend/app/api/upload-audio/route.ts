import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 }
      );
    }

    console.log('Attempting to save to Firestore...');
    console.log('File:', file.name, 'Size:', file.size);

    // Save metadata to Firestore with timeout (reduced to 15 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore operation timed out. Check: 1) Firestore is enabled in Firebase Console 2) Security rules allow writes 3) Network connectivity')), 15000);
    });

    const docRef = await Promise.race([
      addDoc(collection(db, 'audio-files'), {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: serverTimestamp(),
        processed: false,
        status: 'uploaded'
      }),
      timeoutPromise
    ]) as { id: string };

    console.log('Firestore document created:', docRef.id);

    return NextResponse.json({
      success: true,
      docId: docRef.id,
      fileName: file.name
    });

  } catch (error: unknown) {
    console.error('Upload API error:', error);
    const err = error as { code?: string; message?: string };
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    // Provide helpful error messages
    let errorMessage = err.message || 'Upload failed';
    if (err.code === 'permission-denied') {
      errorMessage = 'Permission denied. Firestore security rules may be blocking writes.';
    } else if (err.code === 'unavailable') {
      errorMessage = 'Firestore is unavailable. Check if Firestore is enabled in Firebase Console.';
    } else if (err.message?.includes('timed out')) {
      errorMessage = err.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        code: err.code || 'unknown',
        details: 'Check browser console and Firebase Console for more details'
      },
      { status: 500 }
    );
  }
}

