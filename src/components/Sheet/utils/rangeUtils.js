export function normalizeRange(start, end, mode) {
  if (!start || !end) return null;

  const [sr, sc] = start;
  const [er, ec] = end;

  const minRow = Math.min(sr, er);
  const maxRow = Math.max(sr, er);
  const minCol = Math.min(sc, ec);
  const maxCol = Math.max(sc, ec);

  if (mode === "cell") return [sr, sc, sr, sc];

  if (mode === "linear") {
    const width = maxCol - minCol;
    const height = maxRow - minRow;

    return width >= height
      ? [sr, minCol, sr, maxCol]
      : [minRow, sc, maxRow, sc];
  }

  return [minRow, minCol, maxRow, maxCol];
}
