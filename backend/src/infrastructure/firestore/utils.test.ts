import assert from "node:assert/strict";
import test from "node:test";
import {
  nullableNumber,
  requiredNumber,
  requiredObject,
  requiredString,
} from "@/infrastructure/firestore/utils.js";

test("Firestore field helpers reject missing or invalid required values", () => {
  assert.throws(() => requiredString(undefined, "users.name"), TypeError);
  assert.throws(() => requiredNumber("0", "users.count"), TypeError);
  assert.throws(() => requiredObject([], "users.profile"), TypeError);
});

test("nullable Firestore fields accept null and validate non-null values", () => {
  assert.equal(nullableNumber(null, "stats.current_rank"), null);
  assert.equal(nullableNumber(2, "stats.current_rank"), 2);
  assert.throws(
    () => nullableNumber(undefined, "stats.current_rank"),
    TypeError,
  );
});
