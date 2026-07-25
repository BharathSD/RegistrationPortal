import { AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Card } from "./Card";
import { Button } from "./Button";

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Drop-in failure state for a React Query read gone wrong — pairs with
 * Skeleton (loading) and the screen's own empty state (zero results).
 * Usage: `if (query.isError) return <QueryError onRetry={query.refetch} />`
 * before the loading/empty/success branches.
 */
export function QueryError({
  message = "Something went wrong loading this. Please try again.",
  onRetry,
  className,
}: QueryErrorProps) {
  return (
    <Card
      role="alert"
      className={clsx("flex flex-col items-center gap-3 border-danger/30 bg-danger/5 py-8 text-center", className)}
    >
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  );
}
