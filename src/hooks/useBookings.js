import { useQuery } from '@apollo/client/react';
import { GET_BOOKINGS } from '../graphql/queries';

/**
 * Hook for managing bookings via GraphQL.
 * @param {Object} filters - Optional filters { status }
 * @returns {{ data, loading, error, refetch }}
 */
export function useBookings(filters = {}) {
  const variables = {};
  if (filters.paymentStatus) variables.status = filters.paymentStatus;
  if (filters.bookingStatus) variables.status = filters.bookingStatus;
  if (filters.status) variables.status = filters.status;

  const { data, loading, error, refetch } = useQuery(GET_BOOKINGS, { variables });

  return {
    data: data?.getBookings || [],
    loading,
    error,
    refetch,
  };
}
