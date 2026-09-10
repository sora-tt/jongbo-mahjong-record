import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp } from "@/infrastructure/firebase/app.js";

export const getAdminAuth = () => {
  return getAuth(getFirebaseAdminApp());
};
