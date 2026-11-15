import * as React from "react";

import clsx from "clsx";
import { User } from "lucide-react";

import { IconContainer } from "@/components/v2/ui/icon-container";

const sizes = {
  sm: "!size-8 text-v2-label",
  md: "!size-11 text-v2-body",
  lg: "!size-12 text-v2-heading-2",
} as const;

export const getAvatarInitial = (name?: string | null) => {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  if (typeof Intl.Segmenter === "function") {
    return (
      new Intl.Segmenter(undefined, { granularity: "grapheme" })
        .segment(trimmed)
        [Symbol.iterator]()
        .next().value?.segment ?? null
    );
  }
  return Array.from(trimmed)[0] ?? null;
};

export const Avatar = ({
  name,
  size = "md",
  className,
  ...props
}: Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
  name?: string | null;
  size?: keyof typeof sizes;
}) => {
  const initial = getAvatarInitial(name);
  return (
    <IconContainer
      {...props}
      circle
      tone="plain"
      role="img"
      aria-label={
        props["aria-label"] ??
        (name?.trim() ? `${name.trim()}のアバター` : "アバター")
      }
      className={clsx(
        "border border-v2-border !bg-v2-surface font-bold",
        sizes[size],
        className
      )}
    >
      {initial ?? <User size={20} aria-hidden="true" />}
    </IconContainer>
  );
};
