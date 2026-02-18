import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border-2 border-black px-2 py-1 text-[10px] font-black uppercase tracking-widest w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-[#FF3000] focus-visible:ring-[#FF3000]/50 focus-visible:ring-[3px] aria-invalid:ring-[#FF3000]/20 aria-invalid:border-[#FF3000] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white text-black [a&]:hover:bg-black [a&]:hover:text-white",
        secondary: "bg-[#F2F2F2] text-black [a&]:hover:bg-black [a&]:hover:text-white",
        destructive: "bg-[#FF3000] text-white [a&]:hover:bg-black [a&]:hover:text-white",
        outline: "bg-transparent text-black [a&]:hover:bg-black [a&]:hover:text-white",
        ghost: "border-transparent text-black [a&]:hover:bg-black [a&]:hover:text-white",
        link: "border-transparent text-black underline underline-offset-4 [a&]:hover:text-[#FF3000]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
