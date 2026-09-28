"use client";

import * as React from "react";

import { logoutFromApp } from "@/lib/auth/flows";
import { subscribeAuthState, type FirebaseUser } from "@/lib/firebase/auth";
import { hasFirebaseConfig } from "@/lib/firebase/client";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: FirebaseUser | null;
  isLoading: boolean;
  status: AuthStatus;
  logout: () => Promise<void>;
  markUnauthenticated: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleLogout = React.useCallback(async () => {
    await logoutFromApp();
    setUser(null);
  }, []);

  const markUnauthenticated = React.useCallback(() => {
    setUser(null);
  }, []);

  React.useEffect(() => {
    if (!hasFirebaseConfig()) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    void subscribeAuthState((nextUser) => {
      if (!isActive) {
        return;
      }

      setUser(nextUser);
      setIsLoading(false);
    }).then((nextUnsubscribe) => {
      if (!isActive) {
        nextUnsubscribe();
        return;
      }

      unsubscribe = nextUnsubscribe;
    });

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, []);

  const value = {
    user,
    isLoading,
    status: isLoading
      ? ("loading" as const)
      : user
        ? ("authenticated" as const)
        : ("unauthenticated" as const),
    logout: handleLogout,
    markUnauthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
