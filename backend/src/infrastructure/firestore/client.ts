import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "@/infrastructure/firebase/app.js";

export const getDb = () => {
  if (
    process.env.USE_FIRESTORE_EMULATOR === "true" &&
    !process.env.FIRESTORE_EMULATOR_HOST
  ) {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";
  }

  return getFirestore(getFirebaseAdminApp());
};
