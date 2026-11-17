import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

import { ApiError } from "@/lib/api/core";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  self: { configurable: true, value: dom.window },
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
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
  this.dispatchEvent(new dom.window.Event("close"));
};
const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
]);
afterEach(async () => (await setup)[0].cleanup());

test("確認するまで削除せず、成功時に画面を移動する", async () => {
  const [
    { render, screen, fireEvent, within, waitFor },
    { LeagueDeleteControl },
  ] = await setup;
  let calls = 0;
  let deleted = false;
  render(
    <LeagueDeleteControl
      onDelete={async () => {
        calls++;
      }}
      onVerify={async () => {}}
      onDeleted={() => {
        deleted = true;
      }}
      onAuthenticationError={() => {}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "リーグを削除" }));
  let dialog = screen.getByRole("dialog", { name: "リーグを削除しますか？" });
  assert.match(dialog.textContent ?? "", /シーズンと対局記録も削除/);
  fireEvent.click(within(dialog).getByRole("button", { name: "キャンセル" }));
  assert.equal(calls, 0);
  assert.equal(screen.queryByRole("dialog"), null);
  fireEvent.click(screen.getByRole("button", { name: "リーグを削除" }));
  dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "削除する" }));
  await waitFor(() => assert.equal(deleted, true));
  assert.equal(calls, 1);
});

test("削除結果を確認できない場合は状態の確認を案内する", async () => {
  const [
    { render, screen, fireEvent, within, waitFor },
    { LeagueDeleteControl },
  ] = await setup;
  let deleted = false;
  render(
    <LeagueDeleteControl
      onDelete={async () => {
        throw new Error("network");
      }}
      onVerify={async () => {
        throw new Error("network");
      }}
      onDeleted={() => {
        deleted = true;
      }}
      onAuthenticationError={() => {}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "リーグを削除" }));
  const dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "削除する" }));
  await waitFor(() =>
    assert.match(
      within(dialog).getByRole("alert").textContent ?? "",
      /リーグの状態を確認/
    )
  );
  assert.equal(deleted, false);
});

test("シーズン削除でも影響範囲を表示し、確認後に削除する", async () => {
  const [{ render, screen, fireEvent, within, waitFor }] = await setup;
  const { DeleteResourceControl } =
    await import("@/components/v2/ui/delete-resource-control");
  let calls = 0;
  let deleted = false;
  render(
    <DeleteResourceControl
      resourceName="シーズン"
      description="シーズン内の対局記録も削除され、元に戻せません。"
      uncertainMessage="リーグ画面からシーズンの状態を確認してください。"
      onDelete={async () => {
        calls++;
      }}
      onVerify={async () => {}}
      onDeleted={() => {
        deleted = true;
      }}
      onAuthenticationError={() => {}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "シーズンを削除" }));
  const dialog = screen.getByRole("dialog", {
    name: "シーズンを削除しますか？",
  });
  assert.match(dialog.textContent ?? "", /対局記録も削除/);
  assert.equal(calls, 0);
  fireEvent.click(within(dialog).getByRole("button", { name: "削除する" }));
  await waitFor(() => assert.equal(deleted, true));
  assert.equal(calls, 1);
});

test("削除結果を確認できるまで再削除を防ぎ、存在を確認後に再試行できる", async () => {
  const [
    { render, screen, fireEvent, within, waitFor },
    { LeagueDeleteControl },
  ] = await setup;
  let deletes = 0;
  let checks = 0;
  render(
    <LeagueDeleteControl
      onDelete={async () => {
        deletes++;
        throw new Error("timeout");
      }}
      onVerify={async () => {
        checks++;
        if (checks === 1) throw new Error("offline");
      }}
      onDeleted={() => {
        throw new Error("unexpected navigation");
      }}
      onAuthenticationError={() => {}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "リーグを削除" }));
  let dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "削除する" }));
  await waitFor(() => assert.equal(checks, 1));
  await waitFor(() =>
    assert.equal(
      (
        within(dialog).getByRole("button", {
          name: "削除する",
        }) as HTMLButtonElement
      ).disabled,
      true
    )
  );
  fireEvent.click(within(dialog).getByRole("button", { name: "キャンセル" }));
  fireEvent.click(screen.getByRole("button", { name: "リーグを削除" }));
  dialog = screen.getByRole("dialog");
  assert.equal(
    (
      within(dialog).getByRole("button", {
        name: "削除する",
      }) as HTMLButtonElement
    ).disabled,
    true
  );
  fireEvent.click(within(dialog).getByRole("button", { name: "状態を再確認" }));
  await waitFor(() =>
    assert.equal(
      (
        within(dialog).getByRole("button", {
          name: "削除する",
        }) as HTMLButtonElement
      ).disabled,
      false
    )
  );
  assert.equal(deletes, 1);
  assert.match(
    within(dialog).getByRole("alert").textContent ?? "",
    /削除は完了していません/
  );
});

test("削除後の確認で対象が見つからなければ削除成功として移動する", async () => {
  const [
    { render, screen, fireEvent, within, waitFor },
    { LeagueDeleteControl },
  ] = await setup;
  let deleted = false;
  render(
    <LeagueDeleteControl
      onDelete={async () => {
        throw new Error("timeout");
      }}
      onVerify={async () => {
        throw new ApiError("not found", 404);
      }}
      onDeleted={() => {
        deleted = true;
      }}
      onAuthenticationError={() => {}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "リーグを削除" }));
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "削除する",
    })
  );
  await waitFor(() => assert.equal(deleted, true));
});
