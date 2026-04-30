import { create } from "zustand";
import { useDataStore } from "./dataStore";
import { useSelectionStore } from "./selectionStore";

/* ================= EDITING STORE ================= */

export const useEditingStore = create((set, get) => ({
  /* ---------- state ---------- */
  editingCell: null,
  editingValue: "",

  /* ---------- actions ---------- */

  // start editing
  startEditing: (row, col) => {
    const value = useDataStore.getState().cells?.[`${row}:${col}`] || "";

    set({
      editingCell: [row, col],
      editingValue: value,
    });

    // sync selection
    useSelectionStore.getState().startSelection(row, col);
  },

  // update value
  setEditingValue: (value) => set({ editingValue: value }),

  // commit
  commitEditing: () => {
    const { editingCell, editingValue } = get();
    if (!editingCell) return;

    const [row, col] = editingCell;

    useDataStore.getState().setCellValue(row, col, editingValue);

    set({
      editingCell: null,
      editingValue: "",
    });
  },

  // cancel
  cancelEditing: () =>
    set({
      editingCell: null,
      editingValue: "",
    }),
}));
