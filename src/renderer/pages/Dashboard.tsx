import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import { Activity, Users, Database, Zap } from 'lucide-react';

interface DemoStats {
  totalUsers: number;
  activeItems: number;
  databaseSize: string;
  uptime: string;
}

const Dashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const { t } = useI18n();
  const [stats, setStats] = useState<DemoStats>({
    totalUsers: 0,
    activeItems: 0,
    databaseSize: '0 KB',
    uptime: '0h 0m',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Demo data - replace with your actual data loading
      setTimeout(() => {
        setStats({
          totalUsers: 42,
          activeItems: 128,
          databaseSize: '2.4 MB',
          uptime: '24h 15m',
        });
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showNotification(t.notifications.loadFailed, 'error');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">{t.common.loading}</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t.dashboard.title}</h1>
        <p className="page-description">{t.dashboard.subtitle}</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '24px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-blue-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={24} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              Total Users
            </div>
          </div>
        </div>

        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '24px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-green-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={24} color="var(--accent-green)" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {stats.activeItems}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              Active Items
            </div>
          </div>
        </div>

        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '24px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-purple-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Database size={24} color="var(--accent-purple)" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {stats.databaseSize}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              Database Size
            </div>
          </div>
        </div>

        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '24px'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-yellow-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={24} color="var(--accent-yellow)" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {stats.uptime}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              System Uptime
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="card">
        <h2>Welcome to Your Application</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.6' }}>
          This is a template dashboard. Customize these widgets with your application's data
          by modifying the <code style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '13px'
          }}>loadDashboardData()</code> function in the Dashboard component.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '16px'
        }}>
          <button
            className="btn btn-primary"
            onClick={() => showNotification('This is a demo action!', 'success')}
          >
            Demo Action 1
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => showNotification('This is another demo action!', 'info')}
          >
            Demo Action 2
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => showNotification('You can customize these actions!', 'success')}
          >
            Demo Action 3
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
