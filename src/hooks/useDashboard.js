import { useQuery } from '@apollo/client/react';
import { GET_DASHBOARD } from '../graphql/queries';

/**
 * Hook for dashboard data — fetches real KPIs from the backend.
 * @returns {{ kpis, revenueByMonth, bookingsByRegion, recentActivity, alerts, loading, error }}
 */
export function useDashboard() {
  const { data, loading, error } = useQuery(GET_DASHBOARD);

  const dashboard = data?.getDashboard;

  return {
    kpis: dashboard?.kpis || {
      totalBookings: 0,
      revenue: 0,
      activeTreks: 0,
      totalChats: 0,
      bookingsChange: 0,
      revenueChange: 0,
      treksChange: 0,
      conversionRate: 0,
      conversionChange: 0,
    },
    revenueByMonth: dashboard?.revenueByMonth || [],
    bookingsByRegion: dashboard?.bookingsByRegion || [],
    recentActivity: dashboard?.recentActivity || [],
    alerts: dashboard?.alerts || [],
    loading,
    error,
  };
}
