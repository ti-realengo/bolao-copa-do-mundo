import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-white shadow-[0_8px_24px_-8px_hsl(var(--brand-primary)/0.55)] hover:brightness-110 hover:shadow-[0_10px_28px_-8px_hsl(var(--brand-primary)/0.7)] active:brightness-95",
        outline:
          "border border-brand-border-strong bg-transparent text-brand-text hover:bg-brand-card hover:border-brand-text-muted",
        ghost: "hover:bg-brand-card text-brand-text",
        secondary: "bg-brand-secondary text-brand-text hover:opacity-90",
        link: "text-brand-primary underline-offset-4 hover:underline",
        subtle:
          "bg-brand-card border border-brand-border text-brand-text hover:bg-brand-surface-2",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-lg text-xs",
        lg: "h-12 px-7 rounded-xl text-base",
        xl: "h-14 px-8 rounded-2xl text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
