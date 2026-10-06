export type NameSuffix = "リーグ" | "シーズン";

export type NameSuffixModel = {
  suffix: NameSuffix;
  toInputValue: (savedName: string) => string;
  toCanonicalName: (inputValue: string) => string;
};

const removeRepeatedSuffix = (value: string, suffix: NameSuffix) => {
  let stem = value.trim();

  while (stem.endsWith(suffix)) {
    stem = stem.slice(0, -suffix.length).trimEnd();
  }

  return stem;
};

export const createNameSuffixModel = (suffix: NameSuffix): NameSuffixModel => ({
  suffix,
  toInputValue: (savedName) => removeRepeatedSuffix(savedName, suffix),
  toCanonicalName: (inputValue) =>
    `${removeRepeatedSuffix(inputValue, suffix)}${suffix}`,
});

export const LEAGUE_NAME_SUFFIX_MODEL = createNameSuffixModel("リーグ");
export const SEASON_NAME_SUFFIX_MODEL = createNameSuffixModel("シーズン");
