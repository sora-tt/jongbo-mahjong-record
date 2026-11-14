"use client";

import * as React from "react";

import { AuthProvider } from "@/providers/auth-provider";
import { LoginLoadingProvider } from "@/providers/login-loading-provider";

import { ReduxProvider } from "@/components/providers/ReduxProvider";

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <ReduxProvider>
      <LoginLoadingProvider>
        <AuthProvider>{children}</AuthProvider>
      </LoginLoadingProvider>
    </ReduxProvider>
  );
};
