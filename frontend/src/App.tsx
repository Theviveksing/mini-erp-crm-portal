import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { ChallanView } from './components/ChallanView';
import './App.css';

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Keep theme class in sync on body
  useEffect(() => {
    if (darkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkTheme]);

  // Adjust active tab if active role does not support it (security fallback)
  useEffect(() => {
    if (!user) return;
    const permissions: Record<string, string[]> = {
      ADMIN: ['dashboard', 'customers', 'inventory', 'challans'],
      SALES: ['dashboard', 'customers', 'inventory', 'challans'],
      WAREHOUSE: ['dashboard', 'inventory', 'challans'],
      ACCOUNTS: ['dashboard', 'customers', 'inventory', 'challans']
    };

    const allowed = permissions[user.role] || ['dashboard'];
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [user, activeTab]);

  const handleLoginSuccess = (newToken: string, loggedInUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setToken(newToken);
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const handleUpdateName = async (newName: string) => {
    if (!token) return;
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile name');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            user={user}
            token={token}
            setActiveTab={setActiveTab}
          />
        );
      case 'customers':
        return (
          <CustomersView
            token={token}
            userRole={user.role}
          />
        );
      case 'inventory':
        return (
          <InventoryView
            token={token}
            userRole={user.role}
          />
        );
      case 'challans':
        return (
          <ChallanView
            token={token}
            userRole={user.role}
          />
        );
      default:
        return (
          <DashboardOverview
            user={user}
            token={token}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        darkTheme={darkTheme}
        setDarkTheme={setDarkTheme}
        onUpdateName={handleUpdateName}
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
