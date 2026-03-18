export type SpacerProps = {
  children?: React.ReactNode;
  // Tailwind風 props
  width?: string; // width
  height?: string; // height
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;

  display?: string;

  backGround?: string;
  rounded?: string | boolean; // "md" / true → "rounded"
  border?: boolean | BorderInfo; // true → border, "gray-300" → border-gray-300

  margin?: MarginSize | MarginInfo;
  padding?: PaddingSize | PaddingInfo;
  gap?: GapSize;

  className?: string;
};

export type PaddingSize =
  | "custom-xxsmall"
  | "xxsmall"
  | "xsmall"
  | "custom-small"
  | "small"
  | "custom-medium"
  | "medium"
  | "custom-large"
  | "large"
  | "xlarge"
  | "xxlarge"
  | "3xlarge"
  | "4xlarge"
  | "custom-5xlarge"
  | "5xlarge"
  | "6xlarge"
  | "7xlarge"
  | "8xlarge"
  | "9xlarge"
  | "10xlarge"
  | "none";

export interface PaddingInfo {
  top?: PaddingSize;
  bottom?: PaddingSize;
  left?: PaddingSize;
  right?: PaddingSize;
}

export type MarginSize =
  | "auto"
  | "custom-xxsmall"
  | "xxsmall"
  | "xsmall"
  | "custom-small"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "xxlarge"
  | "3xlarge"
  | "4xlarge"
  | "none";

export interface MarginInfo {
  top?: MarginSize;
  bottom?: MarginSize;
  left?: MarginSize;
  right?: MarginSize;
}

export type GapSize =
  | "xxxsmall"
  | "xxsmall"
  | "xsmall"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "xxlarge"
  | "3xlarge"
  | "4xlarge";

export type BorderInfo = {
  // TODO: We should prepare border color and width types later.
  color?: string;
  width?: string;
};
