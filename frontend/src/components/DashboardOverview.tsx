import React, { useEffect, useState } from 'react';
import { Users, Package, AlertTriangle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  user: { name: string; username: string; role: string };
  token: string;
  setActiveTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardProps> = ({ user, token, setActiveTab }) => {
  const [stats, setStats] = useState({
    customersCount: 0,
    productsCount: 0,
    lowStockCount: 0,
    challansCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch counts from paginated endpoints
        const custRes = await fetch('http://localhost:5000/api/customers?limit=1', { headers });
        const prodRes = await fetch('http://localhost:5000/api/products?limit=1', { headers });
        const lowRes = await fetch('http://localhost:5000/api/products?lowStock=true&limit=1', { headers });
        const chalRes = await fetch('http://localhost:5000/api/challans?limit=1', { headers });

        let custTotal = 0;
        let prodTotal = 0;
        let lowTotal = 0;
        let chalTotal = 0;

        if (custRes.ok) {
          const data = await custRes.json();
          custTotal = data.pagination?.total || 0;
        }
        if (prodRes.ok) {
          const data = await prodRes.json();
          prodTotal = data.pagination?.total || 0;
        }
        if (lowRes.ok) {
          const data = await lowRes.json();
          lowTotal = data.pagination?.total || 0;
        }
        if (chalRes.ok) {
          const data = await chalRes.json();
          chalTotal = data.pagination?.total || 0;
        }

        setStats({
          customersCount: custTotal,
          productsCount: prodTotal,
          lowStockCount: lowTotal,
          challansCount: chalTotal
        });
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [token]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="view-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Operations Portal
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Welcome back, <strong>{user.name}</strong>. Here is your business overview.
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--success-light)',
          color: 'var(--success)',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <ShieldCheck size={16} />
          <span>Role Verified: {user.role}</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading business stats...</div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {['ADMIN', 'SALES', 'ACCOUNTS'].includes(user.role) && (
              <div className="stat-card" onClick={() => setActiveTab('customers')} style={{ cursor: 'pointer' }}>
                <div className="stat-details">
                  <p>CRM Customers</p>
                  <h3>{stats.customersCount}</h3>
                </div>
                <div className="stat-icon" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
                  <Users size={24} />
                </div>
              </div>
            )}

            <div className="stat-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
              <div className="stat-details">
                <p>Catalog Products</p>
                <h3>{stats.productsCount}</h3>
              </div>
              <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Package size={24} />
              </div>
            </div>

            <div className="stat-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
              <div className="stat-details">
                <p>Low Stock Items</p>
                <h3 style={{ color: stats.lowStockCount > 0 ? 'var(--error)' : 'inherit' }}>
                  {stats.lowStockCount}
                </h3>
              </div>
              <div className="stat-icon" style={{
                backgroundColor: stats.lowStockCount > 0 ? 'var(--error-light)' : 'var(--warning-light)',
                color: stats.lowStockCount > 0 ? 'var(--error)' : 'var(--warning)'
              }}>
                <AlertTriangle size={24} />
              </div>
            </div>

            <div className="stat-card" onClick={() => setActiveTab('challans')} style={{ cursor: 'pointer' }}>
              <div className="stat-details">
                <p>Sales Challans</p>
                <h3>{stats.challansCount}</h3>
              </div>
              <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                <FileText size={24} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['ADMIN', 'SALES'].includes(user.role) && (
                  <button className="btn btn-primary" onClick={() => setActiveTab('challans')} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>Create New Sales Challan</span>
                    <ArrowRight size={18} />
                  </button>
                )}
                {['ADMIN', 'SALES'].includes(user.role) && (
                  <button className="btn btn-secondary" onClick={() => setActiveTab('customers')} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>Add New Customer Lead</span>
                    <ArrowRight size={18} />
                  </button>
                )}
                {['ADMIN', 'WAREHOUSE'].includes(user.role) && (
                  <button className="btn btn-secondary" onClick={() => setActiveTab('inventory')} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>Adjust Inventory Stock</span>
                    <ArrowRight size={18} />
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setActiveTab('inventory')} style={{ width: '100%', justifyContent: 'space-between' }}>
                  <span>View Product Catalog</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Security & Authorization</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px' }}>
                You are logged in as <strong>{user.name}</strong> ({user.role}). Your role restricts dashboard tabs and database write capabilities to ensure transactional integrity.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
