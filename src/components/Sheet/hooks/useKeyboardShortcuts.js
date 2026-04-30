import { useEffect } from "react";

import { useDataStore } from "../stores/dataStore";
import { useCellStyleStore } from "../stores/cellStyleStore";
import { useSheetHistoryStore } from "../stores/historyStore";
import { useSelectionStore } from "../stores/selectionStore";
import { useClipboardStore } from "../stores/clipboardStore";

/* ================= KEYBOARD SHORTCUTS ================= */

export default function useKeyboardShortcuts({ rows, cols }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;

      /* ---------- ignore typing ---------- */
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTyping) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      const history = useSheetHistoryStore.getState();

      /* ================= HELPERS ================= */

      const getRange = () => {
        const sel = useSelectionStore.getState();

        if (sel.selectedRange) return sel.selectedRange;

        if (sel.activeCell) {
          const [r, c] = sel.activeCell;
          return [r, c, r, c];
        }

        return null;
      };

      const normalize = (range) => {
        let [r1, c1, r2, c2] = range;

        if (r1 > r2) [r1, r2] = [r2, r1];
        if (c1 > c2) [c1, c2] = [c2, c1];

        return [r1, c1, r2, c2];
      };

      /* ================= UNDO / REDO ================= */

      if (ctrl && key === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo();
        return;
      }

      if (ctrl && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        history.redo();
        return;
      }

      /* ================= COPY / CUT ================= */

      if (ctrl && (key === "c" || key === "x")) {
        const range = getRange();
        if (!range) return;

        e.preventDefault();

        const [r1, c1, r2, c2] = normalize(range);

        const dataStore = useDataStore.getState();
        const styleStore = useCellStyleStore.getState();

        const values = [];
        const styles = [];

        for (let r = r1; r <= r2; r++) {
          const vRow = [];
          const sRow = [];

          for (let c = c1; c <= c2; c++) {
            const key = `${r}:${c}`;
            vRow.push(dataStore.cells[key] || "");
            sRow.push(styleStore.styles[key] || null);
          }

          values.push(vRow);
          styles.push(sRow);
        }

        const text = values.map((r) => r.join("\t")).join("\n");

        /* copy to system clipboard */
        navigator.clipboard?.writeText(text).catch(() => {});

        /* save to internal clipboard */
        useClipboardStore.getState().setClipboard({
          range: [r1, c1, r2, c2],
          mode: key === "x" ? "cut" : "copy",
          data: { text, values, styles },
        });

        return;
      }

      /* ================= PASTE ================= */

      if (ctrl && key === "v") {
        const sel = useSelectionStore.getState();
        const clipboard = useClipboardStore.getState().clipboard;

        const start = sel.activeCell || sel.selectionStart;
        if (!start) return;

        e.preventDefault();

        const [sr, sc] = start;

        const historyStore = useSheetHistoryStore.getState();
        historyStore.pushSnapshot();

        navigator.clipboard.readText().then((text) => {
          const rowsText = text?.split("\n").filter(Boolean) || [];
          const matrix = rowsText.map((r) => r.split("\t"));

          /* ===== APPLY VALUES ===== */
          useDataStore.setState((state) => {
            const next = { ...state.cells };

            for (let r = 0; r < matrix.length; r++) {
              for (let c = 0; c < matrix[r].length; c++) {
                next[`${sr + r}:${sc + c}`] = matrix[r][c];
              }
            }

            /* ===== CUT CLEANUP ===== */
            if (clipboard?.mode === "cut" && clipboard.range) {
              const [r1, c1, r2, c2] = clipboard.range;

              for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                  delete next[`${r}:${c}`];
                }
              }
            }

            return { cells: next };
          });

          /* ===== APPLY STYLE CLEANUP (CUT) ===== */
          if (clipboard?.mode === "cut" && clipboard.range) {
            const [r1, c1, r2, c2] = clipboard.range;

            useCellStyleStore.setState((state) => {
              const next = { ...state.styles };

              for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                  delete next[`${r}:${c}`];
                }
              }

              return { styles: next };
            });
          }

          /* ===== CLEAR INTERNAL CLIPBOARD ===== */
          if (clipboard?.mode === "cut") {
            useClipboardStore.getState().clearClipboard();
          }
        });

        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rows, cols]);
}
