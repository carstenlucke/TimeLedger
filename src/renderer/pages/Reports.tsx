import React, { useState, useEffect } from 'react';
import type { Project, ProjectReport, ReportFilter, ExportFormat, ProjectStatus } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import { LocalizedDateInput } from '../components/LocalizedDateInput';

const Reports: React.FC = () => {
  const { showNotification } = useNotification();
  const { t, formatCurrency, formatNumber, formatDate } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [report, setReport] = useState<ProjectReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [filter, setFilter] = useState<ReportFilter>({
    start_date: '',
    end_date: '',
    project_ids: undefined,
  });
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await window.api.project.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      showNotification(t.notifications.loadFailed, 'error');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      const filterToUse: ReportFilter = {
        start_date: useDateFilter ? filter.start_date : undefined,
        end_date: useDateFilter ? filter.end_date : undefined,
        project_ids: selectedProjects.length > 0 ? selectedProjects : undefined,
      };
      const data = await window.api.report.generate(filterToUse);

      // Apply status filter if needed
      let filteredData = data;
      if (statusFilter !== 'all') {
        filteredData = data.filter(projectReport => {
          const project = projects.find(p => p.id === projectReport.project_id);
          return project && project.status === statusFilter;
        });
      }

      setReport(filteredData);
      setHasGenerated(true);
      showNotification(t.notifications.success, 'success');
    } catch (error) {
      console.error('Failed to generate report:', error);
      showNotification(t.notifications.saveFailed, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (report.length === 0) {
      showNotification(t.reports.noData, 'warning');
      return;
    }

    try {
      const filePath = await window.api.report.export(report, format);
      if (filePath) {
        showNotification(`${t.notifications.success}: ${filePath}`, 'success');
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const toggleProject = (projectId: number) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTotalHours = (): number => {
    return report.reduce((sum, project) => sum + project.total_hours, 0);
  };

  const getTotalValue = (): number | undefined => {
    const values = report.map((p) => p.total_value).filter((v) => v !== undefined) as number[];
    if (values.length === 0) return undefined;
    return values.reduce((sum, value) => sum + value, 0);
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t.reports.title}</h1>
        <p>{t.reports.subtitle}</p>
      </div>

      <div className="card">
        <h2>{t.reports.generateReport}</h2>

        {/* Date Range Filter Section */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid var(--border-secondary)',
        }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
              {t.reports.dateRange}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: 0, visibility: 'hidden' }}>
                  {/* Invisible label for alignment */}
                </label>
                <button
                  type="button"
                  className={!useDateFilter ? 'btn btn-primary' : 'btn btn-secondary'}
                  onClick={() => {
                    setUseDateFilter(false);
                    setFilter({ ...filter, start_date: '', end_date: '' });
                  }}
                  style={{ width: '100%' }}
                >
                  {t.reports.noRestriction}
                </button>
              </div>

              {useDateFilter && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
                    <label htmlFor="start_date" style={{ marginBottom: 0, fontSize: '13px', fontWeight: '500' }}>
                      {t.reports.startDate}
                    </label>
                    <LocalizedDateInput
                      id="start_date"
                      value={filter.start_date || ''}
                      onChange={(value) => setFilter({ ...filter, start_date: value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
                    <label htmlFor="end_date" style={{ marginBottom: 0, fontSize: '13px', fontWeight: '500' }}>
                      {t.reports.endDate}
                    </label>
                    <LocalizedDateInput
                      id="end_date"
                      value={filter.end_date || ''}
                      onChange={(value) => setFilter({ ...filter, end_date: value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {!useDateFilter && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setUseDateFilter(true);
                    setFilter({
                      ...filter,
                      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                      end_date: new Date().toISOString().split('T')[0],
                    });
                  }}
                  style={{ minWidth: '180px' }}
                >
                  {t.reports.dateRange}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Project Filter Section */}
        {projects.length > 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid var(--border-secondary)',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginTop: 0, marginBottom: '16px' }}>
              {t.common.project}
            </h3>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                {t.reports.allProjects}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => toggleProject(project.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: selectedProjects.includes(project.id) ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                      color: selectedProjects.includes(project.id) ? 'white' : 'var(--text-primary)',
                      fontWeight: selectedProjects.includes(project.id) ? '600' : '500',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      if (!selectedProjects.includes(project.id)) {
                        el.style.backgroundColor = 'var(--bg-secondary)';
                        el.style.boxShadow = '0 0 0 2px var(--accent-blue)30';
                      } else {
                        el.style.opacity = '0.85';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.opacity = '1';
                      el.style.boxShadow = 'none';
                      el.style.backgroundColor = selectedProjects.includes(project.id) ? 'var(--accent-blue)' : 'var(--bg-tertiary)';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => {}}
                      style={{
                        cursor: 'pointer',
                        accentColor: 'currentColor',
                      }}
                    />
                    {project.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label htmlFor="status-filter" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                {t.projects.status.label}
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                className="form-control"
                style={{ maxWidth: '200px' }}
              >
                <option value="all">{t.projects.status.all}</option>
                <option value="active">{t.projects.status.active}</option>
                <option value="completed">{t.projects.status.completed}</option>
                <option value="paused">{t.projects.status.paused}</option>
              </select>
            </div>
            
          </div>
        )}

        <div className="btn-group">
          <button className="btn btn-primary" onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? t.common.loading : t.reports.generate}
          </button>
          {hasGenerated && (
            <>
              <button className="btn btn-success" onClick={() => handleExport('csv')}>
                {t.reports.exportCSV}
              </button>
              <button className="btn btn-success" onClick={() => handleExport('json')}>
                {t.reports.exportJSON}
              </button>
            </>
          )}
        </div>
      </div>

      {hasGenerated && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{t.reports.totalHours}</h3>
              <div className="value">{formatNumber(getTotalHours(), 2)}</div>
            </div>
            {getTotalValue() !== undefined && (
              <div className="stat-card">
                <h3>{t.projects.totalValue}</h3>
                <div className="value">{formatCurrency(getTotalValue()!)}</div>
              </div>
            )}
          </div>

          {report.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <h3>{t.reports.noData}</h3>
                <p>{t.reports.noDataMessage}</p>
              </div>
            </div>
          ) : (
            report.map((projectReport) => (
              <div key={projectReport.project_id} className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <h2>{projectReport.project_name}</h2>
                    {projectReport.client_name && (
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginTop: '4px' }}>
                        {t.projects.client}: {projectReport.client_name}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600' }}>
                      {formatNumber(projectReport.total_hours, 2)}h
                    </div>
                    {projectReport.total_value !== undefined && (
                      <div style={{ color: 'var(--accent-green)', fontSize: '18px', marginTop: '4px' }}>
                        {formatCurrency(projectReport.total_value)}
                      </div>
                    )}
                  </div>
                </div>

                {projectReport.entries.length > 0 && (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.common.date}</th>
                          <th>{t.projects.start}</th>
                          <th>{t.projects.end}</th>
                          <th>{t.common.duration}</th>
                          <th>{t.common.description}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectReport.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{formatDate(entry.date)}</td>
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
            ))
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
