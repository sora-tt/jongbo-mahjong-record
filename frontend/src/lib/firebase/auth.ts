import {
  browserSessionPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { getFirebaseApp } from "@/lib/firebase/client";

export type AuthStateListener = Parameters<typeof onAuthStateChanged>[1];

let authEmulatorConfigured = false;
let authInitPromise: Promise<void> | null = null;

const getFirebaseAuth = () => getAuth(getFirebaseApp());

const ensureFirebaseAuthInitialized = async () => {
  if (authInitPromise) {
    await authInitPromise;
    return getFirebaseAuth();
  }

  const auth = getFirebaseAuth();

  authInitPromise = (async () => {
    if (
      !authEmulatorConfigured &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL
    ) {
      connectAuthEmulator(
        auth,
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL,
        {
          disableWarnings: true,
        }
      );
      authEmulatorConfigured = true;
    }

    await setPersistence(auth, browserSessionPersistence);
  })();

  await authInitPromise;
  return auth;
};

export const subscribeAuthState = async (listener: AuthStateListener) =>
  onAuthStateChanged(await ensureFirebaseAuthInitialized(), listener);

export const loginWithEmail = async (email: string, password: string) =>
  signInWithEmailAndPassword(
    await ensureFirebaseAuthInitialized(),
    email,
    password
  );

export const logout = async () =>
  signOut(await ensureFirebaseAuthInitialized());

export const getCurrentUser = async () =>
  (await ensureFirebaseAuthInitialized()).currentUser;

export const getCurrentIdToken = async (forceRefresh = false) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  return currentUser.getIdToken(forceRefresh);
};

export const signupWithEmail = async (input: {
  email: string;
  password: string;
  displayName?: string;
}) => {
  const credential = await createUserWithEmailAndPassword(
    await ensureFirebaseAuthInitialized(),
    input.email,
    input.password
  );
  if (input.displayName?.trim()) {
    await updateProfile(credential.user, {
      displayName: input.displayName.trim(),
    });
  }

  return credential;
};

export type FirebaseUser = User;
