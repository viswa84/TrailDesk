import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_TREKS } from '../graphql/queries';
import { CREATE_TREK, UPDATE_TREK, DELETE_TREK } from '../graphql/mutations';
import { treks as staticTreks } from '../data/data';

/**
 * Hook for managing treks using GraphQL.
 * Falls back to static data if GraphQL query returns no results.
 *
 * @param {Object} filters - Optional filters { isActive }
 * @returns {{ data, loading, error, add, update, remove, refetch }}
 */
export function useTreks(filters = {}) {
  // ── GraphQL mode ──
  const gqlQuery = useQuery(GET_TREKS, {
    variables: filters.isActive !== undefined ? { isActive: filters.isActive } : {},
  });

  const [createTrek] = useMutation(CREATE_TREK, {
    refetchQueries: [{ query: GET_TREKS }],
  });
  const [updateTrek] = useMutation(UPDATE_TREK, {
    refetchQueries: [{ query: GET_TREKS }],
  });
  const [deleteTrek] = useMutation(DELETE_TREK, {
    refetchQueries: [{ query: GET_TREKS }],
  });

  return {
    data: gqlQuery.data?.getTreks || [],
    loading: gqlQuery.loading,
    error: gqlQuery.error,
    refetch: gqlQuery.refetch,
    add: async (input) => {
      const { data } = await createTrek({ variables: { input } });
      return data.createTrek;
    },
    update: async (id, input) => {
      await updateTrek({ variables: { id, input } });
    },
    remove: async (id) => {
      await deleteTrek({ variables: { id } });
    },
  };
}
