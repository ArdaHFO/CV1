import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-2 border-black bg-white placeholder:text-black/50 focus-visible:border-[#FF3000] focus-visible:ring-[#FF3000]/50 aria-invalid:ring-[#FF3000]/20 aria-invalid:border-[#FF3000] flex field-sizing-content min-h-16 w-full px-3 py-2 text-sm font-medium uppercase tracking-widest transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
