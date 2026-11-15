import { deepStrictEqual } from "node:assert";
import test from "node:test";

import { getChartDomainIncludingZero } from "./chart";

test("point charts include zero for positive, negative, mixed and empty values", () => {
  deepStrictEqual(getChartDomainIncludingZero([12, 30]), [0, 30]);
  deepStrictEqual(getChartDomainIncludingZero([-30]), [-30, 0]);
  deepStrictEqual(getChartDomainIncludingZero([-10, 20]), [-10, 20]);
  deepStrictEqual(getChartDomainIncludingZero([0]), [-1, 1]);
});
