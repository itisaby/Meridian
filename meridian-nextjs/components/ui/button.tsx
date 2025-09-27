import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
        const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"

        const variantClasses = {
            default: "bg-blue-600 text-white hover:bg-blue-700",
            destructive: "bg-red-600 text-white hover:bg-red-700",
            outline: "border border-gray-300 bg-white hover:bg-gray-50",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
            ghost: "hover:bg-gray-100",
            link: "text-blue-600 underline-offset-4 hover:underline",
        }

        const sizeClasses = {
            default: "h-10 px-4 py-2",
            sm: "h-9 px-3 text-xs",
            lg: "h-11 px-8",
            icon: "h-10 w-10",
        }

        const Comp = asChild ? 'span' : 'button'

        return (
            <Comp
                className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
