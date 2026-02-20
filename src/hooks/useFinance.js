import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_INVOICES, GET_PAYMENTS, GET_REFUNDS } from '../graphql/queries';
import { CREATE_INVOICE, UPDATE_INVOICE, DELETE_INVOICE } from '../graphql/mutations';
import { invoices as staticInvoices, payments as staticPayments, refunds as staticRefunds } from '../data/data';

/**
 * Hook for managing finance data (invoices, payments, refunds).
 * @returns {{ invoices, payments, refunds, loading, error, addInvoice, updateInvoice, removeInvoice }}
 */
export function useFinance() {
  const [localInvoices, setLocalInvoices] = useState(staticInvoices);
  const [localPayments] = useState(staticPayments);
  const [localRefunds] = useState(staticRefunds);

  const staticResult = {
    invoices: localInvoices,
    payments: localPayments,
    refunds: localRefunds,
    loading: false,
    error: null,
    addInvoice: (invoice) => {
      const newInvoice = {
        ...invoice,
        id: `INV-${String(localInvoices.length + 1).padStart(4, '0')}`,
        amount: Number(invoice.amount),
        date: new Date().toISOString().split('T')[0],
      };
      setLocalInvoices(prev => [...prev, newInvoice]);
      return newInvoice;
    },
    updateInvoice: (id, updates) => {
      setLocalInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    },
    removeInvoice: (id) => {
      setLocalInvoices(prev => prev.filter(i => i.id !== id));
    },
  };

  // ── GraphQL mode ──
  const invoiceQuery = useQuery(GET_INVOICES, { skip: !isGraphQLEnabled });
  const paymentQuery = useQuery(GET_PAYMENTS, { skip: !isGraphQLEnabled });
  const refundQuery = useQuery(GET_REFUNDS, { skip: !isGraphQLEnabled });

  const [createInvoice] = useMutation(CREATE_INVOICE, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_INVOICES }] : [],
  });
  const [updateInvoice] = useMutation(UPDATE_INVOICE, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_INVOICES }] : [],
  });
  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_INVOICES }] : [],
  });

  const gqlResult = {
    invoices: invoiceQuery.data?.invoices || [],
    payments: paymentQuery.data?.payments || [],
    refunds: refundQuery.data?.refunds || [],
    loading: invoiceQuery.loading || paymentQuery.loading || refundQuery.loading,
    error: invoiceQuery.error || paymentQuery.error || refundQuery.error,
    addInvoice: async (invoice) => {
      const { data } = await createInvoice({ variables: { input: invoice } });
      return data.createInvoice;
    },
    updateInvoice: async (id, updates) => {
      await updateInvoice({ variables: { id, input: updates } });
    },
    removeInvoice: async (id) => {
      await deleteInvoice({ variables: { id } });
    },
  };

  return isGraphQLEnabled ? gqlResult : staticResult;
}
