import * as React from "react";

import Header from "@/components/layout/header";

type AppShellProps = React.PropsWithChildren<{
  mainClassName?: string;
}>;

export const AppShell: React.FC<AppShellProps> = ({
  children,
  mainClassName,
}) => (
  <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className={mainClassName}>{children}</main>
  </div>
);
