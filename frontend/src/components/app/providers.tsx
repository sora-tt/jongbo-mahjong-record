"use client";

import * as React from "react";

import { AuthProvider } from "@/providers/auth-provider";

import { ReduxProvider } from "@/components/providers/ReduxProvider";

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <ReduxProvider>
      <AuthProvider>{children}</AuthProvider>
    </ReduxProvider>
  );
};
