import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ViewMode = "grid" | "list";

interface ViewState {
  mode: ViewMode;
  archive: boolean;
}

const initialState: ViewState = {
  mode: "grid",
  archive: false,
};

const viewModeSlice = createSlice({
  name: "viewMode",
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.mode = action.payload;
    },
    setArchive: (state) => {
      state.archive = !state.archive;
    },
  },
});

export const { setViewMode, setArchive } = viewModeSlice.actions;
export default viewModeSlice.reducer;
