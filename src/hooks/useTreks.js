import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_TREKS } from '../graphql/queries';
import { CREATE_TREK, UPDATE_TREK, DELETE_TREK } from '../graphql/mutations';
import { treks as staticTreks } from '../data/data';

/**
 * Hook for managing treks (simplified catalog).
 * Uses GraphQL when VITE_GRAPHQL_ENABLED=true, otherwise uses static data.
 */
export function useTreks(filters = {}) {
  const [localData, setLocalData] = useState(staticTreks);

  const staticResult = {
    data: localData.filter(t => {
      if (filters.difficulty && t.difficulty !== filters.difficulty) return false;
      return true;
    }),
    loading: false,
    error: null,
    add: (trek) => {
      const newTrek = { ...trek, id: localData.length + 1, isActive: true };
      setLocalData(prev => [...prev, newTrek]);
      return newTrek;
    },
    update: (id, updates) => {
      setLocalData(prev => prev.map(t => (t.id === id || t._id === id) ? { ...t, ...updates } : t));
    },
    remove: (id) => {
      setLocalData(prev => prev.filter(t => t.id !== id && t._id !== id));
    },
  };

  const gqlQuery = useQuery(GET_TREKS, {
    variables: filters,
    skip: !isGraphQLEnabled,
  });

  const [createTrek] = useMutation(CREATE_TREK, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_TREKS }] : [],
  });
  const [updateTrek] = useMutation(UPDATE_TREK, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_TREKS }] : [],
  });
  const [deleteTrek] = useMutation(DELETE_TREK, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_TREKS }] : [],
  });

  const gqlResult = {
    data: (gqlQuery.data?.getTreks || []).map(t => ({ ...t, id: t._id })),
    loading: gqlQuery.loading,
    error: gqlQuery.error,
    add: async (trek) => {
      const { data } = await createTrek({ variables: { input: trek } });
      return data.createTrek;
    },
    update: async (id, updates) => {
      await updateTrek({ variables: { id, input: updates } });
    },
    remove: async (id) => {
      await deleteTrek({ variables: { id } });
    },
  };

  return isGraphQLEnabled ? gqlResult : staticResult;
}
