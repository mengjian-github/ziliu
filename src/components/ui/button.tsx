import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:translate-y-px"

    const variants = {
      default: "bg-gradient-to-r from-[#0066ff] via-[#2a80ff] to-[#00d4ff] text-white shadow-[0_18px_40px_-16px_rgba(0,102,255,0.65)] hover:shadow-[0_24px_60px_-18px_rgba(0,102,255,0.75)] hover:-translate-y-0.5",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5",
      outline: "border border-primary/25 bg-white/70 text-foreground shadow-[0_10px_30px_-20px_rgba(0,26,77,0.35)] hover:border-primary/40 hover:bg-white hover:shadow-[0_14px_40px_-22px_rgba(0,26,77,0.45)] hover:-translate-y-0.5",
      secondary: "bg-secondary text-secondary-foreground shadow-[0_14px_40px_-22px_rgba(0,212,255,0.55)] hover:bg-secondary/90 hover:-translate-y-0.5",
      ghost: "text-foreground hover:bg-primary/8 hover:text-foreground hover:-translate-y-0.5",
      link: "text-primary underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-11 px-6 py-2",
      sm: "h-9 px-4 py-1 text-xs",
      lg: "h-12 px-8 py-3 text-base",
      icon: "h-11 w-11",
    }

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
