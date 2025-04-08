import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20",
        secondary:
          "border-[#2a2a35] bg-[#1a1a22] text-white hover:bg-[#1f1f2a]",
        destructive:
          "border-red-500/30 bg-red-900/20 text-red-300 hover:bg-red-900/30",
        outline: "border-[#2a2a35] text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
