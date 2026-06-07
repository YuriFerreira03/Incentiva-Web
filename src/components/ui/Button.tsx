import { cn } from "../../utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "google" | "ghost";
  loading?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  iconRight?: ReactNode;
  icon?: ReactNode; // para ícone centralizado (ex: loading)
}

const variants = {
  primary: "bg-cyan-400 hover:bg-cyan-300 text-gray-900 font-semibold",
  secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
  google:
    "bg-white hover:bg-gray-100 text-gray-800 font-medium border border-gray-200",
  ghost: "text-cyan-400 hover:text-cyan-300 underline-offset-4 hover:underline",
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  fullWidth = false,
  size = "md",
  icon,
  iconRight,
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
