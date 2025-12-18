import React, { useState, useEffect, useContext } from 'react';
import type { TimeEntry, Project } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import { AppContext } from '../App';
import WeeklyBarChart from '../components/WeeklyBarChart';

interface WeekData {
  weekLabel: string;
  totalHours: number;
  totalRevenue: number;
  weekNumber: number;
  year: number;
  projects: Array<{
    projectId: number;
    projectName: string;
    hours: number;
    revenue: number;
    color: string;
  }>;
}

// Color palette for projects
const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#F43F5E', // Rose
];

const Dashboard: React.FC = () => {
  const { showNotification } = useNotification();
  const { t } = useI18n();
  const { navigateToPage } = useContext(AppContext);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chartMetric, setChartMetric] = useState<'hours' | 'revenue'>('hours');
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

      const projectMap = new Map<number, Project>();
      projectsData.forEach((project) => {
        projectMap.set(project.id, project);
      });

      // Get recent entries (last 10)
      const sortedEntries = [...allEntries].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.start_time || '').localeCompare(a.start_time || '');
      });
      setRecentEntries(sortedEntries.slice(0, 10));

      // Create a color map for projects
      const projectColorMap = new Map<number, string>();
      projectsData.forEach((project, index) => {
        projectColorMap.set(project.id, PROJECT_COLORS[index % PROJECT_COLORS.length]);
      });

      // Calculate weekly data for last 10 weeks with project breakdown
      const weeks = getLast10Weeks();
      const weeklyStats: WeekData[] = weeks.map(week => {
        const weekEntries = allEntries.filter(
          entry => entry.date >= week.startDate && entry.date <= week.endDate
        );

        // Group by project
        const projectHoursMap = new Map<number, { name: string; minutes: number; hourlyRate: number }>();
        weekEntries.forEach(entry => {
          const project = projectMap.get(entry.project_id);
          if (project) {
            const existing = projectHoursMap.get(entry.project_id);
            if (existing) {
              existing.minutes += entry.duration_minutes;
            } else {
              projectHoursMap.set(entry.project_id, {
                name: project.name,
                minutes: entry.duration_minutes,
                hourlyRate: project.hourly_rate || 0,
              });
            }
          }
        });

        // Convert to projects array
        const projects = Array.from(projectHoursMap.entries()).map(([projectId, data]) => {
          const hours = data.minutes / 60;
          const revenue = hours * data.hourlyRate;
          return {
            projectId,
            projectName: data.name,
            hours,
            revenue,
            color: projectColorMap.get(projectId) || PROJECT_COLORS[0],
          };
        });

        const totalMinutes = weekEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
        const totalRevenue = projects.reduce((sum, project) => sum + project.revenue, 0);

        return {
          weekLabel: `${t.dashboard.week} ${week.weekNumber}`,
          totalHours: totalMinutes / 60,
          totalRevenue,
          weekNumber: week.weekNumber,
          year: week.year,
          projects,
        };
      });

      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showNotification(t.notifications.loadFailed, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getLast10Weeks = (): Array<{ startDate: string; endDate: string; weekNumber: number; year: number }> => {
    const weeks = [];
    const today = new Date();

    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (i * 7));

      const dayOfWeek = date.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday is day 1

      const monday = new Date(date);
      monday.setDate(date.getDate() + diff);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // Calculate ISO week number
      const tempDate = new Date(monday);
      tempDate.setHours(0, 0, 0, 0);
      tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
      const yearStart = new Date(tempDate.getFullYear(), 0, 1);
      const weekNumber = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

      weeks.push({
        startDate: monday.toISOString().split('T')[0],
        endDate: sunday.toISOString().split('T')[0],
        weekNumber,
        year: monday.getFullYear(),
      });
    }

    return weeks.reverse(); // Show oldest to newest
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

  const handleEntryClick = (entryId: number) => {
    navigateToPage('entries', { entryId });
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

      {/* Weekly Bar Chart */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h2>{t.dashboard.lastWeeks}</h2>
          <div className="btn-group" style={{ marginTop: 0 }}>
            <button
              className={`btn ${chartMetric === 'hours' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setChartMetric('hours')}
            >
              {t.dashboard.hoursToggle}
            </button>
            <button
              className={`btn ${chartMetric === 'revenue' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setChartMetric('revenue')}
            >
              {t.dashboard.revenueToggle}
            </button>
          </div>
        </div>

        {weeklyData.length === 0 || weeklyData.every(w => w.totalHours === 0) ? (
          <div className="empty-state">
            <h3>{t.dashboard.noEntriesYet}</h3>
            <p>{t.dashboard.startTracking}</p>
          </div>
        ) : (
          <WeeklyBarChart data={weeklyData} metric={chartMetric} />
        )}
      </div>

      {/* Recent Time Entries */}
      <div className="card">
        <h2>{t.dashboard.recentEntries}</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '16px' }}>
          {t.dashboard.clickToEdit}
        </p>

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
                  <tr
                    key={entry.id}
                    onClick={() => handleEntryClick(entry.id)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
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
