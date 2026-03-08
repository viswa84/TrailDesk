import { useQuery, useMutation } from '@apollo/client/react';
import { GET_INVOICES, GET_PAYMENTS, GET_REFUNDS } from '../graphql/queries';
import { CREATE_INVOICE, UPDATE_INVOICE, DELETE_INVOICE } from '../graphql/mutations';

/**
 * Hook for managing finance data via GraphQL (invoices, payments, refunds).
 * @returns {{ invoices, payments, refunds, loading, error, addInvoice, updateInvoice, removeInvoice }}
 */
export function useFinance() {
  const invoiceQuery = useQuery(GET_INVOICES);
  const paymentQuery = useQuery(GET_PAYMENTS);
  const refundQuery = useQuery(GET_REFUNDS);

  const [createInvoice] = useMutation(CREATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });
  const [updateInvoice] = useMutation(UPDATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });
  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  return {
    invoices: invoiceQuery.data?.getInvoices || [],
    payments: paymentQuery.data?.getPayments || [],
    refunds: refundQuery.data?.getRefunds || [],
    loading: invoiceQuery.loading || paymentQuery.loading || refundQuery.loading,
    error: invoiceQuery.error || paymentQuery.error || refundQuery.error,
    addInvoice: async (input) => {
      const { data } = await createInvoice({ variables: { input } });
      return data.createInvoice;
    },
    updateInvoice: async (id, input) => {
      await updateInvoice({ variables: { id, input } });
    },
    removeInvoice: async (id) => {
      await deleteInvoice({ variables: { id } });
    },
  };
}
