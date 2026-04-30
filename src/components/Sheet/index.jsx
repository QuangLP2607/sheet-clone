import { useRef, useEffect, useCallback, useMemo } from "react";
import React from "react";
import { VariableSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

// stores
import { useDataStore } from "./stores/dataStore";
import { useSizeStore } from "./stores/sizeStore";
import { useViewportStore } from "./stores/viewportStore";
import { useSelectionStore } from "./stores/selectionStore";
import { useEditingStore } from "./stores/editingStore";

// hooks
import useSheetZoom from "./hooks/useSheetZoom";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useSheetKeyboard from "./hooks/useSheetKeyboard";

// components
import Toolbar from "./components/Toolbar";
import Cell from "./components/Cell";
import ColumnHeader from "./components/ColumnHeader";
import RowHeader from "./components/RowHeader";
import CellEditorOverlay from "./components/CellEditorOverlay";
import Corner from "./components/Corner";

// styles
import classNames from "classnames/bind";
import styles from "./sheet.module.scss";

const cx = classNames.bind(styles);

const ROW_HEADER_WIDTH = 50;
const COLUMN_HEADER_HEIGHT = 22;

/* ================= COLUMN LABEL ================= */
const columnLabelCache = new Map();

const getColumnLabel = (i) => {
  if (columnLabelCache.has(i)) return columnLabelCache.get(i);

  let label = "";
  let n = i + 1;

  while (n > 0) {
    const r = (n - 1) % 26;
    label = String.fromCharCode(65 + r) + label;
    n = Math.floor((n - 1) / 26);
  }

  columnLabelCache.set(i, label);
  return label;
};

/* ================= CELL ================= */
const CellRenderer = React.memo(({ columnIndex, rowIndex, style }) => {
  return <Cell row={rowIndex} col={columnIndex} style={style} />;
});

/* ================= SHEET ================= */
export default function Sheet({ className }) {
  /* ---------- data ---------- */
  const rows = useDataStore((s) => s.rows);
  const cols = useDataStore((s) => s.cols);
  const ensureSize = useDataStore((s) => s.ensureSize);

  /* ---------- size ---------- */
  const colSizes = useSizeStore((s) => s.colSizes);
  const rowSizes = useSizeStore((s) => s.rowSizes);
  const getColumnWidth = useSizeStore((s) => s.getColumnWidth);
  const getRowHeight = useSizeStore((s) => s.getRowHeight);

  /* ---------- viewport ---------- */
  const setScroll = useViewportStore((s) => s.setScroll);
  const scrollLeft = useViewportStore((s) => s.scrollLeft);
  const scrollTop = useViewportStore((s) => s.scrollTop);
  const zoom = useViewportStore((s) => s.zoom);

  /* ---------- refs ---------- */
  const gridRef = useRef(null);
  const wrapperRef = useRef(null);
  const dataRef = useRef(null);

  /* ---------- hooks ---------- */
  useSheetZoom(wrapperRef, gridRef);
  useKeyboardShortcuts({ rows, cols });
  useSheetKeyboard({ rows, cols });

  /* ---------- reset grid on zoom ---------- */
  useEffect(() => {
    gridRef.current?.resetAfterIndices({
      columnIndex: 0,
      rowIndex: 0,
      shouldForceUpdate: true,
    });
  }, [zoom]);

  /* ---------- scale ---------- */
  const scaledRowHeaderWidth = useMemo(() => ROW_HEADER_WIDTH * zoom, [zoom]);

  const scaledColumnHeaderHeight = useMemo(
    () => COLUMN_HEADER_HEIGHT * zoom,
    [zoom],
  );

  /* ---------- size funcs ---------- */
  const columnWidth = useCallback(
    (i) => getColumnWidth(i) * zoom,
    [getColumnWidth, zoom],
  );

  const rowHeight = useCallback(
    (i) => getRowHeight(i) * zoom,
    [getRowHeight, zoom],
  );

  /* ---------- scroll ---------- */
  const handleScroll = useCallback(
    ({ scrollLeft, scrollTop }) => {
      setScroll(scrollLeft, scrollTop);
    },
    [setScroll],
  );

  /* ---------- labels ---------- */
  const rowLabel = useCallback((i) => i + 1, []);

  /* ================= MOUSE ================= */

  const handleMouseDown = useCallback((e) => {
    const cellEl = e.target.closest("[data-row]");
    if (!cellEl) return;

    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);

    const selection = useSelectionStore.getState();
    const editing = useEditingStore.getState();

    if (editing.editingCell) {
      editing.commitEditing();
    }

    selection.startSelection(row, col);
  }, []);

  const handleMouseOver = useCallback((e) => {
    const cellEl = e.target.closest("[data-row]");
    if (!cellEl) return;

    const selection = useSelectionStore.getState();

    if (!selection.isSelecting) return;

    selection.updateSelection(
      Number(cellEl.dataset.row),
      Number(cellEl.dataset.col),
    );
  }, []);

  const handleMouseUp = useCallback(() => {
    useSelectionStore.getState().stopSelection();
  }, []);

  const handleDoubleClick = useCallback((e) => {
    const cellEl = e.target.closest("[data-row]");
    if (!cellEl) return;

    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);

    useEditingStore.getState().startEditing(row, col);
  }, []);

  /* ---------- global mouse up ---------- */
  useEffect(() => {
    const stop = () => useSelectionStore.getState().stopSelection();

    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  /* ================= RENDER ================= */

  return (
    <div className={cx("sheet", className)}>
      <Toolbar />

      <div ref={wrapperRef} className={cx("grid-wrapper")}>
        <AutoSizer>
          {({ width, height }) => {
            const gridWidth = width - scaledRowHeaderWidth;
            const gridHeight = height - scaledColumnHeaderHeight;

            return (
              <>
                {/* ===== DATA GRID ===== */}
                <div
                  ref={dataRef}
                  className={cx("data")}
                  style={{
                    position: "absolute",
                    top: scaledColumnHeaderHeight,
                    left: scaledRowHeaderWidth,
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseOver={handleMouseOver}
                  onMouseUp={handleMouseUp}
                  onDoubleClick={handleDoubleClick}
                >
                  <Grid
                    ref={gridRef}
                    columnCount={cols}
                    rowCount={rows}
                    columnWidth={columnWidth}
                    rowHeight={rowHeight}
                    width={gridWidth}
                    height={gridHeight}
                    onScroll={handleScroll}
                    onItemsRendered={({
                      visibleRowStopIndex,
                      visibleColumnStopIndex,
                    }) => {
                      ensureSize(visibleRowStopIndex, visibleColumnStopIndex);
                    }}
                    overscanRowCount={10}
                    overscanColumnCount={5}
                  >
                    {CellRenderer}
                  </Grid>

                  <CellEditorOverlay zoom={zoom} dataRef={dataRef} />
                </div>

                {/* ===== CORNER ===== */}
                <Corner
                  width={scaledRowHeaderWidth}
                  height={scaledColumnHeaderHeight}
                  rows={rows}
                  cols={cols}
                />

                {/* ===== COLUMN HEADER ===== */}
                <div
                  className={cx("columnHeader")}
                  style={{
                    width,
                    height: scaledColumnHeaderHeight,
                    left: scaledRowHeaderWidth,
                  }}
                >
                  <ColumnHeader
                    gridRef={gridRef}
                    cols={cols}
                    colSizes={colSizes}
                    scrollLeft={scrollLeft}
                    viewportWidth={gridWidth}
                    labelFn={getColumnLabel}
                    zoom={zoom}
                  />
                </div>

                {/* ===== ROW HEADER ===== */}
                <div
                  className={cx("rowHeader")}
                  style={{
                    width: scaledRowHeaderWidth,
                    height,
                    top: scaledColumnHeaderHeight,
                  }}
                >
                  <RowHeader
                    gridRef={gridRef}
                    rows={rows}
                    rowSizes={rowSizes}
                    scrollTop={scrollTop}
                    viewportHeight={gridHeight}
                    labelFn={rowLabel}
                    zoom={zoom}
                  />
                </div>
              </>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
}
