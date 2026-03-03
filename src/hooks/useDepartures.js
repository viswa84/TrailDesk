import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_DEPARTURES } from '../graphql/queries';
import { CREATE_DEPARTURE, UPDATE_DEPARTURE, DELETE_DEPARTURE } from '../graphql/mutations';
import { departures as staticDepartures, guides } from '../data/data';
import { io as socketIO } from 'socket.io-client';

/**
 * Hook for managing departures/batches.
 * @param {Object} filters - Optional filters { trekId, cityId, status }
 */
export function useDepartures(filters = {}) {
  const [localData, setLocalData] = useState(staticDepartures);

  const staticResult = {
    data: localData.filter(d => {
      if (filters.trekId && d.trekId !== filters.trekId) return false;
      if (filters.cityId && d.cityId !== filters.cityId) return false;
      if (filters.status && d.status !== filters.status) return false;
      return true;
    }),
    guides,
    loading: false,
    error: null,
    add: (dep) => {
      const guide = guides.find(g => String(g.id) === String(dep.guideId));
      const newDep = {
        ...dep,
        id: `DEP-${String(localData.length + 1).padStart(3, '0')}`,
        capacity: Number(dep.capacity),
        price: Number(dep.price),
        guideName: guide?.name || '',
        booked: 0,
      };
      setLocalData(prev => [...prev, newDep]);
      return newDep;
    },
    update: (id, updates) => {
      const guide = guides.find(g => String(g.id) === String(updates.guideId));
      setLocalData(prev => prev.map(d => (d.id === id || d._id === id) ? {
        ...d,
        ...updates,
        capacity: Number(updates.capacity),
        price: Number(updates.price),
        guideName: guide?.name || d.guideName,
      } : d));
    },
    remove: (id) => {
      setLocalData(prev => prev.filter(d => d.id !== id && d._id !== id));
    },
  };

  const gqlQuery = useQuery(GET_DEPARTURES, {
    variables: filters,
    skip: !isGraphQLEnabled,
  });

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!isGraphQLEnabled) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = socketIO(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('departureUpdated', () => {
      console.log('Departure updated via socket, refetching...');
      gqlQuery.refetch();
    });

    return () => socket.disconnect();
  }, [isGraphQLEnabled]);

  const [createDep] = useMutation(CREATE_DEPARTURE, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_DEPARTURES }] : [],
  });
  const [updateDep] = useMutation(UPDATE_DEPARTURE, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_DEPARTURES }] : [],
  });
  const [deleteDep] = useMutation(DELETE_DEPARTURE, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_DEPARTURES }] : [],
  });

  const gqlResult = {
    data: (gqlQuery.data?.getDepartures || []).map(d => ({ ...d, id: d._id })),
    guides,
    loading: gqlQuery.loading,
    error: gqlQuery.error,
    add: async (dep) => {
      const sanitized = {
        ...dep,
        price: dep.price != null ? Number(dep.price) : undefined,
        capacity: dep.capacity != null ? parseInt(dep.capacity, 10) : undefined,
      };
      const { data } = await createDep({ variables: { input: sanitized } });
      return data.createDeparture;
    },
    update: async (id, updates) => {
      const sanitized = {
        ...updates,
        price: updates.price != null ? Number(updates.price) : undefined,
        capacity: updates.capacity != null ? parseInt(updates.capacity, 10) : undefined,
      };
      await updateDep({ variables: { id, input: sanitized } });
    },
    remove: async (id) => {
      await deleteDep({ variables: { id } });
    },
  };

  return isGraphQLEnabled ? gqlResult : staticResult;
}
