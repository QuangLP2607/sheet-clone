import classNames from "classnames/bind";
import styles from "./formatting-bar.module.scss";

import { useSelectionStore } from "../../../stores/selectionStore";
import useCellFormatting from "../../../hooks/useCellFormatting";
import { useShallow } from "zustand/react/shallow";

import HistoryControls from "./groups/HistoryControls";
import FontControls from "./groups/FontControls";
import TextStyleControls from "./groups/TextStyleControls";
import AlignControls from "./groups/AlignControls";
import VerticalAlignControls from "./groups/VerticalAlignControls";
import ColorControls from "./groups/ColorControls";
import BorderControls from "./groups/BorderControls";

const cx = classNames.bind(styles);

/* ================= COMPONENT ================= */

export default function FormattingBar() {
  /* ---------- selection ---------- */
  const { selectedRange, activeCell } = useSelectionStore(
    useShallow((s) => ({
      selectedRange: s.selectedRange,
      activeCell: s.activeCell,
    })),
  );

  /* ---------- formatting ---------- */
  const formatting = useCellFormatting();

  /* ---------- state ---------- */
  const hasSelection = !!(selectedRange || activeCell);
  const disabled = !hasSelection;

  /* ---------- render ---------- */
  return (
    <div className={cx("formatting-bar")}>
      <HistoryControls {...formatting} />

      <FontControls {...formatting} disabled={disabled} />
      <TextStyleControls {...formatting} disabled={disabled} />
      <AlignControls {...formatting} disabled={disabled} />
      <VerticalAlignControls {...formatting} disabled={disabled} />
      <ColorControls {...formatting} disabled={disabled} />
      <BorderControls {...formatting} disabled={disabled} />

      <button
        className={cx("clear-btn")}
        onClick={formatting.clearFormatting}
        disabled={disabled}
      >
        Clear
      </button>
    </div>
  );
}
