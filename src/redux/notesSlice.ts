import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
  order?: number;
}

export interface Reminder {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  order?: number;
}

export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface Note {
  id: string;
  content: string;
  position: Position;
  size: Size;
  color: string;
  isTask: boolean;
  dueDate: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  reminders: Reminder[];
  zIndex: number;
  drawings: DrawingStroke[];
}

interface NotesState {
  items: Note[];
  loading: boolean;
  activeNoteId: string | null;
  highlightedNoteId: string | null;
  maxZIndex: number;
}

const initialState: NotesState = {
  items: [],
  loading: false,
  activeNoteId: null,
  highlightedNoteId: null,
  maxZIndex: 1,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    setNotes: (state, action: PayloadAction<Note[]>) => {
      state.items = action.payload.map(note => ({
        ...note,
        tasks: (note.tasks || []).map((t, i) => ({ ...t, order: t.order ?? i })),
        reminders: (note.reminders || []).map((r, i) => ({ ...r, order: r.order ?? i })),
        drawings: note.drawings || [],
        zIndex: note.zIndex || 1
      }));
      state.maxZIndex = Math.max(1, ...state.items.map(n => n.zIndex || 1));
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setActiveNote: (state, action: PayloadAction<string | null>) => {
      state.activeNoteId = action.payload;
    },
    setHighlightedNote: (state, action: PayloadAction<string | null>) => {
      state.highlightedNoteId = action.payload;
    },
    bringToFront: (state, action: PayloadAction<string>) => {
      const note = state.items.find((n) => n.id === action.payload);
      if (note) {
        state.maxZIndex += 1;
        note.zIndex = state.maxZIndex;
        note.updatedAt = new Date().toISOString();
      }
    },
    addNote: (state, action: PayloadAction<Note>) => {
      state.maxZIndex += 1;
      state.items.push({ 
        ...action.payload, 
        tasks: action.payload.tasks || [], 
        reminders: action.payload.reminders || [],
        drawings: action.payload.drawings || [],
        zIndex: state.maxZIndex
      });
    },
    updateNote: (state, action: PayloadAction<Partial<Note> & { id: string }>) => {
      const index = state.items.findIndex((n) => n.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    removeNote: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    addTaskToNote: (state, action: PayloadAction<{ noteId: string; task: Task }>) => {
      const note = state.items.find((n) => n.id === action.payload.noteId);
      if (note) {
        if (!note.tasks) note.tasks = [];
        const maxOrder = note.tasks.length > 0 ? Math.max(...note.tasks.map(t => t.order ?? 0)) : -1;
        note.tasks.push({ ...action.payload.task, order: maxOrder + 1 });
        note.updatedAt = new Date().toISOString();
      }
    },
    toggleTaskComplete: (state, action: PayloadAction<{ noteId: string; taskId: string }>) => {
      const note = state.items.find((n) => n.id === action.payload.noteId);
      if (note && note.tasks) {
        const task = note.tasks.find((t) => t.id === action.payload.taskId);
        if (task) {
          task.completed = !task.completed;
          note.updatedAt = new Date().toISOString();
        }
      }
    },
    removeTask: (state, action: PayloadAction<{ noteId: string; taskId: string }>) => {
      const note = state.items.find((n) => n.id === action.payload.noteId);
      if (note && note.tasks) {
        note.tasks = note.tasks.filter((t) => t.id !== action.payload.taskId);
        note.updatedAt = new Date().toISOString();
      }
    },
    reorderTasks: (state, action: PayloadAction<{ fromIndex: number; toIndex: number; taskIds: string[] }>) => {
      const { taskIds } = action.payload;
      state.items.forEach(note => {
        if (note.tasks) {
          note.tasks.forEach(task => {
            const newIndex = taskIds.indexOf(task.id);
            if (newIndex !== -1) {
              task.order = newIndex;
            }
          });
          note.updatedAt = new Date().toISOString();
        }
      });
    },
    addReminderToNote: (state, action: PayloadAction<{ noteId: string; reminder: Reminder }>) => {
      const note = state.items.find((n) => n.id === action.payload.noteId);
      if (note) {
        if (!note.reminders) note.reminders = [];
        const maxOrder = note.reminders.length > 0 ? Math.max(...note.reminders.map(r => r.order ?? 0)) : -1;
        note.reminders.push({ ...action.payload.reminder, order: maxOrder + 1 });
        note.updatedAt = new Date().toISOString();
      }
    },
    toggleReminderComplete: (state, action: PayloadAction<{ noteId: string; reminderId: string }>) => {
      const note = state.items.find((n) => n.id === action.payload.noteId);
      if (note && note.reminders) {
        const reminder = note.reminders.find((r) => r.id === action.payload.reminderId);
        if (reminder) {
          reminder.completed = !reminder.completed;
          note.updatedAt = new Date().toISOString();
        }
      }
    },
    removeReminder: (state, action: PayloadAction<{ noteId: string; reminderId: string }>) => {
      const note = state.items.find((n) => n.id === action.payload.noteId);
      if (note && note.reminders) {
        note.reminders = note.reminders.filter((r) => r.id !== action.payload.reminderId);
        note.updatedAt = new Date().toISOString();
      }
    },
    reorderReminders: (state, action: PayloadAction<{ reminderIds: string[] }>) => {
      const { reminderIds } = action.payload;
      state.items.forEach(note => {
        if (note.reminders) {
          note.reminders.forEach(reminder => {
            const newIndex = reminderIds.indexOf(reminder.id);
            if (newIndex !== -1) {
              reminder.order = newIndex;
            }
          });
          note.updatedAt = new Date().toISOString();
        }
      });
    },
    addDrawingStroke: (state, action: PayloadAction<{ noteId: string; stroke: DrawingStroke }>) => {
      const note = state.items.find((n) => n.id === action.payload.noteId);
      if (note) {
        if (!note.drawings) note.drawings = [];
        note.drawings.push(action.payload.stroke);
        note.updatedAt = new Date().toISOString();
      }
    },
    clearDrawings: (state, action: PayloadAction<string>) => {
      const note = state.items.find((n) => n.id === action.payload);
      if (note) {
        note.drawings = [];
        note.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const {
  setNotes,
  setLoading,
  setActiveNote,
  setHighlightedNote,
  bringToFront,
  addNote,
  updateNote,
  removeNote,
  addTaskToNote,
  toggleTaskComplete,
  removeTask,
  reorderTasks,
  addReminderToNote,
  toggleReminderComplete,
  removeReminder,
  reorderReminders,
  addDrawingStroke,
  clearDrawings,
} = notesSlice.actions;

export default notesSlice.reducer;
