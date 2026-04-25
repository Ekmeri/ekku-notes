import React, { useMemo, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../redux/store";
import { toggleTaskComplete, toggleReminderComplete, setHighlightedNote, removeTask, removeReminder, reorderTasks, reorderReminders } from "../redux/notesSlice";

interface TaskPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

type TabType = "tasks" | "reminders";
type FilterType = "all" | "active" | "completed";

interface ItemData {
  item: { id: string; text: string; completed: boolean; createdAt: string; order?: number };
  noteId: string;
  noteContent: string;
  noteColor: string;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ isOpen, onToggle }) => {
  const dispatch = useDispatch();
  const notes = useSelector((state: RootState) => state.notes.items);
  const [tab, setTab] = React.useState<TabType>("tasks");
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const allTasks = useMemo(() => {
    const tasks: ItemData[] = [];
    notes.forEach((note) => {
      if (note.tasks && note.tasks.length > 0) {
        note.tasks.forEach((task) => {
          tasks.push({ item: task, noteId: note.id, noteContent: note.content, noteColor: note.color });
        });
      }
    });
    return tasks.sort((a, b) => {
      if (a.item.completed !== b.item.completed) return a.item.completed ? 1 : -1;
      return (a.item.order ?? 0) - (b.item.order ?? 0);
    });
  }, [notes]);

  const allReminders = useMemo(() => {
    const reminders: ItemData[] = [];
    notes.forEach((note) => {
      if (note.reminders && note.reminders.length > 0) {
        note.reminders.forEach((reminder) => {
          reminders.push({ item: reminder, noteId: note.id, noteContent: note.content, noteColor: note.color });
        });
      }
    });
    return reminders.sort((a, b) => {
      if (a.item.completed !== b.item.completed) return a.item.completed ? 1 : -1;
      return (a.item.order ?? 0) - (b.item.order ?? 0);
    });
  }, [notes]);

  const currentItems = tab === "tasks" ? allTasks : allReminders;

  const filteredItems = useMemo(() => {
    switch (filter) {
      case "active": return currentItems.filter((t) => !t.item.completed);
      case "completed": return currentItems.filter((t) => t.item.completed);
      default: return currentItems;
    }
  }, [currentItems, filter]);

  const handleItemClick = (noteId: string) => {
    dispatch(setHighlightedNote(noteId));
    setTimeout(() => dispatch(setHighlightedNote(null)), 1000);
  };

  const handleToggleComplete = (e: React.MouseEvent, noteId: string, itemId: string) => {
    e.stopPropagation();
    if (tab === "tasks") {
      dispatch(toggleTaskComplete({ noteId, taskId: itemId }));
    } else {
      dispatch(toggleReminderComplete({ noteId, reminderId: itemId }));
    }
  };

  const handleDeleteItem = (e: React.MouseEvent, noteId: string, itemId: string) => {
    e.stopPropagation();
    if (tab === "tasks") {
      dispatch(removeTask({ noteId, taskId: itemId }));
    } else {
      dispatch(removeReminder({ noteId, reminderId: itemId }));
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedId(itemId);
    e.dataTransfer.effectAllowed = "move";
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    setTimeout(() => {
      if (dragNodeRef.current) dragNodeRef.current.style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = "1";
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (draggedId && itemId !== draggedId) {
      setDragOverId(itemId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const items = [...filteredItems];
    const dragIndex = items.findIndex(i => i.item.id === draggedId);
    const dropIndex = items.findIndex(i => i.item.id === targetId);
    
    if (dragIndex === -1 || dropIndex === -1) return;

    // Reorder array
    const [removed] = items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, removed);

    // Get new order of IDs
    const newOrder = items.map(i => i.item.id);

    if (tab === "tasks") {
      dispatch(reorderTasks({ fromIndex: dragIndex, toIndex: dropIndex, taskIds: newOrder }));
    } else {
      dispatch(reorderReminders({ reminderIds: newOrder }));
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const taskActiveCount = allTasks.filter((t) => !t.item.completed).length;
  const reminderActiveCount = allReminders.filter((r) => !r.item.completed).length;
  const totalActiveCount = taskActiveCount + reminderActiveCount;
  const activeCount = currentItems.filter((t) => !t.item.completed).length;
  const completedCount = currentItems.filter((t) => t.item.completed).length;

  return (
    <div
      className="task-panel"
      style={{
        position: "fixed",
        right: isOpen ? 0 : -340,
        top: 0,
        width: 340,
        height: "100vh",
        background: "rgba(250, 248, 244, 0.98)",
        backdropFilter: "blur(10px)",
        borderLeft: "1px solid rgba(0,0,0,0.1)",
        transition: "right 0.3s ease",
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        color: "#3a3530",
        boxShadow: isOpen ? "-4px 0 20px rgba(0,0,0,0.1)" : "none",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          position: "absolute", left: -44, top: "50%", transform: "translateY(-50%)",
          width: 44, height: 88, background: "rgba(250, 248, 244, 0.98)",
          border: "1px solid rgba(0,0,0,0.1)", borderRight: "none", borderRadius: "10px 0 0 10px",
          cursor: "pointer", color: "#5a5045", fontSize: "20px", boxShadow: "-2px 0 8px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        }}
      >
        <span>{isOpen ? "→" : "📋"}</span>
        {!isOpen && totalActiveCount > 0 && (
          <span style={{ fontSize: "0.7rem", background: "#4a9eff", color: "#fff", borderRadius: 8, padding: "1px 6px" }}>{totalActiveCount}</span>
        )}
      </button>

      <div style={{ padding: "16px 20px 0", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 12 }}>
          <button onClick={() => setTab("tasks")} style={{ flex: 1, padding: "10px 16px", border: "none", borderBottom: tab === "tasks" ? "3px solid #4a9eff" : "3px solid transparent", background: "transparent", cursor: "pointer", fontSize: "0.95rem", fontWeight: tab === "tasks" ? 600 : 400, color: tab === "tasks" ? "#3a3530" : "#888", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            ☑️ Tehtävät
            {taskActiveCount > 0 && <span style={{ background: "#4a9eff", color: "#fff", fontSize: "0.7rem", padding: "1px 6px", borderRadius: 8 }}>{taskActiveCount}</span>}
          </button>
          <button onClick={() => setTab("reminders")} style={{ flex: 1, padding: "10px 16px", border: "none", borderBottom: tab === "reminders" ? "3px solid #f57c00" : "3px solid transparent", background: "transparent", cursor: "pointer", fontSize: "0.95rem", fontWeight: tab === "reminders" ? 600 : 400, color: tab === "reminders" ? "#3a3530" : "#888", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            💡 Muista
            {reminderActiveCount > 0 && <span style={{ background: "#f57c00", color: "#fff", fontSize: "0.7rem", padding: "1px 6px", borderRadius: 8 }}>{reminderActiveCount}</span>}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, paddingBottom: 12 }}>
          {(["all", "active", "completed"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 10px", fontSize: "0.75rem", border: "none", borderRadius: 5, cursor: "pointer", background: filter === f ? (tab === "tasks" ? "#4a9eff" : "#f57c00") : "rgba(0,0,0,0.05)", color: filter === f ? "#fff" : "#5a5045" }}>
              {f === "all" && `Kaikki (${currentItems.length})`}
              {f === "active" && `Avoimet (${activeCount})`}
              {f === "completed" && `Valmiit (${completedCount})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {filteredItems.length === 0 ? (
          <p style={{ color: "rgba(0,0,0,0.4)", textAlign: "center", marginTop: 50, fontSize: "0.9rem" }}>
            {tab === "tasks" ? "Ei tehtäviä. Lisää tehtävä muistilapun valikosta." : "Ei muistettavia. Lisää muistettava muistilapun valikosta."}
          </p>
        ) : (
          filteredItems.map(({ item, noteId, noteContent, noteColor }) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDrop={(e) => handleDrop(e, item.id)}
              onClick={() => handleItemClick(noteId)}
              style={{
                padding: "12px 14px 12px 8px",
                marginBottom: 8,
                background: dragOverId === item.id ? (tab === "tasks" ? "rgba(74, 158, 255, 0.1)" : "rgba(245, 124, 0, 0.1)") : "#fff",
                borderLeft: `4px solid ${tab === "tasks" ? "#4a9eff" : "#f57c00"}`,
                cursor: "pointer",
                boxShadow: draggedId === item.id ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.06)",
                transition: "background 0.15s, box-shadow 0.15s",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              {/* Drag handle */}
              <div
                style={{
                  cursor: "grab",
                  color: "#bbb",
                  fontSize: "14px",
                  padding: "2px 4px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
                title="Raahaa järjestääksesi"
              >
                <span style={{ lineHeight: 0.6 }}>⋮⋮</span>
              </div>

              <input
                type="checkbox"
                checked={item.completed}
                onClick={(e) => handleToggleComplete(e, noteId, item.id)}
                onChange={() => {}}
                style={{ marginTop: 2, cursor: "pointer", width: 18, height: 18, accentColor: tab === "tasks" ? "#4CAF50" : "#f57c00" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ textDecoration: item.completed ? "line-through" : "none", fontSize: "0.95rem", color: item.completed ? "#999" : "#3a3530", lineHeight: 1.4 }}>{item.text}</div>
                <div style={{ fontSize: "0.75rem", color: "#999", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: noteColor }} />
                  {noteContent?.substring(0, 25) || "Tyhjä lappu"}{noteContent?.length > 25 ? "..." : ""}
                </div>
              </div>
              <button onClick={(e) => handleDeleteItem(e, noteId, item.id)} style={{ background: "transparent", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1.1rem", padding: 4 }} title="Poista">×</button>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(0,0,0,0.08)", fontSize: "0.8rem", color: "#888" }}>
        💡 Klikkaa nähdäksesi lappu · Raahaa järjestääksesi
      </div>
    </div>
  );
};

export default TaskPanel;
