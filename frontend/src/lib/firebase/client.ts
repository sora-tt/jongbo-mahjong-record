import { getApps, initializeApp, type FirebaseApp } from "firebase/app";

const firebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

const requiredEnvKeys = Object.keys(firebaseEnv) as Array<keyof typeof firebaseEnv>;

export const getMissingFirebaseEnvKeys = () => requiredEnvKeys.filter((key) => !firebaseEnv[key]);

export const hasFirebaseConfig = () => getMissingFirebaseEnvKeys().length === 0;

const getFirebaseConfig = () => {
  const missingKeys = getMissingFirebaseEnvKeys();
  if (missingKeys.length > 0) {
    throw new Error(`Firebase environment variables are missing: ${missingKeys.join(", ")}`);
  }

  return {
    apiKey: firebaseEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: firebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: firebaseEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: firebaseEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };
};

let firebaseApp: FirebaseApp | null = null;

export const getFirebaseApp = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps()[0] ?? initializeApp(getFirebaseConfig());
  return firebaseApp;
};
