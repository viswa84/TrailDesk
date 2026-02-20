import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_CAMPAIGNS } from '../graphql/queries';
import { CREATE_CAMPAIGN, UPDATE_CAMPAIGN, DELETE_CAMPAIGN } from '../graphql/mutations';
import { campaigns as staticCampaigns } from '../data/data';

/**
 * Hook for managing marketing campaigns.
 * @returns {{ data, kpis, loading, error, add, update, remove }}
 */
export function useCampaigns() {
  const [localData, setLocalData] = useState(staticCampaigns);

  const computeKPIs = (campaigns) => ({
    totalSpend: campaigns.reduce((s, c) => s + c.spend, 0),
    totalLeads: campaigns.reduce((s, c) => s + c.leads, 0),
    totalConversions: campaigns.reduce((s, c) => s + c.conversions, 0),
    avgROAS: campaigns.length > 0 ? (campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length).toFixed(1) : 0,
  });

  const staticResult = {
    data: localData,
    kpis: computeKPIs(localData),
    loading: false,
    error: null,
    add: (campaign) => {
      const newCampaign = {
        ...campaign,
        id: localData.length + 1,
        spend: Number(campaign.spend),
        leads: Number(campaign.leads),
        conversions: Number(campaign.conversions),
        cpl: Number(campaign.spend) / Number(campaign.leads),
        roas: Number(campaign.roas),
      };
      setLocalData(prev => [...prev, newCampaign]);
      return newCampaign;
    },
    update: (id, updates) => {
      setLocalData(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    },
    remove: (id) => {
      setLocalData(prev => prev.filter(c => c.id !== id));
    },
  };

  const gqlQuery = useQuery(GET_CAMPAIGNS, { skip: !isGraphQLEnabled });

  const [createCampaign] = useMutation(CREATE_CAMPAIGN, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_CAMPAIGNS }] : [],
  });
  const [updateCampaign] = useMutation(UPDATE_CAMPAIGN, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_CAMPAIGNS }] : [],
  });
  const [deleteCampaign] = useMutation(DELETE_CAMPAIGN, {
    refetchQueries: isGraphQLEnabled ? [{ query: GET_CAMPAIGNS }] : [],
  });

  const gqlCampaigns = gqlQuery.data?.campaigns || [];

  const gqlResult = {
    data: gqlCampaigns,
    kpis: computeKPIs(gqlCampaigns),
    loading: gqlQuery.loading,
    error: gqlQuery.error,
    add: async (campaign) => {
      const { data } = await createCampaign({ variables: { input: campaign } });
      return data.createCampaign;
    },
    update: async (id, updates) => {
      await updateCampaign({ variables: { id, input: updates } });
    },
    remove: async (id) => {
      await deleteCampaign({ variables: { id } });
    },
  };

  return isGraphQLEnabled ? gqlResult : staticResult;
}
