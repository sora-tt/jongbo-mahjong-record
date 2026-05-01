import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  RecordingFlowState,
  SelectedPlayers,
} from "@/types/domain/player-select";

const EMPTY_SELECTED_PLAYERS: SelectedPlayers = {
  east: "",
  south: "",
  west: "",
  north: "",
};

const initialState: RecordingFlowState = {
  leagueId: null,
  seasonId: null,
  selectedPlayerIds: [],
  selectedPlayersBySeat: EMPTY_SELECTED_PLAYERS,
  sessionId: null,
};

const recordingFlowSlice = createSlice({
  name: "recordingFlow",
  initialState,
  reducers: {
    setRecordingFlow: (state, action: PayloadAction<RecordingFlowState>) => {
      state.leagueId = action.payload.leagueId;
      state.seasonId = action.payload.seasonId;
      state.selectedPlayerIds = action.payload.selectedPlayerIds;
      state.selectedPlayersBySeat = action.payload.selectedPlayersBySeat;
      state.sessionId = action.payload.sessionId;
    },
    clearRecordingFlow: (state) => {
      state.leagueId = initialState.leagueId;
      state.seasonId = initialState.seasonId;
      state.selectedPlayerIds = initialState.selectedPlayerIds;
      state.selectedPlayersBySeat = initialState.selectedPlayersBySeat;
      state.sessionId = initialState.sessionId;
    },
  },
});

export const { setRecordingFlow, clearRecordingFlow } =
  recordingFlowSlice.actions;

export default recordingFlowSlice.reducer;
