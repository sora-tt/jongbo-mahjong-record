import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/store";
import { createInitialRecordingFlowState } from "@/store/slices/recording-flow-slice";

export const selectRecordingFlow = (state: RootState) =>
  state.recordingFlow ?? createInitialRecordingFlowState();

export const selectSelectedPlayerIds = createSelector(
  [selectRecordingFlow],
  (recordingFlow) => recordingFlow.selectedPlayerIds
);

export const selectSelectedPlayersBySeat = createSelector(
  [selectRecordingFlow],
  (recordingFlow) => recordingFlow.selectedPlayersBySeat
);

export const selectRecordingFlowSessionId = createSelector(
  [selectRecordingFlow],
  (recordingFlow) => recordingFlow.sessionId
);
