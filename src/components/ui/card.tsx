import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLElement> & { children: ReactNode };

export function Card({ children, className, ...props }: CardProps) {
  return (
    <article className={cn("card", className)} {...props}>
      {children}
    </article>
  );
}
