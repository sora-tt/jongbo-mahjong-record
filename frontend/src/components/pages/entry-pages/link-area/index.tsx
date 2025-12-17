import * as React from "react";

import { Spacer } from "@/components/common/ui/spacer";

type LinkAreaProps = {
  children?: React.ReactNode;
  attrs: React.AnchorHTMLAttributes<HTMLAnchorElement>;
};

export const LinkArea: React.FC<LinkAreaProps> = ({ children, attrs }) => {
  return (
    <Spacer className="text-center text-sm">
      <a
        href={attrs.href}
        target={attrs.target}
        className="underline text-zinc-400"
      >
        {children}
      </a>
    </Spacer>
  );
};
