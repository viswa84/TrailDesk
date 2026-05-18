import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@apollo/client/react';
import { GET_COMPANY_PROFILE } from '../../graphql/queries';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

// ── Hex color helpers ────────────────────────────────────────────────────────
// shadeHex: darkens a hex color by `amount` percentage points (0–100).
function shadeHex(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) - Math.round(2.55 * amount)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) - Math.round(2.55 * amount)));
  const b = Math.max(0, Math.min(255, (n & 0xff) - Math.round(2.55 * amount)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// tintHex: lightens a hex color by mixing with white by `factor` (0–1).
function tintHex(hex, factor) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((n >> 16) & 0xff) + (255 - ((n >> 16) & 0xff)) * factor);
  const g = Math.round(((n >> 8) & 0xff) + (255 - ((n >> 8) & 0xff)) * factor);
  const b = Math.round((n & 0xff) + (255 - (n & 0xff)) * factor);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function applyThemeColors(primaryHex, secondaryHex) {
  const root = document.documentElement;
  if (primaryHex && /^#[0-9a-fA-F]{6}$/.test(primaryHex)) {
    root.style.setProperty('--color-primary-500', primaryHex);
    root.style.setProperty('--color-primary-600', shadeHex(primaryHex, 8));
    root.style.setProperty('--color-primary-700', shadeHex(primaryHex, 18));
    root.style.setProperty('--color-primary-400', tintHex(primaryHex, 0.15));
    root.style.setProperty('--color-primary-300', tintHex(primaryHex, 0.35));
    root.style.setProperty('--color-primary-200', tintHex(primaryHex, 0.55));
    root.style.setProperty('--color-primary-100', tintHex(primaryHex, 0.75));
    root.style.setProperty('--color-primary-50',  tintHex(primaryHex, 0.88));
  }
  const sec = (secondaryHex && /^#[0-9a-fA-F]{6}$/.test(secondaryHex)) ? secondaryHex : '#1f2937';
  root.style.setProperty('--color-secondary-500', sec);
  root.style.setProperty('--color-secondary-600', shadeHex(sec, 8));
  root.style.setProperty('--color-secondary-700', shadeHex(sec, 18));
  root.style.setProperty('--color-secondary-400', tintHex(sec, 0.15));
  root.style.setProperty('--color-secondary-300', tintHex(sec, 0.35));
  root.style.setProperty('--color-secondary-200', tintHex(sec, 0.55));
  root.style.setProperty('--color-secondary-100', tintHex(sec, 0.75));
  root.style.setProperty('--color-secondary-50',  tintHex(sec, 0.88));
}

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
