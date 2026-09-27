import {
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  WriteResult,
} from "firebase-admin/firestore";
import { asIsoDateString, type IsoDateString } from "@/domain/shared/types.js";

const invalidField = (field: string) =>
  new TypeError(`invalid or missing Firestore field: ${field}`);

export const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== "string") {
    throw invalidField(field);
  }
  return value;
};

export const requiredNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidField(field);
  }
  return value;
};

export const nullableNumber = (value: unknown, field: string): number | null =>
  value === null ? null : requiredNumber(value, field);

export const nullableString = (value: unknown, field: string): string | null =>
  value === null ? null : requiredString(value, field);

export const requiredObject = (
  value: unknown,
  field: string,
): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalidField(field);
  }
  return value as Record<string, unknown>;
};

export const nullableObject = (
  value: unknown,
  field: string,
): Record<string, unknown> | null =>
  value === null ? null : requiredObject(value, field);

export const requiredArray = (value: unknown, field: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw invalidField(field);
  }
  return value;
};

export const toIsoString = (value: unknown): IsoDateString => {
  if (value instanceof Timestamp) {
    return asIsoDateString(value.toDate().toISOString());
  }
  if (value instanceof Date) {
    return asIsoDateString(value.toISOString());
  }
  if (typeof value === "string") {
    return asIsoDateString(value);
  }

  throw new TypeError("expected a Firestore timestamp or ISO date string");
};

export const toTimestamp = (value: string | null | undefined) =>
  value ? Timestamp.fromDate(new Date(value)) : null;

export const mapDocs = <T>(
  docs: QueryDocumentSnapshot<DocumentData>[],
  mapper: (doc: QueryDocumentSnapshot<DocumentData>) => T,
) => docs.map(mapper);

export const awaitWrites = async (writes: Promise<WriteResult>[]) => {
  await Promise.all(writes);
};

export const addDoc = async <T extends DocumentData>(
  collection: CollectionReference<T>,
  data: T,
  id?: string,
) => {
  const ref = id ? collection.doc(id) : collection.doc();
  await ref.set(data);
  return ref.id;
};
