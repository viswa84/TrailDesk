import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_DASHBOARD } from '../graphql/queries';
import { dashboardKPIs, revenueByMonth, bookingsByRegion, recentActivity, alerts } from '../data/data';

/**
 * Hook for dashboard data.
 * @returns {{ kpis, revenueByMonth, bookingsByRegion, recentActivity, alerts, loading, error }}
 */
export function useDashboard() {
  const staticResult = {
    kpis: dashboardKPIs,
    revenueByMonth,
    bookingsByRegion,
    recentActivity,
    alerts,
    loading: false,
    error: null,
  };

  const gqlQuery = useQuery(GET_DASHBOARD, { skip: !isGraphQLEnabled });

  // The backend now returns a nested getDashboard { kpis, revenueByMonth, ... } structure
  const dashboard = gqlQuery.data?.getDashboard || {};

  const gqlResult = {
    kpis: dashboard.kpis || {},
    revenueByMonth: dashboard.revenueByMonth || [],
    bookingsByRegion: dashboard.bookingsByRegion || [],
    recentActivity: dashboard.recentActivity || [],
    alerts: dashboard.alerts || [],
    loading: gqlQuery.loading,
    error: gqlQuery.error,
  };

  return isGraphQLEnabled ? gqlResult : staticResult;
}
