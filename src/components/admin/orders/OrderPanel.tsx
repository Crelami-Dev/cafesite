"use client";

import { useDialogFocus } from "../useDialogFocus";
import type { OrderPanelProps } from "@/types";

/** A right-hand panel on wide screens and landscape tablets; a sheet in portrait. */
export default function OrderPanel({ titleId, onClose, children }: OrderPanelProps): React.JSX.Element {
  useDialogFocus(onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal-darkest/80 dashboard-wide:items-stretch dashboard-wide:justify-end"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <aside role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-y-auto overscroll-contain rounded-t-2xl border border-offwhite/10 bg-charcoal shadow-floating dashboard-wide:h-full dashboard-wide:max-h-none dashboard-wide:max-w-xl dashboard-wide:rounded-none dashboard-wide:border-y-0 dashboard-wide:border-r-0">
        <div aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-offwhite/20 dashboard-wide:hidden" />
        {children}
      </aside>
    </div>
  );
}
