import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "../../index";

import { RuleIdType } from "@/types/domain/rule";

// Basic selectors
export const selectRules = (state: RootState) => state.rule.rules;
export const selectSelectedRuleId = (state: RootState) =>
  state.rule.selectedRuleId;
export const selectRuleLoading = (state: RootState) => state.rule.loading;
export const selectRuleError = (state: RootState) => state.rule.error;

// Memoized selectors
export const selectAllRules = createSelector([selectRules], (rules) =>
  Object.values(rules)
);

export const selectRuleById = createSelector(
  [selectRules, (_state: RootState, ruleId: RuleIdType) => ruleId],
  (rules, ruleId) => rules[ruleId]
);

export const selectSelectedRule = createSelector(
  [selectRules, selectSelectedRuleId],
  (rules, selectedRuleId) => {
    if (!selectedRuleId) return null;
    return rules[selectedRuleId] || null;
  }
);

export const selectRulesByMode = createSelector(
  [selectAllRules, (_state: RootState, mode: "sanma" | "yonma") => mode],
  (rules, mode) => rules.filter((rule) => rule.mode === mode)
);

export const selectRulesCount = createSelector(
  [selectAllRules],
  (rules) => rules.length
);
