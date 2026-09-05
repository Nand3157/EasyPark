import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Quiet elevated card. Theme comes from `.dark` / `.light` ancestors via
 * the `.surface` token — call sites never branch on theme for chrome.
 */
export function Card({
  className,
  hover = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn("surface", hover && "surface-hover", className)}
      {...props}
    />
  );
}

export function CardIcon({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex size-12 items-center justify-center rounded-2xl",
        "bg-blue-600/10 text-blue-600 dark:bg-white/5 dark:text-blue-400",
        className
      )}
    >
      {children}
    </div>
  );
}
