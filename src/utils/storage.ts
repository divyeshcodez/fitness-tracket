import { SessionRecord } from '../types';

const DB_NAME = 'motionlens_db';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;
const WEIGHT_STORAGE_KEY = 'motionlens_user_weight';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a completed workout session
 */
export async function saveSession(session: SessionRecord): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback to localStorage
    console.warn('Falling back to localStorage for session storage:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('motionlens_sessions_fallback') || '[]');
      existing.unshift(session);
      localStorage.setItem('motionlens_sessions_fallback', JSON.stringify(existing.slice(0, 50)));
    } catch {
      // ignore
    }
  }
}

/**
 * Retrieve all past workout sessions sorted by timestamp descending
 */
export async function getAllSessions(): Promise<SessionRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: SessionRecord[] = req.result || [];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for getAllSessions:', err);
    try {
      const existing: SessionRecord[] = JSON.parse(
        localStorage.getItem('motionlens_sessions_fallback') || '[]'
      );
      existing.sort((a, b) => b.timestamp - a.timestamp);
      return existing;
    } catch {
      return [];
    }
  }
}

/**
 * Permanently delete all saved sessions
 */
export async function deleteAllSessions(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error clearing IndexedDB:', err);
  }
  localStorage.removeItem('motionlens_sessions_fallback');
}

/**
 * Export all sessions as formatted JSON string
 */
export async function exportAllSessionsAsJson(): Promise<string> {
  const sessions = await getAllSessions();
  return JSON.stringify(sessions, null, 2);
}

/**
 * Persist user preference for weight and unit
 */
export function saveUserWeightPref(weight: number, unit: 'kg' | 'lb'): void {
  try {
    localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify({ weight, unit }));
  } catch {
    // ignore
  }
}

export function getUserWeightPref(): { weight: number; unit: 'kg' | 'lb' } {
  try {
    const raw = localStorage.getItem(WEIGHT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.weight === 'number' && (parsed.unit === 'kg' || parsed.unit === 'lb')) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return { weight: 70, unit: 'kg' };
}
