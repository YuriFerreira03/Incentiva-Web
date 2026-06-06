import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg px-4 py-2.5 text-sm",
            "bg-white/5 border border-white/10 text-white placeholder:text-gray-500",
            "focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400",
            "transition-all duration-200",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        />

        {error && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <svg
              className="w-3 h-3 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </span>
        )}

        {hint && !error && (
          <span className="text-xs text-gray-500">{hint}</span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
