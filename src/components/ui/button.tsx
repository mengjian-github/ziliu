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
      default: "bg-gradient-to-r from-primary via-[#3b82f6] to-secondary text-white shadow-[0_0_30px_-10px_rgba(0,136,255,0.6)] hover:shadow-[0_0_40px_-5px_rgba(0,136,255,0.8)] hover:scale-[1.02] active:scale-[0.98] border border-white/10",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline: "border border-white/10 bg-white/5 text-white backdrop-blur-md shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:border-white/20 hover:text-white transition-all",
      secondary: "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 shadow-[0_0_20px_-10px_rgba(0,217,255,0.3)]",
      ghost: "text-muted-foreground hover:text-white hover:bg-white/5",
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
