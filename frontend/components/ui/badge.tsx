import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export { Badge };
