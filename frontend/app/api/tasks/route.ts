import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, limit as limitQuery, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleApiError, ValidationError } from '@/lib/errors/AppError';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JsonValue }
  | JsonValue[];

function toIsoStringMaybe(value: unknown): string | number | null | unknown {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;

  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.toDate === 'function') {
      try {
        const d = (v.toDate as () => Date)();
        if (d instanceof Date) return d.toISOString();
      } catch {
        // ignore
      }
    }
    if (typeof v.toMillis === 'function') {
      try {
        const ms = (v.toMillis as () => number)();
        if (Number.isFinite(ms)) return new Date(ms).toISOString();
      } catch {
        // ignore
      }
    }
    // Firestore Timestamp-like shape (seconds/nanoseconds)
    if (typeof v.seconds === 'number') {
      return new Date(v.seconds * 1000).toISOString();
    }
  }

  return value;
}

function serializeToJson(value: unknown): JsonValue {
  const normalized = toIsoStringMaybe(value);
  if (normalized == null) return null;
  if (typeof normalized === 'string' || typeof normalized === 'number' || typeof normalized === 'boolean') return normalized;

  if (Array.isArray(normalized)) {
    return normalized.map(serializeToJson);
  }

  if (typeof normalized === 'object') {
    const obj = normalized as Record<string, unknown>;
    const out: Record<string, JsonValue> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = serializeToJson(v);
    }
    return out;
  }

  return String(normalized);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCompleted =
      searchParams.get('includeCompleted') === '1' ||
      searchParams.get('includeCompleted') === 'true' ||
      searchParams.get('showCompleted') === '1' ||
      searchParams.get('showCompleted') === 'true' ||
      searchParams.get('completed') === 'all';

    const limitParam = searchParams.get('limit');
    const limitValue = limitParam ? Number(limitParam) : 100;
    if (!Number.isFinite(limitValue) || limitValue <= 0 || limitValue > 500) {
      throw new ValidationError('Invalid limit. Must be between 1 and 500.');
    }

    const tasksRef = collection(db, 'tasks');

    // Prefer server-side ordering/limit to avoid overfetching.
    // If Firestore complains about missing indexes, we fall back to in-memory sort.
    let docs;
    try {
      const q = includeCompleted
        ? query(tasksRef, orderBy('createdAt', 'desc'), limitQuery(limitValue))
        : query(tasksRef, where('completed', '==', false), orderBy('createdAt', 'desc'), limitQuery(limitValue));
      docs = await getDocs(q);
    } catch (err) {
      console.warn('[API] /api/tasks: query with orderBy failed, falling back to unsorted fetch:', err);
      const q = includeCompleted
        ? query(tasksRef, limitQuery(limitValue))
        : query(tasksRef, where('completed', '==', false), limitQuery(limitValue));
      docs = await getDocs(q);
    }

    const tasks = docs.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          ...(serializeToJson(raw) as Record<string, JsonValue>),
        } as Record<string, JsonValue>;
      })
      // If we had to fall back (no orderBy), do a best-effort sort by createdAt.
      .sort((a, b) => {
        const aCreated = typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : 0;
        const bCreated = typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : 0;
        return bCreated - aCreated;
      });

    return NextResponse.json(
      { success: true, tasks },
      {
        headers: {
          // Light caching helps perceived load time without making tasks feel stale.
          'Cache-Control': 'private, max-age=0, s-maxage=10, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

