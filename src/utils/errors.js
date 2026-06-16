/**
 * Extract a human-readable message from an Apollo/GraphQL/network error.
 * Covers Apollo Client v3 (`graphQLErrors`) and v4 (`CombinedGraphQLErrors.errors`)
 * shapes, then plain Error, then the provided fallback.
 */
export function getErrorMessage(err, fallback = 'Something went wrong') {
  return (
    err?.graphQLErrors?.[0]?.message ||
    err?.errors?.[0]?.message ||
    err?.message ||
    fallback
  );
}
