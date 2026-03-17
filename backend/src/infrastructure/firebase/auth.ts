import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const DEFAULT_PROJECT_ID = "jongbo-local";

export const getAdminAuth = () => {
  if (getApps().length === 0) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_PROJECT_ID;
    initializeApp({ projectId });
  }

  return getAuth();
};
