import React, { useState, useEffect } from 'react';
import type { TimeEntry, Project, ProjectReport } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';

interface WeeklyStat {
  project_id: number;
  project_name: string;
  total_hours: number;
  total_value?: number;
}

const Dashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const { t, formatCurrency, formatNumber } = useI18n();
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load projects and all time entries
      const [projectsData, allEntries] = await Promise.all([
        window.api.project.getAll(),
        window.api.timeEntry.getAll(),
      ]);

      setProjects(projectsData);

      // Get recent entries (last 10)
      const sortedEntries = [...allEntries].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.start_time || '').localeCompare(a.start_time || '');
      });
      setRecentEntries(sortedEntries.slice(0, 10));

      // Calculate weekly stats (current week: Monday to Sunday)
      const { startDate, endDate } = getCurrentWeekRange();
      const weeklyEntries = allEntries.filter(
        entry => entry.date >= startDate && entry.date <= endDate
      );

      // Group by project
      const projectMap = new Map<number, { total_minutes: number; hourly_rate?: number; name: string }>();

      weeklyEntries.forEach(entry => {
        const existing = projectMap.get(entry.project_id);
        const project = projectsData.find(p => p.id === entry.project_id);

        if (existing) {
          existing.total_minutes += entry.duration_minutes;
        } else if (project) {
          projectMap.set(entry.project_id, {
            total_minutes: entry.duration_minutes,
            hourly_rate: project.hourly_rate,
            name: project.name,
          });
        }
      });

      // Convert to stats array
      const stats: WeeklyStat[] = Array.from(projectMap.entries()).map(([projectId, data]) => ({
        project_id: projectId,
        project_name: data.name,
        total_hours: data.total_minutes / 60,
        total_value: data.hourly_rate ? (data.total_minutes / 60) * data.hourly_rate : undefined,
      }));

      setWeeklyStats(stats.sort((a, b) => b.total_hours - a.total_hours));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showNotification(t.notifications.loadFailed, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentWeekRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday is day 1

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    };
  };

  const getProjectName = (projectId: number): string => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : 'Unknown';
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTotalWeeklyHours = (): number => {
    return weeklyStats.reduce((sum, stat) => sum + stat.total_hours, 0);
  };

  const getTotalWeeklyValue = (): number | undefined => {
    const values = weeklyStats.map(s => s.total_value).filter(v => v !== undefined) as number[];
    if (values.length === 0) return undefined;
    return values.reduce((sum, value) => sum + value, 0);
  };

  if (isLoading) {
    return <div className="loading">{t.common.loading}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t.dashboard.title}</h1>
        <p>{t.dashboard.subtitle}</p>
      </div>

      {/* Weekly Stats */}
      <div className="card">
        <h2>{t.dashboard.thisWeek}</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
          {getCurrentWeekRange().startDate} - {getCurrentWeekRange().endDate}
        </p>

        {weeklyStats.length === 0 ? (
          <div className="empty-state">
            <h3>{t.dashboard.noEntriesThisWeek}</h3>
            <p>{t.dashboard.startTracking}</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{t.dashboard.totalHours}</h3>
                <div className="value">{formatNumber(getTotalWeeklyHours(), 2)}</div>
              </div>
              {getTotalWeeklyValue() !== undefined && (
                <div className="stat-card">
                  <h3>{t.dashboard.totalRevenue}</h3>
                  <div className="value">{formatCurrency(getTotalWeeklyValue()!)}</div>
                </div>
              )}
            </div>

            <div className="table-container" style={{ marginTop: '16px' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t.common.project}</th>
                    <th>{t.dashboard.totalHours}</th>
                    <th>{t.dashboard.revenue}</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyStats.map((stat) => (
                    <tr key={stat.project_id}>
                      <td>{stat.project_name}</td>
                      <td>{formatNumber(stat.total_hours, 2)}h</td>
                      <td>{stat.total_value ? formatCurrency(stat.total_value) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Recent Time Entries */}
      <div className="card">
        <h2>{t.dashboard.recentEntries}</h2>

        {recentEntries.length === 0 ? (
          <div className="empty-state">
            <h3>{t.dashboard.noEntriesYet}</h3>
            <p>{t.dashboard.startTrackingRecent}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.common.date}</th>
                  <th>{t.common.project}</th>
                  <th>{t.projects.start}</th>
                  <th>{t.projects.end}</th>
                  <th>{t.common.duration}</th>
                  <th>{t.common.description}</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{getProjectName(entry.project_id)}</td>
                    <td>{entry.start_time || '-'}</td>
                    <td>{entry.end_time || '-'}</td>
                    <td>{formatDuration(entry.duration_minutes)}</td>
                    <td>{entry.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
