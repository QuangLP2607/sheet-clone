import { useEffect, useCallback } from "react";

import { useSelectionStore } from "../stores/selectionStore";
import { useEditingStore } from "../stores/editingStore";
import { useDataStore } from "../stores/dataStore";

/* ================= SHEET KEYBOARD ================= */

export default function useSheetKeyboard({ rows, cols }) {
  /* ---------- state ---------- */
  const activeCell = useSelectionStore((s) => s.activeCell);
  const startSelection = useSelectionStore((s) => s.startSelection);
  const updateSelection = useSelectionStore((s) => s.updateSelection);

  const editingCell = useEditingStore((s) => s.editingCell);
  const startEditing = useEditingStore((s) => s.startEditing);
  const commitEditing = useEditingStore((s) => s.commitEditing);
  const cancelEditing = useEditingStore((s) => s.cancelEditing);

  const clearRange = useDataStore((s) => s.clearRange);

  const [row = 0, col = 0] = activeCell || [];

  /* ---------- helpers ---------- */
  const clamp = useCallback(
    (r, c) => [
      Math.max(0, Math.min(rows - 1, r)),
      Math.max(0, Math.min(cols - 1, c)),
    ],
    [rows, cols],
  );

  const move = useCallback(
    (dr, dc, extend = false) => {
      const [nr, nc] = clamp(row + dr, col + dc);
      extend ? updateSelection(nr, nc) : startSelection(nr, nc);
    },
    [row, col, clamp, startSelection, updateSelection],
  );

  /* ---------- handler ---------- */
  const handleKeyDown = useCallback(
    (e) => {
      const key = e.key;

      /* ===== EDIT MODE ===== */
      if (editingCell) {
        if (key === "Enter") {
          e.preventDefault();
          commitEditing();
          move(1, 0);
        }

        if (key === "Escape") {
          e.preventDefault();
          cancelEditing();
        }

        return;
      }

      /* ===== DELETE ===== */
      if (key === "Backspace" || key === "Delete") {
        const { selectedRange, activeCell } = useSelectionStore.getState();

        const range =
          selectedRange || (activeCell ? [...activeCell, ...activeCell] : null);

        if (!range) return;

        let [r1, c1, r2, c2] = range;

        if (r1 > r2) [r1, r2] = [r2, r1];
        if (c1 > c2) [c1, c2] = [c2, c1];

        clearRange(r1, c1, r2, c2);

        e.preventDefault();
        return;
      }

      /* ===== ENTER EDIT ===== */
      if (key === "Enter") {
        e.preventDefault();
        startEditing(row, col);
        return;
      }

      /* ===== ARROWS ===== */
      if (key.startsWith("Arrow")) {
        e.preventDefault();

        const map = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        };

        const [dr, dc] = map[key];
        move(dr, dc, e.shiftKey);
        return;
      }

      /* ===== TYPING ===== */
      if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
        startEditing(row, col);
      }
    },
    [
      editingCell,
      row,
      col,
      move,
      startEditing,
      commitEditing,
      cancelEditing,
      clearRange,
    ],
  );

  /* ---------- bind ---------- */
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
