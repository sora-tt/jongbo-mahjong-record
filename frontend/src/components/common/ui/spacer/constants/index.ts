import { GapSize, MarginSize, PaddingSize } from "../types";

export const PADDING_MAP: Record<PaddingSize, string> = {
  "custom-xxsmall": "0.5",
  xxsmall: "1",
  xsmall: "2",
  "custom-small": "2.5",
  small: "3",
  "custom-medium": "3.5",
  medium: "4",
  "custom-large": "4.5",
  large: "5",
  xlarge: "6",
  xxlarge: "8",
  "3xlarge": "10",
  "4xlarge": "12",
  "custom-5xlarge": "13",
  "5xlarge": "14",
  "6xlarge": "16",
  "7xlarge": "18",
  "8xlarge": "20",
  "9xlarge": "22",
  "10xlarge": "24",
  none: "0",
} as const;

export const PADDING_MAP_KEYS = {
  top: "pt",
  bottom: "pb",
  left: "pl",
  right: "pr",
} as const;

export const MARGIN_MAP: Record<MarginSize, string> = {
  auto: "auto",
  "custom-xxsmall": "0.5",
  xxsmall: "1",
  xsmall: "2",
  "custom-small": "2.5",
  small: "3",
  medium: "4",
  large: "5",
  xlarge: "6",
  xxlarge: "8",
  "3xlarge": "10",
  "4xlarge": "12",
  none: "0",
} as const;

export const MARGIN_MAP_KEYS = {
  top: "mt",
  bottom: "mb",
  left: "ml",
  right: "mr",
} as const;

export const GAP_MAP: Record<GapSize, string> = {
  xxxsmall: "1",
  xxsmall: "2",
  xsmall: "3",
  small: "4",
  medium: "5",
  large: "6",
  xlarge: "8",
  xxlarge: "10",
  "3xlarge": "12",
  "4xlarge": "14",
} as const;
