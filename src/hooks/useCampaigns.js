import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CAMPAIGNS } from '../graphql/queries';
import { CREATE_CAMPAIGN, UPDATE_CAMPAIGN, DELETE_CAMPAIGN } from '../graphql/mutations';

/**
 * Hook for managing marketing campaigns via GraphQL.
 * @returns {{ data, kpis, loading, error, add, update, remove, refetch }}
 */
export function useCampaigns() {
  const { data, loading, error, refetch } = useQuery(GET_CAMPAIGNS);

  const [createCampaign] = useMutation(CREATE_CAMPAIGN, {
    refetchQueries: [{ query: GET_CAMPAIGNS }],
  });
  const [updateCampaign] = useMutation(UPDATE_CAMPAIGN, {
    refetchQueries: [{ query: GET_CAMPAIGNS }],
  });
  const [deleteCampaign] = useMutation(DELETE_CAMPAIGN, {
    refetchQueries: [{ query: GET_CAMPAIGNS }],
  });

  const campaigns = data?.getCampaigns || [];

  const computeKPIs = (campaigns) => ({
    totalSpend: campaigns.reduce((s, c) => s + (c.spend || 0), 0),
    totalLeads: campaigns.reduce((s, c) => s + (c.leads || 0), 0),
    totalConversions: campaigns.reduce((s, c) => s + (c.conversions || 0), 0),
    avgROAS: campaigns.length > 0
      ? (campaigns.reduce((s, c) => s + (c.roas || 0), 0) / campaigns.length).toFixed(1)
      : 0,
  });

  return {
    data: campaigns,
    kpis: computeKPIs(campaigns),
    loading,
    error,
    refetch,
    add: async (input) => {
      const { data } = await createCampaign({ variables: { input } });
      return data.createCampaign;
    },
    update: async (id, input) => {
      await updateCampaign({ variables: { id, input } });
    },
    remove: async (id) => {
      await deleteCampaign({ variables: { id } });
    },
  };
}
