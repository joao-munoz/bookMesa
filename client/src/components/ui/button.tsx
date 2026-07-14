import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const variants = {
  primary: "bg-accent text-white hover:bg-accent-light shadow-sm",
  secondary: "bg-primary text-white hover:bg-primary-light",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "text-muted hover:text-[#2C2C2C] hover:bg-[#E2DDD5]/50",
  outline: "border border-border bg-transparent hover:bg-[#F5F4F0]",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-btn",
  lg: "h-12 px-6 text-btn",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-display font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
