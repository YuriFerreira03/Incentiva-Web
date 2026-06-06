import { cn } from "../../utils/cn";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Logo({ className, size = "md" }: Props) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-cyan-400 rounded-lg flex items-center justify-center p-1.5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
            fill="white"
          />
        </svg>
      </div>
      <span className={cn("font-bold tracking-widest text-white", sizes[size])}>
        INCENTIVA
      </span>
    </div>
  );
}
