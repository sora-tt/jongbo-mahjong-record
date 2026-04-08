import {
  createMe,
  createSession,
  deleteSession,
  fetchMe,
} from "@/lib/api/client";
import { loginWithEmail, logout, signupWithEmail } from "@/lib/firebase/auth";

export const loginToApp = async (input: {
  email: string;
  password: string;
}) => {
  const credential = await loginWithEmail(input.email, input.password);
  await createSession(await credential.user.getIdToken());
  return fetchMe();
};

export const signupToApp = async (input: {
  email: string;
  password: string;
  name: string;
  username: string;
}) => {
  const credential = await signupWithEmail({
    email: input.email,
    password: input.password,
    displayName: input.name,
  });

  await createSession(await credential.user.getIdToken());
  return createMe({ name: input.name, username: input.username });
};

export const logoutFromApp = async () => {
  await deleteSession();
  await logout();
};
