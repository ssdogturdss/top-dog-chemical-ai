import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border-2 active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary shadow-[0_4px_0_0_hsl(var(--primary))] hover:brightness-110",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive shadow-[0_4px_0_0_hsl(var(--destructive))] hover:brightness-110",
        outline:
          "border-secondary text-secondary bg-transparent shadow-[0_4px_0_0_hsl(var(--secondary))] hover:bg-secondary hover:text-secondary-foreground dark:border-border dark:text-foreground dark:shadow-[0_4px_0_0_hsl(var(--border))]",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary shadow-[0_4px_0_0_hsl(var(--secondary))] hover:brightness-110",
        ghost: "border-transparent hover:bg-accent hover:text-accent-foreground active:translate-y-0",
        link: "border-transparent text-primary active:translate-y-0 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 px-4 text-xs shadow-[0_3px_0_0_hsl(var(--primary))] active:translate-y-[3px]",
        lg: "h-14 px-8 text-base shadow-[0_5px_0_0_hsl(var(--primary))] active:translate-y-[5px]",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Adjust shadow color dynamically if not default primary
    let customClass = className;
    if (variant === 'destructive' && size === 'sm') customClass = cn(className, "shadow-[0_3px_0_0_hsl(var(--destructive))]");
    if (variant === 'secondary' && size === 'sm') customClass = cn(className, "shadow-[0_3px_0_0_hsl(var(--secondary))]");
    if (variant === 'outline' && size === 'sm') customClass = cn(className, "shadow-[0_3px_0_0_hsl(var(--secondary))]");

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className: customClass }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
