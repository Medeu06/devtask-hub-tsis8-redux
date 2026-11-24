import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fakeApi } from '../../services/fakeApi.js';
import { API_CONFIG } from '../../services/settings.js';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      return await fakeApi.getAll();
    } catch (err) {
      return rejectWithValue(err.message || 'Ошибка загрузки списка задач');
    }
  },
  {
    condition: (arg, { getState }) => {
      const force = arg?.force === true;
      if (force) return true;

      const { tasks } = getState();
      if (tasks.listStatus === 'loading') return false;

      const isFresh =
        tasks.items.length > 0 &&
        navigator.onLine &&
        Date.now() - tasks.lastFetchedAt < API_CONFIG.CACHE_TTL_MS;

      return !isFresh;
    },
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (id, { rejectWithValue }) => {
    try {
      return await fakeApi.getById(id);
    } catch (err) {
      return rejectWithValue(err.message || `Ошибка загрузки задачи ${id}`);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (newTaskData, { dispatch, rejectWithValue }) => {
    try {
      const created = await fakeApi.create(newTaskData);
      await dispatch(fetchTasks({ force: true }));
      return created;
    } catch (err) {
      return rejectWithValue(err.message || 'Ошибка при создании задачи');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, partialData }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await fakeApi.update(id, partialData);
      await dispatch(fetchTasks({ force: true }));
      return updated;
    } catch (err) {
      return rejectWithValue(err.message || 'Ошибка при обновлении задачи');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await fakeApi.remove(id);
      await dispatch(fetchTasks({ force: true }));
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Ошибка при удалении задачи');
    }
  }
);

export const resetTasks = createAsyncThunk(
  'tasks/resetTasks',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const freshItems = await fakeApi.resetData();
      await dispatch(fetchTasks({ force: true }));
      return freshItems;
    } catch (err) {
      return rejectWithValue(err.message || 'Ошибка при сбросе данных');
    }
  }
);

const initialState = {
  items: [],
  dataSource: 'network',
  lastFetchedAt: 0,
  listStatus: 'idle',
  listError: null,
  currentListRequestId: null,

  selectedTask: null,
  detailDataSource: 'network',
  detailStatus: 'idle',
  detailError: null,
  currentDetailRequestId: null,

  activeMutationId: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearSelectedTask(state) {
      state.selectedTask = null;
      state.detailStatus = 'idle';
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state, action) => {
        state.listStatus = 'loading';
        state.listError = null;
        state.currentListRequestId = action.meta.requestId;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        if (state.currentListRequestId !== action.meta.requestId) return;
        state.listStatus = 'succeeded';
        state.items = action.payload.items;
        state.dataSource = action.payload.source;
        state.lastFetchedAt = Date.now();
        state.currentListRequestId = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        if (state.currentListRequestId !== action.meta.requestId) return;
        state.listStatus = 'failed';
        state.listError = action.payload || action.error.message;
        state.currentListRequestId = null;
      })
      .addCase(fetchTaskById.pending, (state, action) => {
        state.detailStatus = 'loading';
        state.detailError = null;
        state.currentDetailRequestId = action.meta.requestId;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        if (state.currentDetailRequestId !== action.meta.requestId) return;
        state.detailStatus = 'succeeded';
        state.selectedTask = action.payload.item;
        state.detailDataSource = action.payload.source;
        state.currentDetailRequestId = null;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        if (state.currentDetailRequestId !== action.meta.requestId) return;
        state.detailStatus = 'failed';
        state.detailError = action.payload || action.error.message;
        state.selectedTask = null;
        state.currentDetailRequestId = null;
      })
      .addCase(createTask.pending, (state) => {
        state.activeMutationId = 'CREATE';
      })
      .addCase(createTask.fulfilled, (state) => {
        state.activeMutationId = null;
      })
      .addCase(createTask.rejected, (state) => {
        state.activeMutationId = null;
      })
      .addCase(updateTask.pending, (state, action) => {
        state.activeMutationId = action.meta.arg.id;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.activeMutationId = null;
        if (state.selectedTask && state.selectedTask.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state) => {
        state.activeMutationId = null;
      })
      .addCase(deleteTask.pending, (state, action) => {
        state.activeMutationId = action.meta.arg;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.activeMutationId = null;
        if (state.selectedTask && state.selectedTask.id === action.payload) {
          state.selectedTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state) => {
        state.activeMutationId = null;
      })
      .addCase(resetTasks.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(resetTasks.fulfilled, (state) => {
        state.listStatus = 'succeeded';
      })
      .addCase(resetTasks.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload || action.error.message;
      });
  },
});

export const { clearSelectedTask } = tasksSlice.actions;
export default tasksSlice.reducer;
