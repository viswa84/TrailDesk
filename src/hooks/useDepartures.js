import { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_DEPARTURES, GET_TREKS } from '../graphql/queries';
import { CREATE_DEPARTURE, UPDATE_DEPARTURE, DELETE_DEPARTURE, CANCEL_DEPARTURE, REORDER_DEPARTURES } from '../graphql/mutations';
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
    const socket = socketIO(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('trekops_token') },
    });

    socket.on('departureUpdated', () => {
      console.log('Departure updated via socket, refetching...');
      refetch();
    });

    // Backend now requires a valid JWT on the socket; re-send a refreshed token.
    socket.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err.message);
      socket.auth = { token: localStorage.getItem('trekops_token') };
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
  // No refetchQueries: the list is reordered optimistically in the page,
  // and the server returns the persisted sortOrder for each departure.
  const [reorderDeps] = useMutation(REORDER_DEPARTURES);

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
    reorder: async (ids) => {
      await reorderDeps({ variables: { ids } });
    },
  };
}
