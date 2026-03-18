import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DEFAULT_PROJECT_ID = "jongbo-local";

export const getDb = () => {
  if (getApps().length === 0) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_PROJECT_ID;
    const useEmulator = process.env.USE_FIRESTORE_EMULATOR === "true";

    if (useEmulator && !process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";
    }

    initializeApp(
      useEmulator
        ? { projectId }
        : {
            credential: applicationDefault(),
            projectId,
          }
    );
  }

  return getFirestore();
};
