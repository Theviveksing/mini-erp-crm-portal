import React, { useEffect, useState } from 'react';
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
  Zap,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';

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

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Hero Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-app) 100%)',
        border: '1px solid var(--border-color)',
        padding: '1.75rem 2rem',
        marginBottom: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-info" style={{ gap: '0.35rem', fontWeight: 600 }}>
              <Zap size={13} /> MongoDB Compass Sync
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• {currentDateStr}</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Welcome back, {user.name} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Here is your live enterprise operational overview and inventory status.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: '1px solid rgba(15, 118, 110, 0.15)'
          }}>
            <ShieldCheck size={18} />
            <span>Role: {user.role}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Activity size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Loading real-time enterprise metrics...
          </div>
        </div>
      ) : (
        <>
          {/* Enhanced KPI Metrics Grid */}
          <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
            {['ADMIN', 'SALES', 'ACCOUNTS'].includes(user.role) && (
              <div
                className="stat-card"
                onClick={() => setActiveTab('customers')}
                style={{
                  cursor: 'pointer',
                  borderTop: '3px solid #0369a1',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Active CRM Clients
                  </p>
                  <h3 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0.2rem 0' }}>
                    {stats.customersCount}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                    <TrendingUp size={13} /> Active Portfolio
                  </span>
                </div>
                <div className="stat-icon" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)', width: '46px', height: '46px' }}>
                  <Users size={22} />
                </div>
              </div>
            )}

            <div
              className="stat-card"
              onClick={() => setActiveTab('inventory')}
              style={{
                cursor: 'pointer',
                borderTop: '3px solid #1e40af',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Catalog Products
                </p>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0.2rem 0' }}>
                  {stats.productsCount}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--info)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                  <CheckCircle2 size={13} /> In Stock Catalog
                </span>
              </div>
              <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '46px', height: '46px' }}>
                <Package size={22} />
              </div>
            </div>

            <div
              className="stat-card"
              onClick={() => setActiveTab('inventory')}
              style={{
                cursor: 'pointer',
                borderTop: stats.lowStockCount > 0 ? '3px solid #b91c1c' : '3px solid #b45309',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Low Stock Alerts
                </p>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0.2rem 0', color: stats.lowStockCount > 0 ? 'var(--error)' : 'inherit' }}>
                  {stats.lowStockCount}
                </h3>
                <span style={{ fontSize: '0.75rem', color: stats.lowStockCount > 0 ? 'var(--error)' : 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                  <AlertTriangle size={13} /> {stats.lowStockCount > 0 ? 'Restock Required' : 'Optimal Inventory'}
                </span>
              </div>
              <div className="stat-icon" style={{
                backgroundColor: stats.lowStockCount > 0 ? 'var(--error-light)' : 'var(--warning-light)',
                color: stats.lowStockCount > 0 ? 'var(--error)' : 'var(--warning)',
                width: '46px',
                height: '46px'
              }}>
                <AlertTriangle size={22} />
              </div>
            </div>

            <div
              className="stat-card"
              onClick={() => setActiveTab('challans')}
              style={{
                cursor: 'pointer',
                borderTop: '3px solid #0f766e',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Sales Challans
                </p>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0.2rem 0' }}>
                  {stats.challansCount}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                  <Sparkles size={13} /> Order Audit Trail
                </span>
              </div>
              <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', width: '46px', height: '46px' }}>
                <FileText size={22} />
              </div>
            </div>
          </div>

          {/* Quick Operations & Role Capability Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
            {/* Quick Action Center */}
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={18} style={{ color: 'var(--primary)' }} />
                  Quick Action Hub
                </h3>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Shortcuts for {user.role}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {['ADMIN', 'SALES'].includes(user.role) && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab('challans')}
                    style={{
                      padding: '0.85rem 1rem',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--border-radius-sm)',
                      fontWeight: 600
                    }}
                  >
                    <span>Create Sales Order</span>
                    <ArrowUpRight size={18} />
                  </button>
                )}

                {['ADMIN', 'SALES'].includes(user.role) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('customers')}
                    style={{
                      padding: '0.85rem 1rem',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--border-radius-sm)',
                      fontWeight: 600
                    }}
                  >
                    <span>Add Customer Lead</span>
                    <ArrowUpRight size={18} />
                  </button>
                )}

                {['ADMIN', 'WAREHOUSE'].includes(user.role) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('inventory')}
                    style={{
                      padding: '0.85rem 1rem',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--border-radius-sm)',
                      fontWeight: 600
                    }}
                  >
                    <span>Adjust Stock Level</span>
                    <ArrowUpRight size={18} />
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('inventory')}
                  style={{
                    padding: '0.85rem 1rem',
                    justifyContent: 'space-between',
                    borderRadius: 'var(--border-radius-sm)',
                    fontWeight: 600
                  }}
                >
                  <span>Product Catalog</span>
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>

            {/* Role Permissions Card */}
            <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Role Security</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                Logged in as <strong>{user.name}</strong>. Your role is set to <strong>{user.role}</strong> with verified RBAC privileges:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: ['ADMIN', 'SALES', 'ACCOUNTS'].includes(user.role) ? 'var(--success)' : 'var(--text-muted)' }}>
                  <CheckCircle2 size={14} /> CRM Customer Pipeline Access
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: ['ADMIN', 'SALES', 'WAREHOUSE'].includes(user.role) ? 'var(--success)' : 'var(--text-muted)' }}>
                  <CheckCircle2 size={14} /> Product Catalog & Inventory Ledger
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: ['ADMIN', 'SALES'].includes(user.role) ? 'var(--success)' : 'var(--text-muted)' }}>
                  <CheckCircle2 size={14} /> Sales Order & Challan Issuance
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
