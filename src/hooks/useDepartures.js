import { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_DEPARTURES, GET_TREKS } from '../graphql/queries';
import { CREATE_DEPARTURE, UPDATE_DEPARTURE, DELETE_DEPARTURE, CANCEL_DEPARTURE } from '../graphql/mutations';
import { io as socketIO } from 'socket.io-client';

/**
 * Hook for managing departures/batches via GraphQL.
 * @param {Object} filters - Optional filters { trekId, status }
 * @returns {{ data, guides, treks, loading, error, add, update, remove, cancel, refetch }}
 */
export function useDepartures(filters = {}) {
  const variables = {};
  if (filters.trekId) variables.trekId = filters.trekId;
  if (filters.status) variables.status = filters.status;

  const { data, loading, error, refetch } = useQuery(GET_DEPARTURES, { variables });

  // Real-time updates via Socket.IO
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = socketIO(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('departureUpdated', () => {
      console.log('Departure updated via socket, refetching...');
      refetch();
    });

    return () => socket.disconnect();
  }, [refetch]);

  const [createDep] = useMutation(CREATE_DEPARTURE, {
    refetchQueries: [{ query: GET_DEPARTURES }],
  });
  const [updateDep] = useMutation(UPDATE_DEPARTURE, {
    refetchQueries: [{ query: GET_DEPARTURES }],
  });
  const [deleteDep] = useMutation(DELETE_DEPARTURE, {
    refetchQueries: [{ query: GET_DEPARTURES }],
  });
  const [cancelDep] = useMutation(CANCEL_DEPARTURE, {
    refetchQueries: [{ query: GET_DEPARTURES }],
  });

  // Fetch treks for selector dropdown
  const { data: treksData } = useQuery(GET_TREKS, { variables: { isActive: true } });

  return {
    data: data?.getDepartures || [],
    treks: (treksData?.getTreks || []).map(t => ({ ...t, id: t._id })),
    loading,
    error,
    refetch,
    add: async (input) => {
      const { data } = await createDep({ variables: { input } });
      return data.createDeparture;
    },
    update: async (id, input) => {
      await updateDep({ variables: { id, input } });
    },
    remove: async (id) => {
      await deleteDep({ variables: { id } });
    },
    cancel: async (id, reason) => {
      await cancelDep({ variables: { id, reason } });
    },
  };
}
