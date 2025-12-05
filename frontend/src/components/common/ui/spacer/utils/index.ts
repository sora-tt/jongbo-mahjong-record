import { BorderInfo, SpacerProps } from "../types";

export const applyDirectionalMap = <T extends string, U extends string>({
  info,
  mapKeys,
  sizeMap,
  singlePrefix,
}: {
  info: T | Record<string, any> | undefined;
  mapKeys: Record<string, string>;
  sizeMap: Record<T, U>;
  singlePrefix: "p" | "m";
}): string[] => {
  if (info === undefined) return [];

  if (typeof info === "string") {
    return [`${singlePrefix}-${sizeMap[info as T]}`];
  }

  return Object.entries(mapKeys)
    .filter(([key]) => info[key] !== undefined)
    .map(([key, prefix]) => {
      const size = info[key];
      return `${prefix}-${sizeMap[size as T]}`;
    });
};

export const applyBorder = (border?: boolean | BorderInfo): string[] => {
  if (border === undefined) return [];

  if (typeof border === "boolean") {
    if (border) {
      return ["border"];
    }
    return [];
  }

  const classes: string[] = [];

  if (border.width !== undefined) {
    classes.push(`border-${border.width}`);
  } else {
    classes.push("border");
  }

  if (border.color) {
    classes.push(`border-${border.color}`);
  }

  return classes;
};

export const applyDimensions = (props: SpacerProps): string[] => {
  const classes = [];

  if (props.width) classes.push(`w-${props.width}`);
  if (props.height) classes.push(`h-${props.height}`);

  if (props.minWidth) classes.push(`min-w-${props.minWidth}`);
  if (props.minHeight) classes.push(`min-h-${props.minHeight}`);

  if (props.maxWidth) classes.push(`max-w-${props.maxWidth}`);
  if (props.maxHeight) classes.push(`max-h-${props.maxHeight}`);

  return classes;
};
