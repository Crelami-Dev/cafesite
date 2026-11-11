import type { ReactNode } from "react";

/** Permukaan standar dashboard: charcoal-light, border 1px, radius 8px. */
export default function Card({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "li";
  "aria-label"?: string;
  "aria-labelledby"?: string;
}): React.JSX.Element {
  return (
    <Tag
      {...rest}
      className={`min-w-0 rounded-lg border border-offwhite/10 bg-charcoal-light p-4 sm:p-5 ${className}`}
    >
      {children}
    </Tag>
  );
}
