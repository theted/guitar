import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type PickerOption = { value: string; label: string };
export type PickerGroup = { label?: string; options: PickerOption[] };

type PickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** Flat list of options; use `groups` instead for sectioned content */
  options?: PickerOption[];
  groups?: PickerGroup[];
  "aria-label"?: string;
  /** `field` is a boxed control; `title` renders the value as the page title */
  variant?: "field" | "title";
  disabled?: boolean;
  className?: string;
  title?: string;
};

const TRIGGER: Record<NonNullable<PickerProps["variant"]>, string> = {
  field:
    "h-9 w-full gap-2 rounded-lg border border-line bg-raised px-3 text-sm text-ink hover:border-ink-3 data-[state=open]:border-ink",
  title:
    "type-title -mx-1 gap-2 rounded-lg px-1 text-left text-[clamp(2rem,4.6vw,3.4rem)] text-ink hover:bg-surface data-[state=open]:bg-surface",
};

const ICON: Record<NonNullable<PickerProps["variant"]>, string> = {
  field: "h-4 w-4 shrink-0 text-ink-3",
  title: "h-[0.5em] w-[0.5em] shrink-0 stroke-[2.5] text-ink-3",
};

// The one select used across the app: Radix for keyboard and screen-reader
// behaviour, styled from the page tokens so it works inside `.inverse` too.
export const Picker: React.FC<PickerProps> = ({
  value,
  onValueChange,
  options,
  groups,
  "aria-label": ariaLabel,
  variant = "field",
  disabled,
  className,
  title,
}) => (
  <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectPrimitive.Trigger
      aria-label={ariaLabel}
      title={title}
      className={cn(
        "inline-flex min-w-0 items-center justify-between outline-none transition-colors disabled:opacity-40",
        TRIGGER[variant],
        className
      )}
    >
      <span className="truncate">
        <SelectPrimitive.Value />
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className={ICON[variant]} aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>

    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        collisionPadding={12}
        className="relative z-50 max-h-[min(28rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-raised text-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.35)]"
      >
        <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-ink-3">
          <ChevronUp className="h-4 w-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1.5">
          {options?.map((option) => (
            <Item key={option.value} option={option} />
          ))}
          {groups?.map((group, index) => (
            <SelectPrimitive.Group key={group.label ?? index} className="[&+&]:mt-1 [&+&]:border-t [&+&]:border-line [&+&]:pt-1">
              {group.label && (
                <SelectPrimitive.Label className="px-2.5 pb-1 pt-2 text-xs font-medium text-ink-3">
                  {group.label}
                </SelectPrimitive.Label>
              )}
              {group.options.map((option) => (
                <Item key={option.value} option={option} />
              ))}
            </SelectPrimitive.Group>
          ))}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-ink-3">
          <ChevronDown className="h-4 w-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
);

const Item: React.FC<{ option: PickerOption }> = ({ option }) => (
  <SelectPrimitive.Item
    value={option.value}
    className="relative flex cursor-default select-none items-center rounded-md py-1.5 pl-2.5 pr-8 text-sm outline-none data-[highlighted]:bg-surface data-[state=checked]:font-semibold"
  >
    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute right-2.5">
      <Check className="h-3.5 w-3.5" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
);
