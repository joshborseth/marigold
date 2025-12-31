import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "spinner" | "dots";
}

export default function Loader({ className, size = "md", variant = "spinner" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (variant === "spinner") {
    return (
      <div className={cn("animate-spin rounded-full border-2 border-muted border-t-primary", sizeClasses[size], className)} role="status" aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1.5", className)} role="status" aria-label="Loading">
        <div className={cn("rounded-full bg-primary animate-bounce", size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-2 h-2" : "w-2.5 h-2.5")} style={{ animationDelay: "0ms" }} />
        <div className={cn("rounded-full bg-primary animate-bounce", size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-2 h-2" : "w-2.5 h-2.5")} style={{ animationDelay: "150ms" }} />
        <div className={cn("rounded-full bg-primary animate-bounce", size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-2 h-2" : "w-2.5 h-2.5")} style={{ animationDelay: "300ms" }} />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Default variant (pulse)
  return (
    <div className={cn("rounded-full bg-primary animate-pulse", sizeClasses[size], className)} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
}
