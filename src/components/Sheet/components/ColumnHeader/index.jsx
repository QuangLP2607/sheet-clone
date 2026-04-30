import { useCallback } from "react";
import { useSizeStore } from "../../stores/sizeStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useDataStore } from "../../stores/dataStore";
import { useShallow } from "zustand/react/shallow";

import classNames from "classnames/bind";
import styles from "./column-header.module.scss";

const cx = classNames.bind(styles);

const DEFAULT_WIDTH = 120;
const OVERSCAN_COLS = 2;

/* ================= COMPONENT ================= */

export default function ColumnHeader({
  cols,
  colSizes,
  scrollLeft,
  viewportWidth,
  labelFn,
  zoom,
  gridRef,
}) {
  /* ================= store ================= */

  const resizeColumn = useSizeStore((s) => s.resizeColumn);

  const { activeCell, selectedRange } = useSelectionStore(
    useShallow((s) => ({
      activeCell: s.activeCell,
      selectedRange: s.selectedRange,
    })),
  );

  /* ================= resize ================= */

  const startResize = useCallback(
    (e, index) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = colSizes[index] ?? DEFAULT_WIDTH;

      let frame;

      const onMouseMove = (e) => {
        cancelAnimationFrame(frame);

        frame = requestAnimationFrame(() => {
          const delta = (e.clientX - startX) / zoom;
          const newWidth = Math.max(40, startWidth + delta);

          resizeColumn(index, newWidth);
          gridRef.current?.resetAfterColumnIndex(index);
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
    [colSizes, zoom, resizeColumn, gridRef],
  );

  /* ================= select column ================= */

  const handleSelectColumn = useCallback((colIndex) => {
    const selection = useSelectionStore.getState();
    const rows = useDataStore.getState().rows;
    const lastRow = Math.max(0, rows - 1);

    selection.startSelection(0, colIndex);
    selection.updateSelection(lastRow, colIndex);
    selection.stopSelection();
  }, []);

  /* ================= virtual header ================= */

  let acc = 0;
  let start = 0;

  while (
    start < cols &&
    acc + (colSizes[start] || DEFAULT_WIDTH) * zoom < scrollLeft
  ) {
    acc += (colSizes[start] || DEFAULT_WIDTH) * zoom;
    start++;
  }

  const offsetX = acc - scrollLeft;

  let visibleWidth = 0;
  let end = start;

  while (end < cols && visibleWidth < viewportWidth) {
    visibleWidth += (colSizes[end] || DEFAULT_WIDTH) * zoom;
    end++;
  }

  end = Math.min(cols, end + OVERSCAN_COLS);

  /* ================= render ================= */

  return (
    <div
      className={cx("inner")}
      style={{
        transform: `translate3d(${offsetX}px, 0, 0)`,
      }}
    >
      {Array.from({ length: Math.max(0, end - start) }).map((_, idx) => {
        const i = start + idx;
        const baseWidth = colSizes[i] || DEFAULT_WIDTH;

        /* ---------- selection ---------- */

        const isActiveCol = activeCell?.[1] === i;

        const isSelectedCol =
          selectedRange && i >= selectedRange[1] && i <= selectedRange[3];

        return (
          <div
            key={i}
            className={cx("cell", {
              active: isActiveCol,
              selected: isSelectedCol,
            })}
            style={{
              width: baseWidth * zoom,
              fontSize: 12 * zoom,
            }}
            onMouseDown={() => handleSelectColumn(i)}
          >
            <span>{labelFn(i)}</span>

            {/* ===== RESIZE HANDLE ===== */}
            <div
              className={cx("resize")}
              onMouseDown={(e) => startResize(e, i)}
            />
          </div>
        );
      })}
    </div>
  );
}
