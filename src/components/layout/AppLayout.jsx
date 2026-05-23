import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@apollo/client/react';
import { GET_COMPANY_PROFILE } from '../../graphql/queries';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { applyThemeColors } from '../../utils/theme';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: companyData } = useQuery(GET_COMPANY_PROFILE, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    const profile = companyData?.getCompanyProfile;
    if (!profile) return;
    const primary = profile.primaryColor || profile.themeColor;
    const secondary = profile.secondaryColor;
    applyThemeColors(primary, secondary);
  }, [companyData]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
