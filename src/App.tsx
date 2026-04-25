import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setNotes, addNote, updateNote, removeNote, setActiveNote, addTaskToNote, addReminderToNote, bringToFront, addDrawingStroke, clearDrawings } from "./redux/notesSlice";
import type { RootState } from "./redux/store";
import type { Note, Task, Reminder, DrawingStroke } from "./redux/notesSlice";
import { loadNotes, saveNotes } from "./services/eqbitService";
import StickyNote from "./components/StickyNote";
import TaskPanel from "./components/TaskPanel";
import "./App.css";

const BOARD_WIDTH = 3000;
const BOARD_HEIGHT = 2000;

const DEFAULT_COLORS = ["#FFF9C4", "#FFCCBC", "#C8E6C9", "#BBDEFB", "#E1BEE7", "#F8BBD9"];

const createNote = (position: { x: number; y: number }): Note => {
  const now = new Date().toISOString();
  return {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: "",
    position,
    size: { width: 220, height: 180 },
    color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
    isTask: false,
    dueDate: null,
    completed: false,
    priority: "medium",
    createdAt: now,
    updatedAt: now,
    tasks: [],
    reminders: [],
    drawings: [],
    zIndex: 1,
  };
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  const notes = useSelector((state: RootState) => state.notes.items);
  const activeNoteId = useSelector((state: RootState) => state.notes.activeNoteId);
  const highlightedNoteId = useSelector((state: RootState) => state.notes.highlightedNoteId);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const [boardOffset, setBoardOffset] = useState({ x: 0, y: 0 });
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadNotes().then((loaded) => {
      dispatch(setNotes(loaded));
    });
  }, [dispatch]);

  const debouncedSave = useCallback((notesToSave: Note[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveNotes(notesToSave);
    }, 1000);
  }, []);

  useEffect(() => {
    if (notes.length > 0) {
      debouncedSave(notes);
    }
  }, [notes, debouncedSave]);

  const handleBoardDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".sticky-note")) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left - boardOffset.x;
    const y = e.clientY - rect.top - boardOffset.y;
    const newNote = createNote({ x, y });
    dispatch(addNote(newNote));
    dispatch(setActiveNote(newNote.id));
  };

  const handleBoardMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDraggingBoard(true);
      setDragStart({ x: e.clientX - boardOffset.x, y: e.clientY - boardOffset.y });
      e.preventDefault();
    }
  };

  const handleBoardMouseMove = (e: React.MouseEvent) => {
    if (isDraggingBoard) {
      setBoardOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleBoardMouseUp = () => {
    setIsDraggingBoard(false);
  };

  const handleNoteUpdate = (id: string, updates: Partial<Note>) => {
    dispatch(updateNote({ id, ...updates }));
  };

  const handleNoteDelete = (id: string) => {
    dispatch(removeNote(id));
  };

  const handleNoteFocus = (id: string) => {
    dispatch(setActiveNote(id));
    dispatch(bringToFront(id));
  };

  const handleAddTask = (noteId: string, task: Task) => {
    dispatch(addTaskToNote({ noteId, task }));
  };

  const handleAddReminder = (noteId: string, reminder: Reminder) => {
    dispatch(addReminderToNote({ noteId, reminder }));
  };

  const handleAddDrawing = (noteId: string, stroke: DrawingStroke) => {
    dispatch(addDrawingStroke({ noteId, stroke }));
  };

  const handleClearDrawings = (noteId: string) => {
    dispatch(clearDrawings(noteId));
  };

  return (
    <div
      className="app-container"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "linear-gradient(155deg, #f0ebe5 0%, #ece7e0 40%, #e5e0d8 100%)",
        position: "relative",
      }}
    >
      {/* Toolbar */}
      <div style={{ position: "fixed", top: 15, left: 15, zIndex: 9000 }}>
        <button
          onClick={() => {
            const newNote = createNote({ x: 100 - boardOffset.x, y: 100 - boardOffset.y });
            dispatch(addNote(newNote));
            dispatch(setActiveNote(newNote.id));
          }}
          style={{
            padding: "10px 20px",
            background: "rgba(90, 80, 70, 0.9)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
            boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
          }}
        >
          + Uusi lappu
        </button>
      </div>

      {/* Whiteboard */}
      <div
        className="whiteboard"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          position: "absolute",
          left: boardOffset.x,
          top: boardOffset.y,
          background: `
            linear-gradient(91deg, rgba(120,105,90,0.12) 1px, transparent 1px),
            linear-gradient(181deg, rgba(120,105,90,0.12) 1px, transparent 1px),
            linear-gradient(89deg, rgba(110,95,80,0.08) 1px, transparent 1px),
            linear-gradient(179deg, rgba(110,95,80,0.08) 1px, transparent 1px),
            linear-gradient(92deg, rgba(100,85,70,0.06) 1px, transparent 1px),
            linear-gradient(178deg, rgba(100,85,70,0.06) 1px, transparent 1px),
            radial-gradient(ellipse 60% 40% at 15% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 85% 75%, rgba(255,255,255,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)
          `,
          backgroundSize: `26px 26px, 26px 26px, 31px 31px, 31px 31px, 47px 47px, 47px 47px, 100% 100%, 100% 100%, 100% 100%`,
          cursor: isDraggingBoard ? "grabbing" : "default",
        }}
        onDoubleClick={handleBoardDoubleClick}
        onMouseDown={handleBoardMouseDown}
        onMouseMove={handleBoardMouseMove}
        onMouseUp={handleBoardMouseUp}
        onMouseLeave={handleBoardMouseUp}
      >
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            isActive={activeNoteId === note.id}
            isHighlighted={highlightedNoteId === note.id}
            onFocus={() => handleNoteFocus(note.id)}
            onUpdate={(updates) => handleNoteUpdate(note.id, updates)}
            onDelete={() => handleNoteDelete(note.id)}
            onAddTask={(task) => handleAddTask(note.id, task)}
            onAddReminder={(reminder) => handleAddReminder(note.id, reminder)}
            onAddDrawing={(stroke) => handleAddDrawing(note.id, stroke)}
            onClearDrawings={() => handleClearDrawings(note.id)}
          />
        ))}
      </div>

      <TaskPanel isOpen={taskPanelOpen} onToggle={() => setTaskPanelOpen(!taskPanelOpen)} />
    </div>
  );
};

export default App;

