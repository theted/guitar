import * as React from "react";
import { cn } from "@/lib/utils";

// Label for a control: small, sentence case, one step quieter than the value.
const FieldLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className,
  ...props
}) => (
  <label
    className={cn("text-xs font-medium text-ink-3", className)}
    {...props}
  />
);

export default FieldLabel;
