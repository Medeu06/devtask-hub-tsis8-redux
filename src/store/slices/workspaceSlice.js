import { createSlice } from '@reduxjs/toolkit';

const PINNED_STORAGE_KEY = 'devtask_hub_pinned_v1';

function loadInitialPinnedIds() {
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistPinnedIds(ids) {
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}

const initialState = {
  viewMode: 'grid', // 'grid' | 'compact'
  pinnedTaskIds: loadInitialPinnedIds(),
  onlyPinned: false,
  toast: null, // { id, message, type }
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setViewMode(state, action) {
      state.viewMode = action.payload;
    },
    togglePinTask(state, action) {
      const taskId = action.payload;
      if (state.pinnedTaskIds.includes(taskId)) {
        state.pinnedTaskIds = state.pinnedTaskIds.filter((id) => id !== taskId);
      } else {
        state.pinnedTaskIds.push(taskId);
      }
      persistPinnedIds(state.pinnedTaskIds);
    },
    setOnlyPinned(state, action) {
      state.onlyPinned = Boolean(action.payload);
    },
    showToast(state, action) {
      const payload = typeof action.payload === 'string'
        ? { message: action.payload, type: 'success' }
        : action.payload;
      state.toast = {
        id: Date.now(),
        message: payload.message,
        type: payload.type || 'success',
      };
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const {
  setViewMode,
  togglePinTask,
  setOnlyPinned,
  showToast,
  clearToast,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
