"use client";

import { useDialogFocus } from "../useDialogFocus";
import type { OrderPanelProps } from "@/types";

/**
 * Panel responsif untuk kasir:
 * - Desktop & Tablet Landscape (dashboard-wide): Aside menempel di sisi kanan layar (max-w-lg).
 * - Mobile & Tablet Portrait: Bottom sheet yang halus dengan drag handle bar (max-h-[88dvh]).
 */
export default function OrderPanel({ titleId, onClose, children }: OrderPanelProps): React.JSX.Element {
  useDialogFocus(onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal-darkest/75 backdrop-blur-xs transition-opacity dashboard-wide:items-stretch dashboard-wide:justify-end"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[88dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-2xl border-t border-offwhite/15 bg-charcoal shadow-2xl dashboard-wide:h-full dashboard-wide:max-h-none dashboard-wide:max-w-lg dashboard-wide:rounded-none dashboard-wide:border-l dashboard-wide:border-offwhite/10 dashboard-wide:border-t-0"
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-offwhite/20 dashboard-wide:hidden"
        />
        {children}
      </aside>
    </div>
  );
}
