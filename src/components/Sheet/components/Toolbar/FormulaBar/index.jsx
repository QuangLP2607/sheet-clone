import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./formula-bar.module.scss";

import { useSheetSelectionStore } from "../../../stores/selectionStore";
import { useDataStore } from "../../../stores/dataStore";
import { useShallow } from "zustand/react/shallow";

const cx = classNames.bind(styles);

function getColumnLabel(col) {
  let label = "";

  while (col >= 0) {
    label = String.fromCharCode((col % 26) + 65) + label;
    col = Math.floor(col / 26) - 1;
  }

  return label;
}

export default function FormulaBar() {
  const navigate = useNavigate();

  const {
    activeCell,
    editingCell,
    editingValue,
    setEditingValue,
    startEditing,
    commitEditing,
  } = useSheetSelectionStore(
    useShallow((s) => ({
      activeCell: s.activeCell,
      editingCell: s.editingCell,
      editingValue: s.editingValue,
      setEditingValue: s.setEditingValue,
      startEditing: s.startEditing,
      commitEditing: s.commitEditing,
    })),
  );

  const cells = useDataStore((s) => s.cells);

  let displayValue = "";

  if (editingCell) {
    displayValue = editingValue;
  } else if (activeCell) {
    const key = `${activeCell[0]}:${activeCell[1]}`;
    displayValue = cells[key] || "";
  }

  return (
    <div className={cx("toolbar")}>
      <button className={cx("toolbar__backBtn")} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className={cx("toolbar__info")}>
        <span className={cx("toolbar__info-address")}>
          {activeCell && `${getColumnLabel(activeCell[1])}${activeCell[0] + 1}`}
        </span>

        <textarea
          className={cx("toolbar__info-value")}
          value={displayValue}
          placeholder="Enter value..."
          onChange={(e) => {
            if (!editingCell && activeCell) {
              startEditing(activeCell[0], activeCell[1]);
            }

            setEditingValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitEditing();
            }
          }}
        />
      </div>
    </div>
  );
}
