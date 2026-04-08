import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Rule, RuleIdType } from "@/types/domain/rule";

interface RuleState {
  rules: Record<RuleIdType, Rule>;
  selectedRuleId: RuleIdType | null;
  loading: boolean;
  error: string | null;
}

const initialState: RuleState = {
  rules: {},
  selectedRuleId: null,
  loading: false,
  error: null,
};

const ruleSlice = createSlice({
  name: "rule",
  initialState,
  reducers: {
    setRules: (state, action: PayloadAction<Rule[]>) => {
      state.rules = action.payload.reduce(
        (acc, rule) => {
          acc[rule.ruleId] = rule;
          return acc;
        },
        {} as Record<RuleIdType, Rule>
      );
      state.loading = false;
      state.error = null;
    },
    addRule: (state, action: PayloadAction<Rule>) => {
      state.rules[action.payload.ruleId] = action.payload;
    },
    updateRule: (state, action: PayloadAction<Rule>) => {
      const ruleId = action.payload.ruleId;
      if (state.rules[ruleId]) {
        state.rules[ruleId] = action.payload;
      }
    },
    deleteRule: (state, action: PayloadAction<RuleIdType>) => {
      delete state.rules[action.payload];
      if (state.selectedRuleId === action.payload) {
        state.selectedRuleId = null;
      }
    },
    setSelectedRuleId: (state, action: PayloadAction<RuleIdType | null>) => {
      state.selectedRuleId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setRules,
  addRule,
  updateRule,
  deleteRule,
  setSelectedRuleId,
  setLoading,
  setError,
} = ruleSlice.actions;

export default ruleSlice.reducer;
