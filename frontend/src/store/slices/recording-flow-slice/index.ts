import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  RecordingFlowState,
  SelectedPlayers,
} from "@/types/domain/player-select";

const createEmptySelectedPlayers = (): SelectedPlayers => ({
  east: "",
  south: "",
  west: "",
  north: "",
});

export const createInitialRecordingFlowState = (): RecordingFlowState => ({
  leagueId: null,
  seasonId: null,
  selectedPlayerIds: [],
  selectedPlayersBySeat: createEmptySelectedPlayers(),
  sessionId: null,
});

const initialState: RecordingFlowState = createInitialRecordingFlowState();

const recordingFlowSlice = createSlice({
  name: "recordingFlow",
  initialState,
  reducers: {
    setRecordingFlow: (_state, action: PayloadAction<RecordingFlowState>) => ({
      ...action.payload,
      selectedPlayerIds: [...action.payload.selectedPlayerIds],
      selectedPlayersBySeat: { ...action.payload.selectedPlayersBySeat },
    }),
    clearRecordingFlow: () => createInitialRecordingFlowState(),
  },
});

export const { setRecordingFlow, clearRecordingFlow } =
  recordingFlowSlice.actions;

export default recordingFlowSlice.reducer;
