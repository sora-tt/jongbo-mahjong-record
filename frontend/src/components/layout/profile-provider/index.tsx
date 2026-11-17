"use client";

import * as React from "react";

import { useAuth } from "@/providers/auth-provider";
import { ProfileNameProvider } from "@/providers/profile-name-provider";

export const ProfileProvider = ({ children }: React.PropsWithChildren) => {
  const { user } = useAuth();

  return (
    <ProfileNameProvider
      userId={user?.uid ?? null}
      fallbackName={user?.displayName ?? null}
    >
      {children}
    </ProfileNameProvider>
  );
};
