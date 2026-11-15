import * as React from "react";

import { V2Providers } from "@/components/v2/layout/v2-providers";

const V2Layout = ({ children }: React.PropsWithChildren) => (
  <div className="v2">
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=M+PLUS+2:wght@400;500;600;700&display=swap"
    />
    <V2Providers>{children}</V2Providers>
  </div>
);

export default V2Layout;
