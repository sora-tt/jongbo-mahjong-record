import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost",
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
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
afterEach(async () => {
  const [testing] = await setup;
  testing.cleanup();
});

test("ラジオは選択・非選択と無効状態を保ち、ラベルから選択できる", async () => {
  const [{ render, screen, fireEvent }, { Control }] = await setup;
  const onChange: string[] = [];
  const Harness = () => {
    const [selected, setSelected] = React.useState("a");
    return (
      <>
        {(["a", "b"] as const).map((value) => (
          <Control
            key={value}
            type="radio"
            name="member"
            label={value}
            checked={selected === value}
            onChange={() => {
              setSelected(value);
              onChange.push(value);
            }}
          />
        ))}
        <Control type="radio" name="member" label="disabled" disabled />
      </>
    );
  };
  render(<Harness />);
  const a = screen.getByRole("radio", { name: "a" }) as HTMLInputElement;
  const b = screen.getByRole("radio", { name: "b" }) as HTMLInputElement;
  const disabled = screen.getByRole("radio", {
    name: "disabled",
  }) as HTMLInputElement;
  assert.equal(a.checked, true);
  assert.equal(b.checked, false);
  const visual = a.parentElement?.querySelector(
    "[aria-hidden='true']"
  ) as HTMLElement;
  assert.match(visual.className, /size-5/);
  assert.match(visual.className, /after:size-\[11px\]/);
  assert.match(visual.className, /peer-checked:after:opacity-100/);
  assert.match(visual.className, /peer-focus-visible:outline/);
  fireEvent.click(screen.getByText("b"));
  assert.equal(a.checked, false);
  assert.equal(b.checked, true);
  assert.equal(disabled.disabled, true);
  fireEvent.click(disabled);
  assert.deepEqual(onChange, ["b"]);
});

test("ラジオのサイズを指定でき、チェックボックスの動作を維持する", async () => {
  const [{ render, screen, fireEvent }, { Control }] = await setup;
  let checked = false;
  render(
    <>
      <Control type="radio" label="大" controlSize="lg" />
      <Control
        appearance="compact"
        label="確認"
        onChange={(e) => {
          checked = e.target.checked;
        }}
      />
    </>
  );
  const radio = screen.getByRole("radio", { name: "大" });
  assert.match(
    (radio.parentElement?.querySelector("[aria-hidden='true']") as HTMLElement)
      .className,
    /size-7/
  );
  assert.match(
    (radio.parentElement?.querySelector("[aria-hidden='true']") as HTMLElement)
      .className,
    /after:size-\[15\.4px\]/
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "確認" }));
  assert.equal(checked, true);
});
