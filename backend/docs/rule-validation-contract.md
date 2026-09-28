# League rule validation contract

## 正本

League の `rule` は League document に埋め込まれた `gameType`、`uma`、`oka` を正本とする。独立した rule master や `scoreCalculation` はこの契約に含めない。

## `uma` の判定

- `gameType=sanma`: `first + second + third === 0` かつ `fourth === null`
- `gameType=yonma`: `first + second + third + fourth === 0` かつ `fourth !== null`
- BE は不正な値を自動補正・再配分せず、League の保存前に拒否する。

FE は入力中の表示検証に同じ predicate を利用できるが、BEの `validation_error` が最終的な権威である。

## エラー契約

合計違反時は HTTP 400 で次の ErrorEnvelope を返す。

```json
{
  "error": {
    "code": "validation_error",
    "message": "rule.uma must total zero",
    "details": {
      "field": "rule.uma",
      "gameType": "yonma",
      "expectedTotal": 0,
      "actualTotal": 10
    }
  }
}
```

FE は `details.field` をフィールド表示へ利用できる。`oka`、raw score、rank、point の計算や補正はこの契約の責務ではなく、後続の backend-integrity-lifecycle が扱う。
