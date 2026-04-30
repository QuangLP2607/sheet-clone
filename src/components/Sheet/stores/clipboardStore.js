import { create } from "zustand";

/* ================= CLIPBOARD STORE ================= */

export const useClipboardStore = create((set) => ({
  /* ---------- state ---------- */
  clipboard: {
    range: null,
    mode: null, // "copy" | "cut"
    data: null,
  },

  /* ---------- actions ---------- */

  // set clipboard
  setClipboard: (payload) =>
    set({
      clipboard: {
        range: payload?.range || null,
        mode: payload?.mode || null,
        data: payload?.data ? structuredClone(payload.data) : null,
      },
    }),

  // clear clipboard
  clearClipboard: () =>
    set({
      clipboard: {
        range: null,
        mode: null,
        data: null,
      },
    }),
}));
