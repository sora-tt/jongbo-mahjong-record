import * as React from "react";

import { AppShell } from "@/components/layout/app-shell";

import { InstallGuideContent } from "./install-guide-content";

const InstallPage: React.FC = () => (
  <AppShell mainClassName="min-h-screen bg-background font-jp">
    <InstallGuideContent />
  </AppShell>
);

export default InstallPage;
