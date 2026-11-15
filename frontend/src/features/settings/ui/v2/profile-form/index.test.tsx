import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import type { ApiUser, UpdateMeInput } from "@/lib/api/contracts";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  self: { configurable: true, value: dom.window },
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});

const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
  import("@/features/settings/ui/v2/account-settings"),
]);
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
});
const profile = {
  name: "一郎",
  username: "ichiro",
  email: "ichiro@example.com",
} as ApiUser;

test("プロフィールの入力を検証し、有効な値を保存する", async () => {
  const [{ render, screen, fireEvent }, { ProfileForm }] = await setup;
  const requests: UpdateMeInput[] = [];
  render(
    <ProfileForm
      profile={profile}
      saving={false}
      error=""
      onSave={async (input) => {
        requests.push(input);
      }}
    />
  );
  fireEvent.change(screen.getByLabelText("表示名"), {
    target: { value: "  " },
  });
  fireEvent.change(screen.getByLabelText("ユーザーネーム"), {
    target: { value: "名前" },
  });
  fireEvent.click(screen.getByRole("button", { name: "変更を保存" }));
  assert.ok(screen.getByText("表示名を入力してください。"));
  assert.ok(screen.getByText("半角英数字・アンダースコアで入力してください。"));
  assert.equal(requests.length, 0);
  fireEvent.change(screen.getByLabelText("表示名"), {
    target: { value: " 太郎 " },
  });
  fireEvent.change(screen.getByLabelText("ユーザーネーム"), {
    target: { value: " taro_1 " },
  });
  fireEvent.click(screen.getByRole("button", { name: "変更を保存" }));
  assert.deepEqual(requests, [{ name: "太郎", username: "taro_1" }]);
});

test("保存中は入力と送信を無効にし、エラーを表示できる", async () => {
  const [{ render, screen }, { ProfileForm }] = await setup;
  render(
    <ProfileForm
      profile={profile}
      saving
      error="保存に失敗しました。"
      onSave={async () => {}}
    />
  );
  assert.equal(
    (screen.getByLabelText("表示名") as HTMLInputElement).disabled,
    true
  );
  assert.equal(
    (screen.getByRole("button", { name: "変更を保存" }) as HTMLButtonElement)
      .disabled,
    true
  );
  assert.ok(screen.getByRole("alert"));
});

test("メールアドレスとパスワードの変更は未実装として無効にする", async () => {
  const [{ render, screen }, , { AccountSettings }] = await setup;
  render(<AccountSettings email={profile.email} />);
  for (const label of ["メールアドレス", "パスワード"]) {
    const button = screen.getByRole("button", {
      name: new RegExp(`${label}（未実装）`),
    }) as HTMLButtonElement;
    assert.equal(button.disabled, true);
  }
});
