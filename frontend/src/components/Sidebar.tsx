import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
  Sun,
  Moon,
  Database
} from 'lucide-react';

interface SidebarProps {
  user: { name: string; username: string; role: string };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  darkTheme: boolean;
  setDarkTheme: (dark: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  darkTheme,
  setDarkTheme
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { id: 'customers', label: 'CRM Customers', icon: <Users size={20} />, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
    { id: 'inventory', label: 'Inventory & Stock', icon: <Package size={20} />, roles: ['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'] }, // all roles can read, but permissions inside view vary
    { id: 'challans', label: 'Sales Challans', icon: <FileText size={20} />, roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'] }
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: 'var(--primary)',
          color: 'white'
        }}>
          <Database size={20} />
        </div>
        <div className="sidebar-logo">
          Mini<span>ERP</span>
        </div>
      </div>

      <div className="sidebar-nav">
        {filteredNavItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-on-sidebar)', fontWeight: 500 }}>
            {darkTheme ? 'Dark Mode' : 'Light Mode'}
          </span>
          <button
            onClick={() => setDarkTheme(!darkTheme)}
            className="theme-toggle-btn"
            style={{ color: 'var(--text-on-sidebar)' }}
            title="Toggle theme"
          >
            {darkTheme ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {getInitials(user.name)}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem' }}>
              {user.role}
            </span>
          </div>
        </div>

        <div
          className="sidebar-item"
          onClick={onLogout}
          style={{ marginTop: '0.5rem', color: '#f87171' }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};
