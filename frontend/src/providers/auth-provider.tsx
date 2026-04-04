"use client";

import * as React from "react";
import { hasFirebaseConfig } from "@/lib/firebase/client";
import { logout, subscribeAuthState, type FirebaseUser } from "@/lib/firebase/auth";

type AuthContextValue = {
  user: FirebaseUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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
    logout,
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
