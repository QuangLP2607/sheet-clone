import { useCallback } from "react";
import { useSelectionStore } from "../../stores/selectionStore";
import { useEditingStore } from "../../stores/editingStore";

import classNames from "classnames/bind";
import styles from "./corner.module.scss";

const cx = classNames.bind(styles);

/* ================= COMPONENT ================= */

export default function Corner({ width, height, rows, cols }) {
  const handleSelectAll = useCallback(
    (e) => {
      e.preventDefault();

      const selection = useSelectionStore.getState();
      const editing = useEditingStore.getState();

      const maxRow = Math.max(0, rows - 1);
      const maxCol = Math.max(0, cols - 1);

      /* ---------- commit editing nếu đang edit ---------- */
      if (editing.editingCell) {
        editing.commitEditing();
      }

      /* ---------- select all ---------- */
      selection.startSelection(0, 0);
      selection.updateSelection(maxRow, maxCol);
      selection.stopSelection();
    },
    [rows, cols],
  );

  return (
    <button
      type="button"
      className={cx("corner")}
      style={{ width, height }}
      onMouseDown={handleSelectAll}
      title="Select all cells"
      aria-label="Select all cells"
    />
  );
}
