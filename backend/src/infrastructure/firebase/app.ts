import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";

const DEFAULT_PROJECT_ID = "jongbo-local";
const FIREBASE_SERVICE_ACCOUNT_KEY = "FIREBASE_SERVICE_ACCOUNT_KEY";

type RawServiceAccount = ServiceAccount & {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

const getProjectId = () =>
  process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_PROJECT_ID;

const getServiceAccount = (): ServiceAccount | null => {
  const raw = process.env[FIREBASE_SERVICE_ACCOUNT_KEY];

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as RawServiceAccount;
    const clientEmail = parsed.clientEmail ?? parsed.client_email;
    const privateKey = parsed.privateKey ?? parsed.private_key;
    const projectId = parsed.projectId ?? parsed.project_id;

    if (!clientEmail || !privateKey) {
      throw new Error("clientEmail or privateKey is missing");
    }

    return {
      ...parsed,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
      projectId,
    };
  } catch (error) {
    throw new Error(
      `Invalid ${FIREBASE_SERVICE_ACCOUNT_KEY}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const getFirebaseAdminApp = (): App => {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = getProjectId();
  const useEmulator = process.env.USE_FIRESTORE_EMULATOR === "true";

  if (useEmulator) {
    return initializeApp({ projectId });
  }

  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId ?? projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
};
