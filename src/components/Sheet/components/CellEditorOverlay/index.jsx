import { useLayoutEffect, useRef, useState } from "react";
import { useEditingStore } from "../../stores/editingStore";
import { useCellStyleStore } from "../../stores/cellStyleStore";
import classNames from "classnames/bind";
import styles from "./cellEditorOverlay.module.scss";

const cx = classNames.bind(styles);

/* ================= CONST ================= */

const MAX_HEIGHT = 200;
const PADDING_X = 6;
const PADDING_Y = 2;
const BASE_FONT_SIZE = 14;
const LINE_HEIGHT_MULTIPLIER = 1.2;

/* ================= COMPONENT ================= */

export default function CellEditorOverlay({ zoom, dataRef }) {
  /* ---------- editing store ---------- */
  const editingCell = useEditingStore((s) => s.editingCell);
  const editingValue = useEditingStore((s) => s.editingValue);
  const setEditingValue = useEditingStore((s) => s.setEditingValue);
  const commitEditing = useEditingStore((s) => s.commitEditing);
  const cancelEditing = useEditingStore((s) => s.cancelEditing);

  /* ---------- style ---------- */
  const editingCellStyle = useCellStyleStore((s) => {
    if (!editingCell) return null;
    return s.styles[`${editingCell[0]}:${editingCell[1]}`];
  });

  /* ---------- refs ---------- */
  const inputRef = useRef(null);
  const measureRef = useRef(null);

  /* ---------- state ---------- */
  const [rect, setRect] = useState(null);

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ================= POSITION ================= */

  useLayoutEffect(() => {
    if (!editingCell || !dataRef?.current) return;

    const [row, col] = editingCell;

    const el = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!el) return;

    const cell = el.getBoundingClientRect();
    const sheet = dataRef.current.getBoundingClientRect();

    setRect({
      x: cell.left,
      y: cell.top,
      w: cell.width,
      h: cell.height,
      maxW: sheet.right - cell.left,
      maxH: sheet.bottom - cell.top,
    });
  }, [editingCell, dataRef]);

  /* ================= FOCUS ================= */

  useLayoutEffect(() => {
    if (!editingCell) return;

    const raf = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;

      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });

    return () => cancelAnimationFrame(raf);
  }, [editingCell]);

  /* ================= AUTO SIZE ================= */

  useLayoutEffect(() => {
    const el = inputRef.current;
    const measure = measureRef.current;
    if (!el || !measure || !rect) return;

    /* ===== HEIGHT ===== */
    el.style.height = "auto";

    const style = getComputedStyle(el);
    const border =
      parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);

    const contentHeight = el.scrollHeight + border;

    el.style.height =
      clamp(contentHeight, rect.h, Math.min(MAX_HEIGHT, rect.maxH)) + "px";

    /* ===== WIDTH ===== */
    measure.textContent = editingValue || " ";
    const textWidth = measure.scrollWidth + PADDING_X * 2;

    el.style.width = clamp(textWidth, rect.w, rect.maxW) + "px";
  }, [editingValue, rect]);

  /* ================= CLICK OUTSIDE ================= */

  useLayoutEffect(() => {
    if (!editingCell) return;

    const handle = (e) => {
      const el = inputRef.current;
      if (!el) return;

      if (!el.contains(e.target)) {
        commitEditing();
      }
    };

    window.addEventListener("pointerdown", handle, true);
    return () => window.removeEventListener("pointerdown", handle, true);
  }, [editingCell, commitEditing]);

  /* ================= STYLE ================= */

  const fontSize = BASE_FONT_SIZE * zoom;

  const textStyle = {
    lineHeight: `${fontSize * LINE_HEIGHT_MULTIPLIER}px`,
    fontWeight: editingCellStyle?.bold ? "bold" : undefined,
    fontStyle: editingCellStyle?.italic ? "italic" : undefined,
    textDecoration: editingCellStyle?.underline ? "underline" : undefined,
    textAlign: editingCellStyle?.align,
    fontSize: editingCellStyle?.fontSize
      ? `${editingCellStyle.fontSize * zoom}px`
      : fontSize,
    fontFamily: editingCellStyle?.fontFamily,
    color: editingCellStyle?.color,
    background: editingCellStyle?.bg,
    padding: `${PADDING_Y}px ${PADDING_X}px`,
  };

  /* ================= RENDER ================= */

  if (!editingCell || !rect) return null;

  return (
    <>
      {/* ===== MEASURE ===== */}
      <span
        ref={measureRef}
        style={{
          position: "fixed",
          visibility: "hidden",
          whiteSpace: "pre",
          ...textStyle,
        }}
      />

      {/* ===== EDITOR ===== */}
      <textarea
        ref={inputRef}
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onBlur={commitEditing}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commitEditing();
          }
          if (e.key === "Escape") cancelEditing();
        }}
        spellCheck={false}
        className={cx("cell-editor")}
        style={{
          position: "fixed",
          top: rect.y,
          left: rect.x,
          width: rect.w,
          minHeight: 0,
          maxHeight: MAX_HEIGHT,
          ...textStyle,
        }}
      />
    </>
  );
}
