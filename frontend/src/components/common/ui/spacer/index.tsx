import * as React from "react";

import clsx from "clsx";

import {
  GAP_MAP,
  MARGIN_MAP,
  MARGIN_MAP_KEYS,
  PADDING_MAP,
  PADDING_MAP_KEYS,
} from "./constants";
import {
  GapSize,
  MarginInfo,
  MarginSize,
  PaddingInfo,
  PaddingSize,
  SpacerProps,
} from "./types";
import { applyBorder, applyDimensions, applyDirectionalMap } from "./utils";

/**
 * Spacer component to add spacing, padding, margin, and other layout styles.
 *
 * Gap between children can be set using the `gap` prop.
 * Note: The `gap` prop only works **when display is set to flex or grid**.
 *
 * @component
 * @example
 * <Spacer padding="medium" margin={{ top: "small", bottom: "small" }}>
 *  Content goes here
 * </Spacer>
 *
 * @example
 * <Spacer display="flex flex-col" gap="small">
 *  <Child1 />
 *  <Child2 />
 * </Spacer>
 *
 * @param {SpacerProps} props - Props for the Spacer component.
 * @returns {JSX.Element} The rendered Spacer component.
 */
export const Spacer: React.FC<SpacerProps> = (props: SpacerProps) => {
  const {
    padding,
    margin,
    border,
    display,
    backGround,
    rounded,
    gap,
    className,
    children,
  } = props;

  const classes = clsx(
    applyDirectionalMap<PaddingSize, string>({
      info: padding as PaddingSize | PaddingInfo | undefined,
      mapKeys: PADDING_MAP_KEYS,
      sizeMap: PADDING_MAP,
      singlePrefix: "p",
    }),
    applyDirectionalMap<MarginSize, string>({
      info: margin as MarginSize | MarginInfo | undefined,
      mapKeys: MARGIN_MAP_KEYS,
      sizeMap: MARGIN_MAP,
      singlePrefix: "m",
    }),
    applyBorder(border),
    applyDimensions(props),

    display && `${display}`,
    backGround && `bg-${backGround}`,
    rounded === true ? "rounded" : rounded ? `rounded-${rounded}` : null,
    gap && `gap-${GAP_MAP[gap as GapSize]}`,

    className
  );

  return <div className={classes}>{children}</div>;
};
