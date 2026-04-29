import { create } from "zustand";
import { useSheetHistoryStore } from "./historyStore";

const ROW_CHUNK = 100;
const COL_CHUNK = 20;

export const useDataStore = create((set, get) => ({
  rows: ROW_CHUNK,
  cols: COL_CHUNK,

  cells: {},

  /* ================= expand ================= */

  ensureSize: (visibleRow, visibleCol) => {
    const { rows, cols } = get();

    let nextRows = rows;
    let nextCols = cols;

    if (visibleRow >= rows - 10) {
      nextRows += ROW_CHUNK;
    }

    if (visibleCol >= cols - 5) {
      nextCols += COL_CHUNK;
    }

    if (nextRows !== rows || nextCols !== cols) {
      set({
        rows: nextRows,
        cols: nextCols,
      });
    }
  },

  /* ================= data ================= */

  setData: (data) => {
    useSheetHistoryStore.getState().pushSnapshot();

    set({
      rows: data.rows || ROW_CHUNK,
      cols: data.cols || COL_CHUNK,
      cells: data.cells || {},
    });
  },

  setCellValue: (row, col, value) => {
    const key = `${row}:${col}`;
    const current = get().cells[key] || "";

    if (current === value) return;

    const { rows, cols } = get();

    let nextRows = rows;
    let nextCols = cols;

    if (row >= rows) nextRows = row + ROW_CHUNK;
    if (col >= cols) nextCols = col + COL_CHUNK;

    useSheetHistoryStore.getState().pushSnapshot();

    set((state) => ({
      rows: nextRows,
      cols: nextCols,
      cells: {
        ...state.cells,
        [key]: value,
      },
    }));
  },

  getCellValue: (row, col) => {
    return get().cells[`${row}:${col}`];
  },

  getCellByAddress: (address) => {
    if (!address) return null;

    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const colLabel = match[1];
    const row = parseInt(match[2], 10) - 1;

    let col = 0;

    for (let i = 0; i < colLabel.length; i++) {
      col = col * 26 + (colLabel.charCodeAt(i) - 64);
    }

    col--;

    return get().cells[`${row}:${col}`];
  },

  clear: () => {
    if (Object.keys(get().cells).length === 0) return;

    useSheetHistoryStore.getState().pushSnapshot();

    set({
      cells: {},
    });
  },

  clearRange: (r1, c1, r2, c2) => {
    useSheetHistoryStore.getState().pushSnapshot();

    set((state) => {
      const next = { ...state.cells };

      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          delete next[`${r}:${c}`];
        }
      }

      return { cells: next };
    });
  },
}));
