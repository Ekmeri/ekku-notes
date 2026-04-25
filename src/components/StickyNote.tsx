import React, { useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import type { Note, Position, Task, Reminder, DrawingStroke } from "../redux/notesSlice";

interface StickyNoteProps {
  note: Note;
  isActive: boolean;
  isHighlighted: boolean;
  onFocus: () => void;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: () => void;
  onAddTask: (task: Task) => void;
  onAddReminder: (reminder: Reminder) => void;
  onAddDrawing: (stroke: DrawingStroke) => void;
  onClearDrawings: () => void;
}

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const generateNoteStyle = (noteId: string) => {
  const seed = hashString(noteId);
  const random = (min: number, max: number, offset = 0) => {
    const x = Math.sin((seed + offset * 1337) * 9999) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };
  return {
    rotation: random(-2, 2, 0),
    curlTopLeft: random(0, 3, 1),
    curlTopRight: random(0, 3, 2),
    curlBottomLeft: random(0, 3, 3),
    curlBottomRight: random(0, 3, 4),
    tapeOffset: random(-15, 15, 5),
    tapeRotation: random(-8, 8, 6),
    tapeWidth: random(50, 75, 7),
    tapeHeight: random(20, 28, 8),
    tapeOpacity: random(0.55, 0.85, 9),
    tapeSkewX: random(-3, 3, 10),
    tapeTop: random(-10, -5, 11),
    tapeColorShift: random(-10, 10, 12),
    tapeWear: random(0, 1, 13),
    tapeShape: Math.floor(random(0, 5, 14)),
    tapeEdgeLeft: random(-2, 2, 15),
    tapeEdgeRight: random(-2, 2, 16),
    tapeEdgeTopLeft: random(0, 2, 17),
    tapeEdgeTopRight: random(0, 2, 18),
    tapeEdgeBottomLeft: random(0, 2, 19),
    tapeEdgeBottomRight: random(0, 2, 20),
    tapeTear: random(0, 1, 21),
    borderTL: random(1, 3, 22),
    borderTR: random(1, 3, 23),
    borderBL: random(1, 3, 24),
    borderBR: random(1, 3, 25),
    shadowX: random(3, 6, 26),
    shadowY: random(4, 8, 27),
    shadowBlur: random(12, 20, 28),
  };
};

const COLORS = ["#FFF9C4", "#FFCCBC", "#C8E6C9", "#BBDEFB", "#E1BEE7", "#F8BBD9"];
const PEN_COLORS = ["#333333", "#d32f2f", "#1976d2", "#388e3c", "#7b1fa2"];

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  isActive,
  isHighlighted,
  onFocus,
  onUpdate,
  onDelete,
  onAddTask,
  onAddReminder,
  onAddDrawing,
  onClearDrawings,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [showMenu, setShowMenu] = useState(false);
  const [modalType, setModalType] = useState<"task" | "reminder" | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [penColor, setPenColor] = useState("#333333");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawingRef = useRef<SVGSVGElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  const ns = useMemo(() => generateNoteStyle(note.id), [note.id]);

  const getIrregularShape = () => {
    const tl = ns.curlTopLeft;
    const tr = ns.curlTopRight;
    const bl = ns.curlBottomLeft;
    const br = ns.curlBottomRight;
    return `polygon(${tl}px ${tl * 0.5}px, calc(100% - ${tr}px) ${tr * 0.3}px, calc(100% - ${br * 0.4}px) calc(100% - ${br}px), ${bl * 0.6}px calc(100% - ${bl * 0.5}px))`;
  };

  const getTapeStyle = () => {
    const baseWhite = 255 + ns.tapeColorShift;
    const r = Math.min(255, Math.max(230, baseWhite));
    const g = Math.min(255, Math.max(230, baseWhite - 3));
    const b = Math.min(250, Math.max(215, baseWhite - 15));
    const tapeType = Math.floor(ns.tapeWear * 4);
    let gradient;
    if (tapeType === 0) gradient = `linear-gradient(180deg, rgba(${r},${g},${b},${ns.tapeOpacity}) 0%, rgba(${r-10},${g-10},${b-8},${ns.tapeOpacity * 0.88}) 100%)`;
    else if (tapeType === 1) gradient = `linear-gradient(180deg, rgba(${r},${g},${b},${ns.tapeOpacity}) 0%, rgba(255,255,255,${ns.tapeOpacity * 0.5}) 35%, rgba(${r-8},${g-8},${b-5},${ns.tapeOpacity * 0.9}) 100%)`;
    else if (tapeType === 2) gradient = `linear-gradient(180deg, rgba(${r},${g-10},${b-25},${ns.tapeOpacity}) 0%, rgba(${r-15},${g-20},${b-35},${ns.tapeOpacity * 0.8}) 100%)`;
    else gradient = `linear-gradient(180deg, rgba(255,255,255,${ns.tapeOpacity * 0.45}) 0%, rgba(245,245,240,${ns.tapeOpacity * 0.6}) 50%, rgba(255,255,255,${ns.tapeOpacity * 0.35}) 100%)`;

    let clipPath = "none";
    const shape = ns.tapeShape;
    if (shape === 1) clipPath = `polygon(${ns.tapeEdgeLeft + 1}px 0, calc(100% - ${ns.tapeEdgeRight}px) ${ns.tapeEdgeTopRight}px, calc(100% - ${ns.tapeEdgeRight}px) 100%, ${ns.tapeEdgeLeft}px calc(100% - ${ns.tapeEdgeBottomLeft}px))`;
    else if (shape === 2) clipPath = `polygon(${2 + ns.tapeEdgeLeft}px 0, 100% 0, 100% 100%, ${ns.tapeEdgeLeft}px calc(100% - ${ns.tapeEdgeBottomLeft}px), ${ns.tapeEdgeLeft}px 50%, 0 30%)`;
    else if (shape === 3) clipPath = `polygon(0 ${ns.tapeEdgeTopLeft}px, calc(100% - ${ns.tapeEdgeRight}px) 0, 100% 40%, calc(100% - ${ns.tapeEdgeRight}px) 100%, 0 calc(100% - ${ns.tapeEdgeBottomLeft}px))`;
    else if (shape === 4) { const c = 3; clipPath = `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`; }

    return {
      background: gradient, width: `${ns.tapeWidth}px`, height: `${ns.tapeHeight}px`, top: ns.tapeTop,
      left: `calc(50% + ${ns.tapeOffset}px)`, transform: `translateX(-50%) rotate(${ns.tapeRotation}deg) skewX(${ns.tapeSkewX}deg)`,
      borderRadius: `${1 + ns.tapeEdgeTopLeft * 0.3}px`, clipPath,
      boxShadow: `0 1px ${2 + ns.tapeWear * 2}px rgba(0,0,0,${0.06 + ns.tapeWear * 0.06}), inset 0 1px 0 rgba(255,255,255,${0.25 + ns.tapeOpacity * 0.3})`,
    };
  };

  const getMousePos = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return { x: 0, y: 0 };
    const rect = drawingRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleDrawStart = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingMode) return;
    e.stopPropagation();
    setIsDrawing(true);
    const pos = getMousePos(e);
    setCurrentStroke([pos]);
  }, [isDrawingMode, getMousePos]);

  const handleDrawMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !isDrawingMode) return;
    e.stopPropagation();
    const pos = getMousePos(e);
    setCurrentStroke(prev => [...prev, pos]);
  }, [isDrawing, isDrawingMode, getMousePos]);

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }
    onAddDrawing({ points: currentStroke, color: penColor, width: 2 });
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, penColor, onAddDrawing]);

  const handleUndo = () => {
    if (note.drawings && note.drawings.length > 0) {
      // Poista viimeisin piirros päivittämällä drawings-array
      const newDrawings = note.drawings.slice(0, -1);
      onUpdate({ drawings: newDrawings });
    }
  };

  const pointsToPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  const handleDragStop = (_e: any, d: { x: number; y: number }) => { onUpdate({ position: { x: d.x, y: d.y } }); };
  const handleResizeStop = (_e: any, _dir: any, ref: HTMLElement, _delta: any, pos: Position) => { onUpdate({ position: pos, size: { width: ref.offsetWidth, height: ref.offsetHeight } }); };
  const handleDoubleClick = () => { if (!isDrawingMode) { setIsEditing(true); setEditContent(note.content); } };
  const handleBlur = () => { setIsEditing(false); if (editContent !== note.content) onUpdate({ content: editContent }); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Escape") { setIsEditing(false); setEditContent(note.content); } };
  const setColor = (color: string) => { onUpdate({ color }); setShowMenu(false); };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const id = `${modalType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      if (modalType === "task") onAddTask({ id, text: newItemText.trim(), completed: false, dueDate: null, createdAt: now });
      else if (modalType === "reminder") onAddReminder({ id, text: newItemText.trim(), completed: false, createdAt: now });
      setNewItemText("");
      setModalType(null);
    }
  };

  const hasTasks = (note.tasks?.length || 0) > 0;
  const hasReminders = (note.reminders?.length || 0) > 0;
  const hasDrawings = (note.drawings?.length || 0) > 0;
  const allTasksDone = hasTasks && note.tasks!.every(t => t.completed);
  const allRemindersDone = hasReminders && note.reminders!.every(r => r.completed);

  const getShadow = () => {
    if (isHighlighted) return `0 0 0 3px #4a9eff, 0 0 20px rgba(74, 158, 255, 0.4), ${ns.shadowX}px ${ns.shadowY}px ${ns.shadowBlur}px rgba(60,50,40,0.3)`;
    if (isActive) return `${ns.shadowX + 2}px ${ns.shadowY + 3}px ${ns.shadowBlur + 6}px rgba(50,40,30,0.35), ${ns.shadowX}px ${ns.shadowY}px ${ns.shadowBlur * 0.5}px rgba(50,40,30,0.2)`;
    return `${ns.shadowX}px ${ns.shadowY}px ${ns.shadowBlur}px rgba(60,50,40,0.25), ${ns.shadowX * 0.5}px ${ns.shadowY * 0.5}px ${ns.shadowBlur * 0.4}px rgba(60,50,40,0.15)`;
  };

  const getMenuPosition = () => {
    if (!menuButtonRef.current) return { top: 0, left: 0 };
    const rect = menuButtonRef.current.getBoundingClientRect();
    return { top: rect.bottom + 4, left: rect.right - 170 };
  };

  const menuPos = getMenuPosition();
  const tapeStyle = getTapeStyle();

  return (
    <>
      <Rnd position={note.position} size={note.size} onDragStart={onFocus} onDragStop={handleDragStop} onResizeStop={handleResizeStop} onMouseDown={onFocus} minWidth={150} minHeight={100} className="sticky-note" disableDragging={isDrawingMode} style={{ zIndex: note.zIndex || 1, cursor: isDrawingMode ? "crosshair" : isEditing ? "text" : "grab", overflow: "visible" }}>
        <div ref={noteRef} style={{ width: "100%", height: "100%", background: `linear-gradient(${145 + ns.rotation * 3}deg, ${note.color} 0%, ${note.color}f5 60%, ${note.color}e8 100%)`, transform: `rotate(${ns.rotation}deg)`, clipPath: getIrregularShape(), borderRadius: `${ns.borderTL}px ${ns.borderTR}px ${ns.borderBR}px ${ns.borderBL}px`, boxShadow: getShadow(), animation: isHighlighted ? "noteShake 0.08s ease-in-out 12" : "none", position: "relative" }}>
          <div style={{ position: "absolute", ...tapeStyle, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 35%, rgba(0,0,0,0.04) 100%)", pointerEvents: "none", borderRadius: "inherit" }} />

          {/* SVG piirtoalue */}
          <svg ref={drawingRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: isDrawingMode ? "auto" : "none" }} viewBox="0 0 100 100" preserveAspectRatio="none" onMouseDown={handleDrawStart} onMouseMove={handleDrawMove} onMouseUp={handleDrawEnd} onMouseLeave={handleDrawEnd}>
            {(note.drawings || []).map((stroke, i) => (
              <path key={i} d={pointsToPath(stroke.points)} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
            {currentStroke.length > 1 && (
              <path d={pointsToPath(currentStroke)} fill="none" stroke={penColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            )}
          </svg>

          {/* Leimat */}
          <div style={{ position: "absolute", top: 8, left: 10, display: "flex", gap: 6 }}>
            {hasTasks && <div style={{ background: allTasksDone ? "#4CAF50" : "#3d7dd8", color: "#fff", fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px", borderRadius: 4, fontFamily: "system-ui, sans-serif", letterSpacing: "0.3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", textTransform: "uppercase" }}>{allTasksDone ? "✓ Tehty" : "Tee"}</div>}
            {hasReminders && <div style={{ background: allRemindersDone ? "#4CAF50" : "#e67e22", color: "#fff", fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px", borderRadius: 4, fontFamily: "system-ui, sans-serif", letterSpacing: "0.3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", textTransform: "uppercase" }}>{allRemindersDone ? "✓ Muistettu" : "Muista"}</div>}
          </div>

          <button ref={menuButtonRef} onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 4, width: 26, height: 26, cursor: "pointer", fontSize: "16px", color: "#5a5045", display: "flex", alignItems: "center", justifyContent: "center" }}>⋮</button>

          <div style={{ padding: (hasTasks || hasReminders) ? "35px 18px 20px 18px" : "32px 18px 20px 18px", height: "100%", boxSizing: "border-box" }} onDoubleClick={handleDoubleClick}>
            {isEditing ? (
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus style={{ width: "100%", height: "calc(100% - 10px)", border: "none", background: "transparent", resize: "none", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1rem", lineHeight: 1.6, outline: "none", color: "#3a3530" }} />
            ) : (
              <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1rem", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#3a3530" }}>{note.content || "Tuplaklikkaa muokataksesi..."}</div>
            )}
          </div>
        </div>

        {/* Piirtotilan toolbar - LAPUN ULKOPUOLELLA */}
        {isDrawingMode && (
          <div style={{ 
            position: "absolute", 
            bottom: -50, 
            left: 0, 
            right: 0, 
            background: "rgba(255,255,255,0.98)", 
            borderRadius: 8, 
            padding: "8px 12px", 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            boxShadow: "0 3px 12px rgba(0,0,0,0.2)",
            zIndex: 100,
          }}>
            {PEN_COLORS.map(c => (
              <button key={c} onClick={() => setPenColor(c)} style={{ width: 22, height: 22, borderRadius: "50%", border: penColor === c ? "2px solid #333" : "1px solid #ccc", background: c, cursor: "pointer", flexShrink: 0 }} />
            ))}
            <div style={{ flex: 1 }} />
            {hasDrawings && (
              <button onClick={handleUndo} style={{ fontSize: "0.75rem", padding: "5px 10px", border: "1px solid #ddd", borderRadius: 5, background: "#fff", cursor: "pointer", color: "#666" }} title="Peruuta viimeisin">↩</button>
            )}
            {hasDrawings && (
              <button onClick={onClearDrawings} style={{ fontSize: "0.75rem", padding: "5px 10px", border: "1px solid #ddd", borderRadius: 5, background: "#fff", cursor: "pointer", color: "#d32f2f" }}>Tyhjennä</button>
            )}
            <button onClick={() => setIsDrawingMode(false)} style={{ fontSize: "0.75rem", padding: "5px 12px", border: "none", borderRadius: 5, background: "#4CAF50", color: "#fff", cursor: "pointer", fontWeight: 500 }}>Valmis</button>
          </div>
        )}
      </Rnd>

      {showMenu && createPortal(
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }} onClick={() => setShowMenu(false)} />
          <div style={{ position: "fixed", top: menuPos.top, left: menuPos.left, background: "#fffef8", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", zIndex: 10001, minWidth: 170, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setModalType("task"); setShowMenu(false); }} style={{ display: "block", width: "100%", padding: "11px 15px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", fontSize: "0.85rem", color: "#3a3530" }}>☑️ Lisää tehtävä</button>
            <button onClick={() => { setModalType("reminder"); setShowMenu(false); }} style={{ display: "block", width: "100%", padding: "11px 15px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", fontSize: "0.85rem", color: "#3a3530" }}>💡 Lisää muistettava</button>
            <button onClick={() => { setIsDrawingMode(true); setShowMenu(false); }} style={{ display: "block", width: "100%", padding: "11px 15px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", fontSize: "0.85rem", color: "#3a3530" }}>✏️ Piirrä</button>
            <div style={{ padding: "6px 15px", fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: "1px solid #eee", marginTop: 4 }}>Väri</div>
            <div style={{ display: "flex", padding: "6px 15px 12px", gap: 6, flexWrap: "wrap" }}>
              {COLORS.map((c) => (<button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: 6, border: note.color === c ? "2px solid #333" : "1px solid #bbb", background: c, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }} />))}
            </div>
            <button onClick={() => { onDelete(); setShowMenu(false); }} style={{ display: "block", width: "100%", padding: "11px 15px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", fontSize: "0.85rem", color: "#d32f2f", borderTop: "1px solid #eee" }}>🗑️ Poista lappu</button>
          </div>
        </>,
        document.body
      )}

      {modalType && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10002 }} onClick={() => setModalType(null)}>
          <div style={{ background: "#fffef8", borderRadius: 12, padding: 24, width: 340, boxShadow: "0 16px 50px rgba(0,0,0,0.35)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#3a3530" }}>{modalType === "task" ? "☑️ Lisää tehtävä" : "💡 Lisää muistettava"}</h3>
            <div style={{ background: note.color, padding: "8px 12px", borderRadius: 6, marginBottom: 16, fontSize: "0.85rem", color: "#5a5045", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>📝 {note.content?.substring(0, 40) || "Tyhjä lappu"}{note.content?.length > 40 ? "..." : ""}</div>
            <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddItem()} placeholder={modalType === "task" ? "Kirjoita tehtävä..." : "Kirjoita muistettava asia..."} autoFocus style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: "1rem", marginBottom: 16, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModalType(null)} style={{ padding: "10px 18px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: "0.9rem" }}>Peruuta</button>
              <button onClick={handleAddItem} style={{ padding: "10px 18px", border: "none", borderRadius: 8, background: modalType === "task" ? "#4a9eff" : "#f57c00", color: "#fff", cursor: "pointer", fontSize: "0.9rem" }}>Lisää</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes noteShake {
          0%, 100% { transform: rotate(${ns.rotation}deg) translateX(0); }
          25% { transform: rotate(${ns.rotation}deg) translateX(-3px); }
          75% { transform: rotate(${ns.rotation}deg) translateX(3px); }
        }
      `}</style>
    </>
  );
};

export default StickyNote;
