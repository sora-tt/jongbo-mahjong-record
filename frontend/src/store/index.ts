import { configureStore } from "@reduxjs/toolkit";

import recordingFlowReducer from "./slices/recording-flow-slice";

export const store = configureStore({
  reducer: {
    recordingFlow: recordingFlowReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
