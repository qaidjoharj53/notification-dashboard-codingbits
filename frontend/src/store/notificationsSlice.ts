import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  category: 'info' | 'alert' | 'message';
  read: boolean;
  timestamp: string;
}

interface NotificationsState {
  items: Notification[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async () => {
  const response = await axios.get<Notification[]>('/api/notifications');
  return response.data;
});

export const addNotification = createAsyncThunk('notifications/addNotification', async (notification: Omit<Notification, '_id' | 'timestamp'>) => {
  const response = await axios.post<Notification>('/api/notifications', notification);
  return response.data;
});

export const markNotification = createAsyncThunk('notifications/markNotification', async ({ id, read }: { id: string; read: boolean }) => {
  const response = await axios.patch<Notification>(`/api/notifications/${id}`, { read });
  return response.data;
});

export const deleteNotification = createAsyncThunk('notifications/deleteNotification', async (id: string) => {
  await axios.delete(`/api/notifications/${id}`);
  return id;
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNewNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
    },
    updateExistingNotification: (state, action: PayloadAction<Notification>) => {
      const index = state.items.findIndex(n => n._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(n => n._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(addNotification.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(markNotification.fulfilled, (state, action) => {
        const index = state.items.findIndex(n => n._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.items = state.items.filter(n => n._id !== action.payload);
      });
  },
});

export const { addNewNotification, updateExistingNotification, removeNotification } = notificationsSlice.actions;

export default notificationsSlice.reducer;

