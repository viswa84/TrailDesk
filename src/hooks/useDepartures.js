import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_DEPARTURES } from '../graphql/queries';
import { CREATE_DEPARTURE, UPDATE_DEPARTURE, DELETE_DEPARTURE } from '../graphql/mutations';
import { departures as staticDepartures, guides } from '../data/data';

/**
 * Hook for managing departures/batches.
 * @param {Object} filters - Optional filters { trekId, status }
 * @returns {{ data, loading, error, guides, add, update, remove }}
 */
export function useDepartures(filters = {}) {
  const [localData, setLocalData] = useState(staticDepartures);

  const staticResult = {
    data: localData.filter(d => {
      if (filters.trekId && d.trekId !== filters.trekId) return false;
      if (filters.status && d.status !== filters.status) return false;
      return true;
    }),
    guides,
    loading: false,
    error: null,
    add: (dep) => {
      const guide = guides.find(g => g.id === Number(dep.guideId));
      const newDep = {
        ...dep,
        id: `DEP-${String(localData.length + 1).padStart(3, '0')}`,
        capacity: Number(dep.capacity),
        price: Number(dep.price),
        guideId: Number(dep.guideId),
        guideName: guide?.name || '',
        booked: 0,
      };
      setLocalData(prev => [...prev, newDep]);
      return newDep;
    },
    update: (id, updates) => {
      const guide = guides.find(g => g.id === Number(updates.guideId));
      setLocalData(prev => prev.map(d => d.id === id ? {
        ...d,
        ...updates,
        capacity: Number(updates.capacity),
        price: Number(updates.price),
        guideId: Number(updates.guideId),
        guideName: guide?.name || d.guideName,
      } : d));
    },
    remove: (id) => {
      setLocalData(prev => prev.filter(d => d.id !== id));
    },
  };

  // ── GraphQL mode ──
  const gqlQuery = useQuery(GET_DEPARTURES, {
    variables: filters,
    skip: !isGraphQLEnabled,
  });

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
    data: gqlQuery.data?.departures || [],
    guides,
    loading: gqlQuery.loading,
    error: gqlQuery.error,
    add: async (dep) => {
      const { data } = await createDep({ variables: { input: dep } });
      return data.createDeparture;
    },
    update: async (id, updates) => {
      await updateDep({ variables: { id, input: updates } });
    },
    remove: async (id) => {
      await deleteDep({ variables: { id } });
    },
  };

  return isGraphQLEnabled ? gqlResult : staticResult;
}
