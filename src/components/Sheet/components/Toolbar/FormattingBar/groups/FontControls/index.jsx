import { memo, useCallback, useMemo } from "react";
import ToolGroup from "../../base/ToolGroup";
import ToolCombobox from "../../base/ToolCombobox";

import { useCellStyleStore } from "../../../../../stores/cellStyleStore";
import { useSelectionStore } from "../../../../../stores/selectionStore";
import { useShallow } from "zustand/react/shallow";

import { Icon } from "@iconify/react";

import styles from "./font-controls.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

/* ================= OPTIONS ================= */

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif" },
  { label: "Times", value: '"Times New Roman", serif' },
  { label: "Mono", value: '"JetBrains Mono", Consolas, monospace' },
];

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28].map((s) => ({
  label: String(s),
  value: s,
}));

/* ================= UTILS ================= */

function parseFontSize(input) {
  const cleaned = input.trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Math.min(200, Math.max(6, n));
}

function clampFontSize(n) {
  return Math.min(200, Math.max(6, n));
}

/* ================= COMPONENT ================= */

export default memo(function FontControls({
  disabled,
  setFontFamily,
  setFontSize,
}) {
  /* ---------- selection ---------- */
  const { selectedRange, activeCell } = useSelectionStore(
    useShallow((s) => ({
      selectedRange: s.selectedRange,
      activeCell: s.activeCell,
    })),
  );

  /* ---------- anchor cell ---------- */
  const anchor = selectedRange
    ? [selectedRange[0], selectedRange[1]]
    : activeCell;

  /* ---------- style ---------- */
  const style = useCellStyleStore(
    useCallback(
      (state) => {
        if (!anchor) return null;
        return state.styles[`${anchor[0]}:${anchor[1]}`] || null;
      },
      [anchor],
    ),
  );

  /* ---------- derived ---------- */
  const fontFamily = style?.fontFamily ?? FONT_OPTIONS[0].value;
  const fontSize = style?.fontSize ?? 16;

  /* ---------- handlers ---------- */
  const handleDecrease = useCallback(() => {
    setFontSize(clampFontSize(fontSize - 1));
  }, [fontSize, setFontSize]);

  const handleIncrease = useCallback(() => {
    setFontSize(clampFontSize(fontSize + 1));
  }, [fontSize, setFontSize]);

  const handleChangeSize = useCallback(
    (v) => {
      if (v == null) return;
      setFontSize(clampFontSize(v));
    },
    [setFontSize],
  );

  /* ---------- render ---------- */
  return (
    <ToolGroup>
      {/* ===== FONT FAMILY ===== */}
      <ToolCombobox
        value={fontFamily}
        options={FONT_OPTIONS}
        onChange={setFontFamily}
        disabled={disabled}
        width={100}
        allowCustom={false}
        clearOnFocus
      />

      {/* ===== FONT SIZE ===== */}
      <div className={cx("font-size-group")}>
        <button
          className={cx("font-size-button")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleDecrease}
          disabled={disabled}
        >
          <Icon icon="ph:minus" width="16" height="16" />
        </button>

        <ToolCombobox
          value={fontSize}
          options={FONT_SIZE_OPTIONS}
          onChange={handleChangeSize}
          disabled={disabled}
          width={40}
          textAlign="center"
          allowCustom
          parseInput={parseFontSize}
          disableFilter
        />

        <button
          className={cx("font-size-button")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleIncrease}
          disabled={disabled}
        >
          <Icon icon="ph:plus" width="16" height="16" />
        </button>
      </div>
    </ToolGroup>
  );
});
