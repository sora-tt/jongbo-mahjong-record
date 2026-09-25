import assert from "node:assert/strict";
import test from "node:test";
import { validateMatchParticipants } from "@/application/services/matchService.js";

const members = [
  { userId: "u1", userName: "A" },
  { userId: "u2", userName: "B" },
  { userId: "u3", userName: "C" },
  { userId: "u4", userName: "D" },
];

test("accepts exactly the fixed Session member set", () => {
  assert.doesNotThrow(() =>
    validateMatchParticipants(
      members.map(({ userId }) => ({ userId, wind: "east", rawScore: 25000 })),
      members,
    ),
  );
});

test("rejects a Match participant outside the fixed Session member set", () => {
  assert.throws(
    () =>
      validateMatchParticipants(
        [
          { userId: "u1" },
          { userId: "u2" },
          { userId: "u3" },
          { userId: "other" },
        ],
        members,
      ),
    /match participants must match session members/,
  );
});
