import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { JSDOM } from "jsdom";

import { ApiError } from "@/lib/api/core";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
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
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, writable: true, value: true },
});
const setup = Promise.all([
  import("@testing-library/react"),
  import("./index"),
]);
afterEach(async () => (await setup)[0].cleanup());

test("登録直後は再送せず待機し、再送のクールダウンを表示する", async () => {
  const [{ renderHook, waitFor }, { createUseEmailVerification }] = await setup;
  let sent = 0;
  const user = { emailVerified: false, reload: async () => {} };
  const useVerification = createUseEmailVerification({
    getCurrentUser: async () => user as never,
    send: async () => {
      sent++;
      return user as never;
    },
    confirm: async () => ({}) as never,
    refreshSession: async () => ({}) as never,
  });
  const { result } = renderHook(() => useVerification("sent=1"));
  await waitFor(() => assert.equal(result.current.status, "pending"));
  assert.equal(sent, 0);
  assert.equal(result.current.retryAfterSeconds, 60);
});

test("認証済みで戻った場合は再送せず完了を表示する", async () => {
  const [{ renderHook, waitFor }, { createUseEmailVerification }] = await setup;
  let sent = 0;
  const user = {
    emailVerified: true,
    reload: async () => {},
    getIdToken: async (force: boolean) => {
      assert.equal(force, true);
      return "fresh-token";
    },
  };
  const tokens: string[] = [];
  const useVerification = createUseEmailVerification({
    getCurrentUser: async () => user as never,
    send: async () => {
      sent++;
      return user as never;
    },
    confirm: async () => ({}) as never,
    refreshSession: async (token) => {
      tokens.push(token);
      return {} as never;
    },
  });
  const { result } = renderHook(() => useVerification(""));
  await waitFor(() => assert.equal(result.current.status, "success"));
  assert.equal(sent, 0);
  assert.deepEqual(tokens, ["fresh-token"]);
});

test("認証コードの確認と認証メールの再送を行う", async () => {
  const [{ renderHook, waitFor, act }, { createUseEmailVerification }] =
    await setup;
  const user = { emailVerified: false, reload: async () => {} };
  const codes: string[] = [];
  let sent = 0;
  const useVerification = createUseEmailVerification({
    getCurrentUser: async () => user as never,
    send: async (target) => {
      assert.equal(target, user);
      sent++;
      return user as never;
    },
    confirm: async (code) => {
      codes.push(code);
      return {} as never;
    },
    refreshSession: async () => ({}) as never,
  });
  const { result } = renderHook(() =>
    useVerification("mode=verify&oobCode=abc")
  );
  await waitFor(() => assert.equal(result.current.status, "success"));
  assert.deepEqual(codes, ["abc"]);
  await act(async () => {
    await result.current.resend();
  });
  assert.equal(sent, 1);
  assert.equal(result.current.status, "pending");
});

test("認証コードがない場合は失敗を表示する", async () => {
  const [{ renderHook, waitFor }, { createUseEmailVerification }] = await setup;
  const useVerification = createUseEmailVerification({
    getCurrentUser: async () => null,
    send: async () => {
      throw new Error("unexpected");
    },
    confirm: async () => {
      throw new Error("unexpected");
    },
    refreshSession: async () => ({}) as never,
  });
  const { result } = renderHook(() => useVerification("mode=verify"));
  await waitFor(() => assert.equal(result.current.status, "error"));
  assert.match(result.current.error ?? "", /認証コード/);
});

test("再送制限時は指定された待機時間を使う", async () => {
  const [{ renderHook, waitFor }, { createUseEmailVerification }] = await setup;
  const user = { emailVerified: false, reload: async () => {} };
  const useVerification = createUseEmailVerification({
    getCurrentUser: async () => user as never,
    send: async () => {
      throw new ApiError("too many requests", 429, null, {
        retryAfterSeconds: 25,
      });
    },
    confirm: async () => ({}) as never,
    refreshSession: async () => ({}) as never,
  });
  const { result } = renderHook(() => useVerification(""));
  await waitFor(() => assert.equal(result.current.status, "pending"));
  assert.equal(result.current.retryAfterSeconds, 25);
});

test("認証後のセッション更新に失敗した場合は完了扱いにせずログインを案内する", async () => {
  const [{ renderHook, waitFor }, { createUseEmailVerification }] = await setup;
  const user = {
    emailVerified: true,
    reload: async () => {},
    getIdToken: async () => "fresh-token",
  };
  const useVerification = createUseEmailVerification({
    getCurrentUser: async () => user as never,
    send: async () => user as never,
    confirm: async () => ({}) as never,
    refreshSession: async () => {
      throw new Error("network");
    },
  });
  const { result } = renderHook(() =>
    useVerification("mode=verify&oobCode=abc")
  );
  await waitFor(() => assert.equal(result.current.status, "session-error"));
  assert.match(result.current.error ?? "", /ログインし直してください/);
});
