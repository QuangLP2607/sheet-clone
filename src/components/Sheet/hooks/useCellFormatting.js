import { useCellStyleStore } from "../stores/cellStyleStore";
import { useSelectionStore } from "../stores/selectionStore";
import { useSheetHistoryStore } from "../stores/historyStore";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

/* ================= HOOK ================= */

export default function useCellFormatting() {
  /* ---------- selection ---------- */
  const { selectedRange, activeCell } = useSelectionStore(
    useShallow((s) => ({
      selectedRange: s.selectedRange,
      activeCell: s.activeCell,
    })),
  );

  /* ---------- history ---------- */
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useSheetHistoryStore(
    useShallow((s) => ({
      pushSnapshot: s.pushSnapshot,
      undo: s.undo,
      redo: s.redo,
      canUndo: s.past.length > 0,
      canRedo: s.future.length > 0,
    })),
  );

  /* ---------- style store ---------- */
  const setRangeStyle = useCellStyleStore((s) => s.setRangeStyle);
  const clearRangeStyle = useCellStyleStore((s) => s.clearRangeStyle);

  /* ================= RANGE RESOLVE ================= */

  const range = selectedRange
    ? selectedRange
    : activeCell
      ? [...activeCell, ...activeCell]
      : null;

  /* ================= ANCHOR CELL ================= */

  const anchor = range ? [range[0], range[1]] : null;

  const selectedStyle = useCellStyleStore(
    useCallback(
      (state) => {
        if (!anchor) return null;
        return state.styles[`${anchor[0]}:${anchor[1]}`] || null;
      },
      [anchor],
    ),
  );

  /* ================= APPLY ================= */

  const applyStyle = useCallback(
    (style) => {
      if (!range) return;
      pushSnapshot();
      setRangeStyle(range, style);
    },
    [range, setRangeStyle, pushSnapshot],
  );

  /* ================= ACTIONS ================= */

  const setBackground = useCallback(
    (color) => applyStyle({ bg: color }),
    [applyStyle],
  );

  const toggleBold = useCallback(
    () => applyStyle({ bold: !selectedStyle?.bold }),
    [applyStyle, selectedStyle],
  );

  const toggleItalic = useCallback(
    () => applyStyle({ italic: !selectedStyle?.italic }),
    [applyStyle, selectedStyle],
  );

  const toggleUnderline = useCallback(
    () => applyStyle({ underline: !selectedStyle?.underline }),
    [applyStyle, selectedStyle],
  );

  const setTextAlign = useCallback(
    (align) => applyStyle({ align }),
    [applyStyle],
  );

  const setVerticalAlign = useCallback(
    (verticalAlign) => applyStyle({ verticalAlign }),
    [applyStyle],
  );

  const setBorderPreset = useCallback(
    (borderPreset) => applyStyle({ borderPreset }),
    [applyStyle],
  );

  const setTextColor = useCallback(
    (color) => applyStyle({ color }),
    [applyStyle],
  );

  const setFontSize = useCallback(
    (fontSize) => applyStyle({ fontSize }),
    [applyStyle],
  );

  const setFontFamily = useCallback(
    (fontFamily) => applyStyle({ fontFamily }),
    [applyStyle],
  );

  const clearFormatting = useCallback(() => {
    if (!range) return;
    pushSnapshot();
    clearRangeStyle(range);
  }, [range, clearRangeStyle, pushSnapshot]);

  /* ================= RETURN ================= */

  return {
    selectedStyle,

    setBackground,
    toggleBold,
    toggleItalic,
    toggleUnderline,

    setTextAlign,
    setVerticalAlign,
    setBorderPreset,

    setFontSize,
    setFontFamily,
    setTextColor,

    clearFormatting,

    undo,
    redo,
    canUndo,
    canRedo,
  };
}
