import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CUSTOMERS } from '../graphql/queries';
import { CREATE_CUSTOMER, UPDATE_CUSTOMER, DELETE_CUSTOMER } from '../graphql/mutations';

/**
 * Hook for managing customers via GraphQL.
 * @param {Object} filters - Optional filters { search }
 * @returns {{ data, loading, error, add, update, remove, refetch }}
 */
export function useCustomers(filters = {}) {
  const variables = {};
  if (filters.search) variables.search = filters.search;

  const { data, loading, error, refetch } = useQuery(GET_CUSTOMERS, { variables });

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS }],
  });
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS }],
  });
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS }],
  });

  return {
    data: data?.getCustomers || [],
    loading,
    error,
    refetch,
    add: async (input) => {
      const { data } = await createCustomer({ variables: { input } });
      return data.createCustomer;
    },
    update: async (id, input) => {
      await updateCustomer({ variables: { id, input } });
    },
    remove: async (id) => {
      await deleteCustomer({ variables: { id } });
    },
  };
}
