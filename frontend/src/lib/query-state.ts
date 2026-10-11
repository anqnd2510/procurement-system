import type { QueryClient } from '@tanstack/react-query';

export function shouldRetryQuery(failureCount: number, error: Error) {
  const status = 'status' in error ? Number(error.status) : 0;
  return failureCount < 1 && ![400, 401, 403, 404, 409, 422].includes(status);
}

// Carry a previous page only within the same tenant/resource. Never show another
// organization's cached rows while switching workspaces.
export function keepScopedData<T>(scope: readonly unknown[]) {
  return (
    data: T | undefined,
    previous: { queryKey: readonly unknown[] } | undefined,
  ): T | undefined =>
    previous && scope.every((part, index) => previous.queryKey[index] === part)
      ? data
      : undefined;
}

export function invalidateDashboard(
  client: QueryClient,
  organizationId: string | undefined,
) {
  return client.invalidateQueries({
    queryKey: ['dashboard-summary', organizationId],
  });
}
