import { type ReactNode } from "react";

interface PageWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function PageWrapper({
  title,
  description,
  children,
  action,
}: PageWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}
