import * as React from "react";
import { cn } from "@/lib/utils";

// Standard label for control fields: small uppercase muted text.
const FieldLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className,
  ...props
}) => (
  <label
    className={cn("text-[11px] font-medium uppercase tracking-wider text-white/40", className)}
    {...props}
  />
);

export default FieldLabel;
