import { deepStrictEqual, strictEqual } from "node:assert";
import test from "node:test";

import {
  createDefaultFloatingCountUmaDraft,
  validateFixedUmaDraft,
  validateFloatingCountUmaDraft,
  type FloatingCountUmaDraft,
  type FixedUmaDraft,
} from "./validation";

const emptyRows = (): FloatingCountUmaDraft => ({
  0: { first: "", second: "", third: "", fourth: "" },
  1: { first: "", second: "", third: "", fourth: "" },
  2: { first: "", second: "", third: "", fourth: "" },
  3: { first: "", second: "", third: "", fourth: "" },
  4: { first: "", second: "", third: "", fourth: "" },
});

test("floating-count draft defaults to the issue's five rank-point rows", () => {
  deepStrictEqual(createDefaultFloatingCountUmaDraft(), {
    0: { first: "0", second: "0", third: "0", fourth: "0" },
    1: { first: "12", second: "-1", third: "-3", fourth: "-8" },
    2: { first: "8", second: "4", third: "-4", fourth: "-8" },
    3: { first: "8", second: "3", third: "1", fourth: "-12" },
    4: { first: "0", second: "0", third: "0", fourth: "0" },
  });
});

test("floating-count validation reports every blank input by row and rank", () => {
  const errors = validateFloatingCountUmaDraft(emptyRows());

  strictEqual(Object.keys(errors).length, 5);
  for (const floatingCount of [0, 1, 2, 3, 4] as const) {
    deepStrictEqual(Object.keys(errors[floatingCount]?.fields ?? {}).sort(), [
      "first",
      "fourth",
      "second",
      "third",
    ]);
    strictEqual(errors[floatingCount]?.total, undefined);
  }
});

test("floating-count validation identifies a non-integer input and its row", () => {
  const rows = createDefaultFloatingCountUmaDraft();
  rows[3].second = "2.5";

  const errors = validateFloatingCountUmaDraft(rows);

  strictEqual(errors[3]?.fields?.second, "順位点は整数で入力してください");
  strictEqual(errors[2], undefined);
});

test("floating-count validation identifies each non-zero row total", () => {
  const rows = createDefaultFloatingCountUmaDraft();
  for (const floatingCount of [0, 1, 2, 3, 4] as const) {
    rows[floatingCount].first = String(Number(rows[floatingCount].first) + 1);
  }

  const errors = validateFloatingCountUmaDraft(rows);

  strictEqual(Object.keys(errors).length, 5);
  for (const floatingCount of [0, 1, 2, 3, 4] as const) {
    strictEqual(errors[floatingCount]?.total?.actualTotal, 1);
  }
  deepStrictEqual(errors[2]?.total, {
    actualTotal: 1,
    message: "2人浮きの順位点合計が0ではありません（現在: 1）",
  });
});

test("fixed validation checks three sanma values and four yonma values", () => {
  const sanmaUma: FixedUmaDraft = {
    first: "5",
    second: "-1",
    third: "-4",
    fourth: "",
  };
  const yonmaUma: FixedUmaDraft = {
    first: "5",
    second: "-1",
    third: "-3",
    fourth: "-1",
  };

  deepStrictEqual(validateFixedUmaDraft("sanma", sanmaUma), {});
  deepStrictEqual(validateFixedUmaDraft("yonma", yonmaUma), {});
  strictEqual(
    validateFixedUmaDraft("yonma", { ...yonmaUma, fourth: "-2" }).total
      ?.actualTotal,
    -1
  );
});
