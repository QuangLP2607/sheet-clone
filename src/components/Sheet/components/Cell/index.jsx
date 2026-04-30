import { memo, useMemo } from "react";
import { useDataStore } from "../../stores/dataStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useEditingStore } from "../../stores/editingStore";
import { useClipboardStore } from "../../stores/clipboardStore";
import { useViewportStore } from "../../stores/viewportStore";
import { useShallow } from "zustand/react/shallow";
import useCellStyle from "../../hooks/useCellStyle";

import classNames from "classnames/bind";
import styles from "./cell.module.scss";

const cx = classNames.bind(styles);

/* ================= ALIGN ================= */

const TEXT_ALIGN_MAP = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const VERTICAL_ALIGN_MAP = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
};

/* ================= GRID BASE ================= */

const GRID_SHADOW = `
  inset 1px 0 0 rgba(0,0,0,0.06),
  inset 0 1px 0 rgba(0,0,0,0.06)
`;

/* ================= BORDER ================= */

function getBorderShadow(preset, color = "#5f6368", w = 1) {
  if (!preset || preset === "none") return "";

  switch (preset) {
    case "all":
    case "outer":
      return `inset 0 0 0 ${w}px ${color}, 0 0 0 ${w}px ${color}`;
    case "horizontal":
      return `inset 0 ${w}px 0 ${color}, inset 0 -${w}px 0 ${color}`;
    case "vertical":
      return `inset ${w}px 0 0 ${color}, inset -${w}px 0 0 ${color}`;
    case "top":
      return `inset 0 ${w}px 0 ${color}`;
    case "bottom":
      return `inset 0 -${w}px 0 ${color}`;
    case "left":
      return `inset ${w}px 0 0 ${color}`;
    case "right":
      return `inset -${w}px 0 0 ${color}`;
    case "inner":
      return `inset 1px 1px 0 ${color}, inset -1px -1px 0 ${color}`;
    default:
      return "";
  }
}

/* ================= CELL ================= */

function Cell({ row, col, style }) {
  /* ---------- DATA ---------- */
  const value = useDataStore((s) => s.cells[`${row}:${col}`] || "");
  const zoom = useViewportStore((s) => s.zoom);
  const cellStyle = useCellStyle(row, col);

  /* ---------- SELECTION ---------- */
  const { activeCell, selectedRange } = useSelectionStore(
    useShallow((s) => ({
      activeCell: s.activeCell,
      selectedRange: s.selectedRange,
    })),
  );

  const editingCell = useEditingStore((s) => s.editingCell);
  const clipboardRange = useClipboardStore((s) => s.clipboard.range);

  /* ---------- DERIVED FLAGS ---------- */
  const isActive = activeCell?.[0] === row && activeCell?.[1] === col;

  const isEditing = editingCell?.[0] === row && editingCell?.[1] === col;

  const isSelected =
    selectedRange &&
    row >= selectedRange[0] &&
    row <= selectedRange[2] &&
    col >= selectedRange[1] &&
    col <= selectedRange[3];

  const isClipboard =
    clipboardRange &&
    row >= clipboardRange[0] &&
    row <= clipboardRange[2] &&
    col >= clipboardRange[1] &&
    col <= clipboardRange[3];

  /* ---------- STYLE ---------- */
  const mergedStyle = useMemo(() => {
    const borderShadow = getBorderShadow(
      cellStyle?.borderPreset,
      cellStyle?.borderColor || "#5f6368",
      cellStyle?.borderWidth || 0.5,
    );

    return {
      ...style,
      background: cellStyle?.bg,
      color: cellStyle?.color,
      fontWeight: cellStyle?.bold ? "bold" : undefined,
      fontStyle: cellStyle?.italic ? "italic" : undefined,
      textDecoration: cellStyle?.underline ? "underline" : undefined,
      textAlign: cellStyle?.align,
      fontSize: cellStyle?.fontSize ? `${cellStyle.fontSize}px` : undefined,
      fontFamily: cellStyle?.fontFamily,
      boxShadow: borderShadow ? `${GRID_SHADOW}, ${borderShadow}` : GRID_SHADOW,
    };
  }, [style, cellStyle]);

  /* ---------- CONTENT ---------- */
  const contentStyle = useMemo(
    () => ({
      transform: `scale(${zoom})`,
      transformOrigin: "top left",
      width: `${100 / zoom}%`,
      height: "100%",

      display: "flex",
      flexDirection: "row",

      justifyContent: TEXT_ALIGN_MAP[cellStyle?.align] || "flex-start",
      alignItems: VERTICAL_ALIGN_MAP[cellStyle?.verticalAlign] || "flex-start",
    }),
    [zoom, cellStyle?.align, cellStyle?.verticalAlign],
  );

  /* ---------- RENDER ---------- */
  return (
    <div
      className={cx("cell", {
        active: isActive,
        selected: isSelected,
        clipboard: isClipboard,
      })}
      style={mergedStyle}
      data-row={row}
      data-col={col}
    >
      {!isEditing && (
        <div className={cx("cell-content")} style={contentStyle}>
          {value}
        </div>
      )}
    </div>
  );
}

export default memo(Cell);
