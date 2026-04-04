"use client";

import * as React from "react";
import { AuthProvider } from "@/providers/auth-provider";

export const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
