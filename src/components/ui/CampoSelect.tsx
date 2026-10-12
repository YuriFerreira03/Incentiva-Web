import { forwardRef } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

// Mesmo visual do Input, para listas de opções.
export const CampoSelect = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-lg px-4 py-2.5 text-sm",
            "bg-white/5 border border-white/10 text-white [&>option]:bg-gray-900",
            "focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400",
            "transition-all duration-200",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-red-400">{error}</span>}
        {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
      </div>
    );
  },
);

CampoSelect.displayName = "CampoSelect";
