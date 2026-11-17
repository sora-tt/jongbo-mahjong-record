"use client";

import * as React from "react";

import { usePathname } from "next/navigation";

import { LoginLoading } from "@/components/ui/login-loading";

const LoginLoadingContext = React.createContext<{
  start: () => void;
  finish: () => void;
} | null>(null);

export const LoginLoadingProvider = ({ children }: React.PropsWithChildren) => {
  const [loading, setLoading] = React.useState(false);
  const pathname = usePathname();
  const start = React.useCallback(() => setLoading(true), []);
  const finish = React.useCallback(() => setLoading(false), []);

  React.useEffect(() => {
    if (loading && !["/login", "/"].includes(pathname)) {
      finish();
    }
  }, [finish, loading, pathname]);

  const value = React.useMemo(() => ({ start, finish }), [start, finish]);
  return (
    <LoginLoadingContext.Provider value={value}>
      {children}
      {loading && <LoginLoading />}
    </LoginLoadingContext.Provider>
  );
};

export const useLoginLoading = () => {
  const context = React.useContext(LoginLoadingContext);
  if (!context)
    throw new Error("useLoginLoading must be used within LoginLoadingProvider");
  return context;
};
