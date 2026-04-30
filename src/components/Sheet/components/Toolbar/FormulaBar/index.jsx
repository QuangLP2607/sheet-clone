import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./formula-bar.module.scss";

import { useSelectionStore } from "../../../stores/selectionStore";
import { useEditingStore } from "../../../stores/editingStore";
import { useDataStore } from "../../../stores/dataStore";
import { useShallow } from "zustand/react/shallow";

const cx = classNames.bind(styles);

/* ================= UTILS ================= */

function getColumnLabel(col) {
  let label = "";

  while (col >= 0) {
    label = String.fromCharCode((col % 26) + 65) + label;
    col = Math.floor(col / 26) - 1;
  }

  return label;
}

/* ================= COMPONENT ================= */

export default function FormulaBar() {
  const navigate = useNavigate();

  /* ---------- selection ---------- */
  const activeCell = useSelectionStore((s) => s.activeCell);

  /* ---------- editing ---------- */
  const {
    editingCell,
    editingValue,
    setEditingValue,
    startEditing,
    commitEditing,
  } = useEditingStore(
    useShallow((s) => ({
      editingCell: s.editingCell,
      editingValue: s.editingValue,
      setEditingValue: s.setEditingValue,
      startEditing: s.startEditing,
      commitEditing: s.commitEditing,
    })),
  );

  /* ---------- data ---------- */
  const cells = useDataStore((s) => s.cells);

  /* ================= VALUE ================= */

  let displayValue = "";

  if (editingCell) {
    displayValue = editingValue;
  } else if (activeCell) {
    const key = `${activeCell[0]}:${activeCell[1]}`;
    displayValue = cells[key] || "";
  }

  /* ================= HANDLERS ================= */

  const handleChange = (e) => {
    const value = e.target.value;

    if (!editingCell && activeCell) {
      startEditing(activeCell[0], activeCell[1]);
    }

    setEditingValue(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitEditing();
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className={cx("toolbar")}>
      <button className={cx("toolbar__backBtn")} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className={cx("toolbar__info")}>
        {/* ===== ADDRESS ===== */}
        <span className={cx("toolbar__info-address")}>
          {activeCell && `${getColumnLabel(activeCell[1])}${activeCell[0] + 1}`}
        </span>

        {/* ===== INPUT ===== */}
        <textarea
          className={cx("toolbar__info-value")}
          value={displayValue}
          placeholder="Enter value..."
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
