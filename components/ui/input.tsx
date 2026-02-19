import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-black/40 dark:placeholder:text-white/40 selection:bg-black selection:text-white h-10 w-full min-w-0 border-2 border-black bg-white px-3 py-2 text-base font-normal transition-[box-shadow] outline-none file:inline-flex file:h-8 file:border-2 file:border-black file:bg-white file:text-sm file:font-bold file:uppercase file:tracking-wider file:cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-[#FF3000]",
        "aria-invalid:ring-2 aria-invalid:ring-[#FF3000]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
