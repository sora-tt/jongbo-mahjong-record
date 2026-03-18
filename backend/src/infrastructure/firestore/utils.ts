import {
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  WriteResult,
} from "firebase-admin/firestore";

export const toIsoString = (value: unknown): string => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return new Date(value).toISOString();
  }

  return new Date(0).toISOString();
};

export const toTimestamp = (value: string | null | undefined) =>
  value ? Timestamp.fromDate(new Date(value)) : null;

export const mapDocs = <T>(docs: QueryDocumentSnapshot<DocumentData>[], mapper: (doc: QueryDocumentSnapshot<DocumentData>) => T) =>
  docs.map(mapper);

export const awaitWrites = async (writes: Promise<WriteResult>[]) => {
  await Promise.all(writes);
};

export const addDoc = async <T extends DocumentData>(
  collection: CollectionReference<T>,
  data: T,
  id?: string
) => {
  const ref = id ? collection.doc(id) : collection.doc();
  await ref.set(data);
  return ref.id;
};
