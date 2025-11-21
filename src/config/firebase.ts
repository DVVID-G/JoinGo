import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { config, getEnv } from './env';
import { logger } from '../utils/logger';
import fs from 'fs';

interface FirebaseResources {
  app?: App;
  db?: Firestore;
  auth?: Auth;
  initialized: boolean;
}

const resources: FirebaseResources = { initialized: false };

/**
 * Initializes Firebase Admin SDK conditionally based on environment variables.
 * Prefer providing a JSON credentials file via `FIREBASE_CREDENTIALS_JSON_PATH`.
 */
export function initFirebase(): FirebaseResources {
  if (resources.initialized) return resources;

  const jsonPath = getEnv('FIREBASE_CREDENTIALS_JSON_PATH');
  if (jsonPath && fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const app = initializeApp({ credential: cert(parsed as any) });
      resources.app = app;
      resources.db = getFirestore(app);
      resources.auth = getAuth(app);
      resources.initialized = true;
      logger.info('Firebase initialized using JSON credentials file');
      return resources;
    } catch (err) {
      logger.error('Failed to initialize Firebase from JSON file', err);
    }
  }

  const { projectId, clientEmail, privateKey } = config.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase credentials missing, running in degraded mode');
    resources.initialized = false;
    return resources;
  }

  let cleanedKey = privateKey.trim();
  if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
    cleanedKey = cleanedKey.slice(1, -1);
  }
  cleanedKey = cleanedKey.replace(/\r/g, '');

  try {
    const app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey: cleanedKey })
    });
    resources.app = app;
    resources.db = getFirestore(app);
    resources.auth = getAuth(app);
    resources.initialized = true;
    logger.info('Firebase initialized using ENV fields');
  } catch (err) {
    logger.error('Failed to initialize Firebase', err);
    resources.initialized = false;
  }
  return resources;
}

/**
 * Returns Firestore instance if initialized.
 */
export function firebaseDb(): Firestore | undefined {
  return resources.db;
}

/**
 * Returns Auth instance if initialized.
 */
export function firebaseAuth(): Auth | undefined {
  return resources.auth;
}
