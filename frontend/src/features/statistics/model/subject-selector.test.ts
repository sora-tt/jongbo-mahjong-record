import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import { getStatisticsSubjectSelectorModel } from "./subject-selector";

const members = [
  { userId: "viewer-1", userName: "Tatsuya" },
  { userId: "target-1", userName: "Hanako" },
];

test("overall scope hides the selector and always identifies the viewer", () => {
  const model = getStatisticsSubjectSelectorModel({
    scopeType: "overall",
    viewerUserId: "viewer-1",
    targetUserId: "target-1",
    userName: "Tatsuya",
    members,
    membersStatus: "ready",
  });

  strictEqual(model.visible, false);
  strictEqual(model.selectedUserId, "viewer-1");
  strictEqual(model.selectedUserName, "Tatsuya");
  strictEqual(model.isViewingSelf, true);
  deepStrictEqual(model.candidateOptions, []);
});

test("ready league roster exposes only unique API candidates and identifies the target", () => {
  const model = getStatisticsSubjectSelectorModel({
    scopeType: "league",
    viewerUserId: "viewer-1",
    targetUserId: "target-1",
    userName: "Tatsuya",
    members: [...members, members[1]],
    membersStatus: "ready",
  });

  strictEqual(model.visible, true);
  strictEqual(model.selectedUserId, "target-1");
  strictEqual(model.selectedUserName, "Hanako");
  strictEqual(model.isViewingSelf, false);
  strictEqual(model.canChangeTarget, true);
  deepStrictEqual(model.candidateOptions, members);
});

test("untrusted member state falls back to the viewer and blocks target changes", () => {
  for (const membersStatus of ["idle", "loading", "error"] as const) {
    const model = getStatisticsSubjectSelectorModel({
      scopeType: "season",
      viewerUserId: "viewer-1",
      targetUserId: "target-1",
      userName: "Tatsuya",
      members,
      membersStatus,
    });

    strictEqual(model.selectedUserId, "viewer-1");
    strictEqual(model.selectedUserName, "Tatsuya");
    strictEqual(model.isViewingSelf, true);
    strictEqual(model.canChangeTarget, false);
    deepStrictEqual(model.candidateOptions, []);
    strictEqual(model.isLoading, membersStatus !== "error");
    strictEqual(model.membersError, membersStatus === "error");
  }
});

test("a target missing from a ready scope falls back to the viewer", () => {
  const model = getStatisticsSubjectSelectorModel({
    scopeType: "season",
    viewerUserId: "viewer-1",
    targetUserId: "target-outside-scope",
    userName: "Tatsuya",
    members,
    membersStatus: "ready",
  });

  strictEqual(model.selectedUserId, "viewer-1");
  strictEqual(model.selectedUserName, "Tatsuya");
  strictEqual(model.isViewingSelf, true);
  strictEqual(model.canChangeTarget, true);
  deepStrictEqual(model.candidateOptions, members);
});

test("a ready empty roster keeps an identifiable viewer fallback without choices", () => {
  const model = getStatisticsSubjectSelectorModel({
    scopeType: "league",
    viewerUserId: "viewer-1",
    targetUserId: "viewer-1",
    userName: "Tatsuya",
    members: [],
    membersStatus: "ready",
  });

  strictEqual(model.selectedUserId, "viewer-1");
  strictEqual(model.selectedUserName, "Tatsuya");
  strictEqual(model.canChangeTarget, false);
  deepStrictEqual(model.candidateOptions, []);
});
