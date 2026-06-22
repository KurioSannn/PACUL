import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "./button";
import { LoadingState } from "./loading-state";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

type AsyncContentProps<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  loadingLabel?: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  errorTitle?: string;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
};

export function AsyncContent<T>({
  data,
  error,
  isLoading,
  loadingLabel,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
  errorTitle = "Data gagal dimuat",
  onRetry,
  children,
}: AsyncContentProps<T>) {
  if (isLoading) {
    return <LoadingState label={loadingLabel} />;
  }

  if (error) {
    return <ErrorState title={errorTitle} description={error} onRetry={onRetry} />;
  }

  if (data === null || (Array.isArray(data) && data.length === 0)) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  return <>{children(data)}</>;
}

export function AsyncListContent<T>({
  items,
  error,
  isLoading,
  loadingLabel,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
  errorTitle,
  onRetry,
  children,
}: Omit<AsyncContentProps<T[]>, "data"> & { items: T[] | null }) {
  return (
    <AsyncContent
      data={items}
      error={error}
      isLoading={isLoading}
      loadingLabel={loadingLabel}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyActionLabel={emptyActionLabel}
      emptyActionHref={emptyActionHref}
      errorTitle={errorTitle}
      onRetry={onRetry}
    >
      {(list) => children(list)}
    </AsyncContent>
  );
}
