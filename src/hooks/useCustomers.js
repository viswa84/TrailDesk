import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_CUSTOMERS } from '../graphql/queries';
import { CREATE_CUSTOMER, UPDATE_CUSTOMER, DELETE_CUSTOMER } from '../graphql/mutations';
import { customers as staticCustomers } from '../data/data';

/**
 * Hook for managing customers.
 * @param {Object} filters - Optional filters { search }
 * @returns {{ data, loading, error, add, update, remove }}
 */
export function useCustomers(filters = {}) {
  const [localData, setLocalData] = useState(staticCustomers);

  const staticResult = {
    data: localData.filter(c => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
      }
      return true;
    }),
    loading: false,
    error: null,
    add: (customer) => {
      const newCustomer = {
        ...customer,
        id: localData.length + 1,
        totalTreks: 0,
        ltv: 0,
        joinDate: new Date().toISOString().split('T')[0],
      };
      setLocalData(prev => [...prev, newCustomer]);
      return newCustomer;
    },
    update: (id, updates) => {
      setLocalData(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    },
    remove: (id) => {
      setLocalData(prev => prev.filter(c => c.id !== id));
    },
  };

  const gqlQuery = useQuery(GET_CUSTOMERS, {
    variables: filters,
    skip: !isGraphQLEnabled,
  });

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_CUSTOMERS }] : [],
  });
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_CUSTOMERS }] : [],
  });
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_CUSTOMERS }] : [],
  });

  const gqlResult = {
    data: gqlQuery.data?.customers || [],
    loading: gqlQuery.loading,
    error: gqlQuery.error,
    add: async (customer) => {
      const { data } = await createCustomer({ variables: { input: customer } });
      return data.createCustomer;
    },
    update: async (id, updates) => {
      await updateCustomer({ variables: { id, input: updates } });
    },
    remove: async (id) => {
      await deleteCustomer({ variables: { id } });
    },
  };

  return isGraphQLEnabled ? gqlResult : staticResult;
}
