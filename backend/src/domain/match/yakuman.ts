export const YAKUMAN_KINDS = [
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
] as const;

export type YakumanKind = (typeof YAKUMAN_KINDS)[number];
