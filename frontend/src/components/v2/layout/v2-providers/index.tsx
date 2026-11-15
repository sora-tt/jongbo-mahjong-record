"use client";

import * as React from "react";

import { useAuth } from "@/providers/auth-provider";
import { V2ProfileNameProvider } from "@/providers/v2-profile-name-provider";

export const V2Providers = ({ children }: React.PropsWithChildren) => {
  const { user } = useAuth();

  return (
    <V2ProfileNameProvider
      userId={user?.uid ?? null}
      fallbackName={user?.displayName ?? null}
    >
      {children}
    </V2ProfileNameProvider>
  );
};
