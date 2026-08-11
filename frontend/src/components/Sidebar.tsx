import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
  Sun,
  Moon,
  Database,
  Edit2,
  Check,
  X
} from 'lucide-react';

interface SidebarProps {
  user: { name: string; username: string; role: string };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  darkTheme: boolean;
  setDarkTheme: (dark: boolean) => void;
  onUpdateName: (newName: string) => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  darkTheme,
  setDarkTheme,
  onUpdateName
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.name);

  useEffect(() => {
    setNewName(user.name);
  }, [user.name]);

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === user.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await onUpdateName(newName.trim());
      setIsEditingName(false);
    } catch (e) {
      console.error(e);
      alert('Failed to update name');
    }
  };
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
          <div className="user-info" style={{ flex: 1 }}>
            {isEditingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.85rem',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    width: '100%'
                  }}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex' }}
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                <span className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                  {user.name}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-on-sidebar)', cursor: 'pointer', opacity: 0.6 }}
                  title="Edit Name"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
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
