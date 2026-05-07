import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/store";

export const selectRecordingFlow = (state: RootState) => state.recordingFlow;

export const selectSelectedPlayerIds = createSelector(
  [selectRecordingFlow],
  (recordingFlow) => recordingFlow.selectedPlayerIds
);

export const selectSelectedPlayersBySeat = createSelector(
  [selectRecordingFlow],
  (recordingFlow) => recordingFlow.selectedPlayersBySeat
);
