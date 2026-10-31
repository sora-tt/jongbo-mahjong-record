import type { ApiMatch } from "@/lib/api/contracts";

export type ApiYakumanKind = ApiMatch["yakumanEvents"][number]["kind"];

export const YAKUMAN_LABELS: Record<ApiYakumanKind, string> = {
  kokushiMusou: "国士無双",
  kokushi13Wait: "国士無双十三面待ち",
  suuankou: "四暗刻",
  suuankouTanki: "四暗刻単騎待ち",
  daisangen: "大三元",
  shousuushi: "小四喜",
  daisuushi: "大四喜",
  tsuuiisou: "字一色",
  chinroutou: "清老頭",
  ryuuiisou: "緑一色",
  chuurenPoutou: "九蓮宝燈",
  junseiChuurenPoutou: "純正九蓮宝燈",
  suukantsu: "四槓子",
  tenhou: "天和",
  chiihou: "地和",
};

export const YAKUMAN_KIND_ORDER = [
  "kokushiMusou",
  "kokushi13Wait",
  "suuankou",
  "suuankouTanki",
  "daisangen",
  "shousuushi",
  "daisuushi",
  "tsuuiisou",
  "chinroutou",
  "ryuuiisou",
  "chuurenPoutou",
  "junseiChuurenPoutou",
  "suukantsu",
  "tenhou",
  "chiihou",
] as const satisfies readonly ApiYakumanKind[];

export const YAKUMAN_OPTIONS = YAKUMAN_KIND_ORDER.map((kind) => ({
  kind,
  label: YAKUMAN_LABELS[kind],
}));
