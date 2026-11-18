import assert from "node:assert/strict";
import test from "node:test";
import type { Firestore } from "firebase-admin/firestore";
import type { UserRepository } from "@/domain/user/repository.js";
import { ConflictError } from "@/domain/shared/errors.js";
import { FirestoreLeagueRepository } from "@/infrastructure/firestore/repositories/leagueRepository.js";

test("league updates reject an old edit version without replacing newer members", async () => {
  let stored: Record<string, unknown> = { rule_locked: false };
  let members = ["owner"];
  const collection = { doc: () => ({}) };
  const leagueRef = { collection: () => collection };
  const transaction = {
    get: async (ref: unknown) =>
      ref === leagueRef
        ? { exists: true, data: () => stored }
        : { docs: members.map((userId) => ({ ref: { userId } })) },
    update: (_ref: unknown, patch: Record<string, unknown>) => {
      stored = { ...stored, ...patch };
    },
    delete: (ref: { userId: string }) => {
      members = members.filter((id) => id !== ref.userId);
    },
    set: (_ref: unknown, data: { user_id: string }) => {
      members.push(data.user_id);
    },
  };
  const db = {
    collection: () => ({ doc: () => leagueRef }),
    runTransaction: async (fn: (tx: typeof transaction) => Promise<void>) =>
      fn(transaction),
  } as unknown as Firestore;
  const users = {
    getByIds: async (ids: string[]) => ids.map((id) => ({ id, name: id })),
  } as unknown as UserRepository;
  const repo = new FirestoreLeagueRepository(db, users);
  repo.get = async () => ({}) as never;

  await repo.update("league", {
    expectedEditVersion: 0,
    memberUserIds: ["owner", "added"],
  });
  assert.equal(stored.edit_version, 1);
  await assert.rejects(
    repo.update("league", { expectedEditVersion: 0, memberUserIds: ["owner"] }),
    (error: unknown) =>
      error instanceof ConflictError &&
      error.details?.reason === "league_updated",
  );
  assert.deepEqual(members, ["owner", "added"]);
});
