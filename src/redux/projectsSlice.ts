import { createSlice } from "@reduxjs/toolkit";

interface Project {
  id: string;
  visible: boolean;
  [key: string]: unknown;
}

interface ProjectsState {
  items: Project[];
  activeProjectId: string | null;
}

const initialState: ProjectsState = {
  items: [],
  activeProjectId: null
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setProjects: (state, action) => {
      state.items = action.payload;
    },
    setActiveProject: (state, action) => {
      state.activeProjectId = action.payload;
    },
    addProject: (state, action) => {
      const exists = state.items.some(p => p.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    hideProject: (state, action) => {
      const project = state.items.find(p => p.id === action.payload);
      if (project) {
        project.visible = false;
      }
    },
    showProject: (state, action) => {
      const project = state.items.find(p => p.id === action.payload);
      if (project) {
        project.visible = true;
      }
    },
    deleteProject: (state, action) => {
      state.items = state.items.filter(p => p.id !== action.payload);
      if (state.activeProjectId === action.payload) {
        state.activeProjectId = null;
      }
    }
  }
});

export const {
  setProjects,
  setActiveProject,
  addProject,
  hideProject,
  showProject,
  deleteProject
} = projectsSlice.actions;

export default projectsSlice.reducer;
