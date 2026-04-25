import type { Note } from "../redux/notesSlice";

const API_BASE = "https://eqbit.ekmeri.eu/api";
const NOTES_FILE = "C:/koodaus/ekku-notes/data/notes.json";
const TOKEN = "4459c9b5273c3254dc4a7b1895133c225278e8b445053d1a44d78fd730a80d5d";

const headers = () => ({
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
});

export const loadNotes = async (): Promise<Note[]> => {
  try {
    const res = await fetch(`${API_BASE}/files?path=${encodeURIComponent(NOTES_FILE)}`, {
      headers: headers(),
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Load failed: ${res.status}`);
    }
    const data = await res.json();
    return JSON.parse(data.content || "[]");
  } catch (err) {
    console.error("Failed to load notes:", err);
    return [];
  }
};

export const saveNotes = async (notes: Note[]): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/files?path=${encodeURIComponent(NOTES_FILE)}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ content: JSON.stringify(notes, null, 2) }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save notes:", err);
    return false;
  }
};
