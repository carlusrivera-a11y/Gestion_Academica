import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    // optional callback hook
  };

  return (
    <div className="dashboard-root">
      <Header onLogout={handleLogout} />
      <div className="dashboard-body">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
        <main className="dashboard-content">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
