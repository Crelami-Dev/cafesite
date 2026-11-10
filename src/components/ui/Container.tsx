import React from "react";

export interface ContainerProps {
  as?: "div" | "section" | "article" | "header" | "footer";
  size?: "default" | "narrow" | "wide";
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Komponen UI Container dasar CafeSite (Server Component)
 * Menjaga lebar konten konsisten dan mencegah overflow horizontal di layar 375px
 */
export function Container({
  as: Component = "div",
  size = "default",
  children,
  className = "",
  id,
}: ContainerProps) {
  const sizeClasses = {
    narrow: "max-w-4xl",
    default: "max-w-[1200px]",
    wide: "max-w-[1200px]",
  };

  return (
    <Component
      id={id}
      className={`wrap w-[calc(100%-48px)] mx-auto ${sizeClasses[size]} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
