import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_BOOKINGS } from '../graphql/queries';
import { CREATE_BOOKING, UPDATE_BOOKING, DELETE_BOOKING } from '../graphql/mutations';
import { bookings as staticBookings } from '../data/data';

/**
 * Hook for managing bookings.
 * @param {Object} filters - Optional filters { paymentStatus, bookingStatus }
 * @returns {{ data, loading, error, add, update, remove }}
 */
export function useBookings(filters = {}) {
  const [localData, setLocalData] = useState(staticBookings);

  const staticResult = {
    data: localData.filter(b => {
      if (filters.paymentStatus && b.paymentStatus !== filters.paymentStatus) return false;
      if (filters.bookingStatus && b.bookingStatus !== filters.bookingStatus) return false;
      return true;
    }),
    loading: false,
    error: null,
    add: (booking) => {
      const newBooking = {
        ...booking,
        id: `BK-${String(localData.length + 2600).padStart(4, '0')}`,
        amount: Number(booking.amount),
        bookedOn: new Date().toISOString().split('T')[0],
      };
      setLocalData(prev => [...prev, newBooking]);
      return newBooking;
    },
    update: (id, updates) => {
      setLocalData(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    },
    remove: (id) => {
      setLocalData(prev => prev.filter(b => b.id !== id));
    },
  };

  const gqlQuery = useQuery(GET_BOOKINGS, {
    variables: filters,
    skip: !isGraphQLEnabled,
  });

  const [createBooking] = useMutation(CREATE_BOOKING, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_BOOKINGS }] : [],
  });
  const [updateBooking] = useMutation(UPDATE_BOOKING, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_BOOKINGS }] : [],
  });
  const [deleteBooking] = useMutation(DELETE_BOOKING, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_BOOKINGS }] : [],
  });

  const gqlResult = {
    data: gqlQuery.data?.getBookings || [],
    loading: gqlQuery.loading,
    error: gqlQuery.error,
    add: async (booking) => {
      const { data } = await createBooking({ variables: { input: booking } });
      return data.createBooking;
    },
    update: async (id, updates) => {
      await updateBooking({ variables: { id, input: updates } });
    },
    remove: async (id) => {
      await deleteBooking({ variables: { id } });
    },
  };

  return isGraphQLEnabled ? gqlResult : staticResult;
}
