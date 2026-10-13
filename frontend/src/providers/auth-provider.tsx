"use client";

import * as React from "react";

import { usePathname, useRouter } from "next/navigation";

import { logoutFromApp } from "@/lib/auth/flows";
import { logAuthDebug } from "@/lib/debug/auth-debug";
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
  const router = useRouter();
  const pathname = usePathname();
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

      logAuthDebug("authProvider:state-changed", {
        pathname,
        hasUser: Boolean(nextUser),
        emailVerified: nextUser?.emailVerified ?? null,
      });

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

  React.useEffect(() => {
    if (!user || pathname === "/verify-email") {
      return;
    }

    if (pathname === "/login" || pathname === "/signup") {
      return;
    }

    if (user.emailVerified) {
      logAuthDebug("authProvider:skip-redirect", {
        pathname,
        reason: "emailVerified=true",
      });
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        logAuthDebug("authProvider:verify-before-redirect", {
          pathname,
          uid: user.uid,
          emailVerified: user.emailVerified,
        });
        await user.reload();
        const idTokenResult = await user.getIdTokenResult(true);
        const isEmailVerified =
          user.emailVerified || idTokenResult.claims.email_verified === true;

        logAuthDebug("authProvider:verify-result", {
          pathname,
          emailVerifiedProperty: user.emailVerified,
          emailVerifiedClaim: idTokenResult.claims.email_verified === true,
          isEmailVerified,
        });

        if (!isActive || isEmailVerified) {
          return;
        }

        logAuthDebug(
          "authProvider:redirect-verify-email",
          {
            pathname,
            reason: "still unverified",
          },
          "warn"
        );
        router.replace("/verify-email");
      } catch (error) {
        if (!isActive) {
          return;
        }

        logAuthDebug(
          "authProvider:verify-error",
          {
            pathname,
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                  }
                : error,
          },
          "error"
        );

        router.replace("/verify-email");
      }
    })();

    return () => {
      isActive = false;
    };
  }, [pathname, router, user]);

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
