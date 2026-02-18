"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  isDark?: boolean
  onToggle?: () => void
}

export function ThemeToggle({ className, isDark = true, onToggle }: ThemeToggleProps) {
  // next-themes
  // const { resolvedTheme, setTheme } = useTheme()
  // const isDark = resolvedTheme === "dark"
  // onClick={() => setTheme(isDark ? "light" : "dark")}

  return (
    <button
      type="button"
      className={cn(
        "flex h-10 items-center gap-2 border-2 border-black px-3 text-xs font-black uppercase tracking-widest transition-colors",
        isDark ? "bg-black text-white" : "bg-white text-black",
        className
      )}
      onClick={onToggle}
      aria-pressed={isDark}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {isDark ? "Dark" : "Light"}
      <span className="ml-auto h-2 w-2 bg-[#FF3000]" aria-hidden="true" />
    </button>
  )
}
