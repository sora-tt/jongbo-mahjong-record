import assert from "node:assert/strict";
import test from "node:test";

import { YAKUMAN_OPTIONS } from "./yakuman";

test("shares the Japanese labels and selection order for all yakuman kinds", () => {
  assert.deepEqual(YAKUMAN_OPTIONS, [
    { kind: "kokushiMusou", label: "国士無双" },
    { kind: "kokushi13Wait", label: "国士無双十三面待ち" },
    { kind: "suuankou", label: "四暗刻" },
    { kind: "suuankouTanki", label: "四暗刻単騎待ち" },
    { kind: "daisangen", label: "大三元" },
    { kind: "shousuushi", label: "小四喜" },
    { kind: "daisuushi", label: "大四喜" },
    { kind: "tsuuiisou", label: "字一色" },
    { kind: "chinroutou", label: "清老頭" },
    { kind: "ryuuiisou", label: "緑一色" },
    { kind: "chuurenPoutou", label: "九蓮宝燈" },
    { kind: "junseiChuurenPoutou", label: "純正九蓮宝燈" },
    { kind: "suukantsu", label: "四槓子" },
    { kind: "tenhou", label: "天和" },
    { kind: "chiihou", label: "地和" },
  ]);
});
