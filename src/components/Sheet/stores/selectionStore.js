import { create } from "zustand";
import { normalizeRange } from "../utils/rangeUtils";

/* ================= SELECTION STORE ================= */

export const useSelectionStore = create((set, get) => ({
  /* ---------- state ---------- */
  activeCell: null,
  selectedRange: null,
  selectionStart: null,
  isSelecting: false,
  selectMode: "range",

  /* ---------- actions ---------- */

  // start selection
  startSelection: (row, col) =>
    set({
      activeCell: [row, col],
      selectionStart: [row, col],
      selectedRange: [row, col, row, col],
      isSelecting: true,
    }),

  // update selection
  updateSelection: (row, col) => {
    const { selectionStart, isSelecting, selectMode } = get();
    if (!selectionStart || !isSelecting) return;

    set({
      selectedRange: normalizeRange(selectionStart, [row, col], selectMode),
    });
  },

  // stop selection
  stopSelection: () => set({ isSelecting: false }),
}));
