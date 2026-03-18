import { ValidationError } from "@/errors.js";

export const ensureString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${field} must be a non-empty string`);
  }

  return value.trim();
};

export const ensureOptionalString = (value: unknown, field: string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return ensureString(value, field);
};

export const ensureStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${field} must be a non-empty array`);
  }

  return value.map((item, index) => ensureString(item, `${field}[${index}]`));
};

export const ensureObject = (value: unknown, field: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${field} must be an object`);
  }

  return value as Record<string, unknown>;
};

export const ensureNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError(`${field} must be a number`);
  }

  return value;
};

export const ensureIsoDateString = (value: unknown, field: string): string => {
  const parsed = ensureString(value, field);
  const date = new Date(parsed);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} must be a valid ISO date string`);
  }

  return date.toISOString();
};
