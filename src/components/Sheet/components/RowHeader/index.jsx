import { useCallback } from "react";
import { useSizeStore } from "../../stores/sizeStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useDataStore } from "../../stores/dataStore";
import { useShallow } from "zustand/react/shallow";

import classNames from "classnames/bind";
import styles from "./row-header.module.scss";

const cx = classNames.bind(styles);

const DEFAULT_HEIGHT = 22;
const OVERSCAN_ROWS = 4;

/* ================= COMPONENT ================= */

export default function RowHeader({
  rows,
  rowSizes,
  scrollTop,
  viewportHeight,
  labelFn,
  zoom,
  gridRef,
}) {
  /* ================= store ================= */

  const resizeRow = useSizeStore((s) => s.resizeRow);

  const { activeCell, selectedRange } = useSelectionStore(
    useShallow((s) => ({
      activeCell: s.activeCell,
      selectedRange: s.selectedRange,
    })),
  );

  /* ================= resize ================= */

  const startResizeRow = useCallback(
    (e, index) => {
      e.preventDefault();
      e.stopPropagation();

      const startY = e.clientY;
      const startHeight = rowSizes[index] ?? DEFAULT_HEIGHT;

      let frame;

      const onMouseMove = (e) => {
        cancelAnimationFrame(frame);

        frame = requestAnimationFrame(() => {
          const delta = (e.clientY - startY) / zoom;
          const newHeight = Math.max(18, startHeight + delta);

          resizeRow(index, newHeight);
          gridRef.current?.resetAfterRowIndex(index);
        });
      };

      const onMouseUp = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [rowSizes, zoom, resizeRow, gridRef],
  );

  /* ================= select row ================= */

  const handleSelectRow = useCallback((rowIndex) => {
    const selection = useSelectionStore.getState();
    const cols = useDataStore.getState().cols;

    selection.startSelection(rowIndex, 0);
    selection.updateSelection(rowIndex, cols - 1);
    selection.stopSelection();
  }, []);

  /* ================= virtual ================= */

  let acc = 0;
  let start = 0;

  while (
    start < rows &&
    acc + (rowSizes[start] || DEFAULT_HEIGHT) * zoom < scrollTop
  ) {
    acc += (rowSizes[start] || DEFAULT_HEIGHT) * zoom;
    start++;
  }

  const offsetY = acc - scrollTop;

  let visibleHeight = 0;
  let end = start;

  while (end < rows && visibleHeight < viewportHeight) {
    visibleHeight += (rowSizes[end] || DEFAULT_HEIGHT) * zoom;
    end++;
  }

  end = Math.min(rows, end + OVERSCAN_ROWS);

  /* ================= render ================= */

  return (
    <div
      className={cx("inner")}
      style={{
        transform: `translate3d(0, ${offsetY}px, 0)`,
      }}
    >
      {Array.from({ length: Math.max(0, end - start) }).map((_, idx) => {
        const i = start + idx;
        const baseHeight = rowSizes[i] || DEFAULT_HEIGHT;

        /* ---------- selection ---------- */

        const isActiveRow = activeCell?.[0] === i;

        const isSelectedRow =
          selectedRange && i >= selectedRange[0] && i <= selectedRange[2];

        return (
          <div
            key={i}
            className={cx("cell", {
              active: isActiveRow,
              selected: isSelectedRow,
            })}
            style={{
              height: baseHeight * zoom,
              fontSize: 12 * zoom,
            }}
            onMouseDown={() => handleSelectRow(i)}
          >
            <span>{labelFn(i)}</span>

            {/* ===== RESIZE HANDLE ===== */}
            <div
              className={cx("resize")}
              onMouseDown={(e) => startResizeRow(e, i)}
            />
          </div>
        );
      })}
    </div>
  );
}
