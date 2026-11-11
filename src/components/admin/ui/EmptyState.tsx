import type { ReactNode } from "react";

export default function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-offwhite/15 px-5 py-10 text-center">
      {icon && <span className="text-offwhite-darker">{icon}</span>}
      <p className="text-base font-medium text-offwhite">{title}</p>
      {hint && <p className="max-w-xs text-sm text-offwhite-muted">{hint}</p>}
      {action}
    </div>
  );
}
