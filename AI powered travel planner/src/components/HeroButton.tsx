import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const heroButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-hero-gradient text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-muted",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface HeroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
}

const HeroButton = forwardRef<HTMLButtonElement, HeroButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(heroButtonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
);
HeroButton.displayName = "HeroButton";

export { HeroButton, heroButtonVariants };
