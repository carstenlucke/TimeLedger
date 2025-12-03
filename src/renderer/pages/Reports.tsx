import React, { useState, useEffect } from 'react';
import type { Project, ProjectReport, ReportFilter, ExportFormat } from '../../shared/types';

const Reports: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [report, setReport] = useState<ProjectReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [filter, setFilter] = useState<ReportFilter>({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    project_ids: undefined,
  });
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await window.api.project.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      alert('Failed to load projects');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      const filterToUse: ReportFilter = {
        ...filter,
        project_ids: selectedProjects.length > 0 ? selectedProjects : undefined,
      };
      const data = await window.api.report.generate(filterToUse);
      setReport(data);
      setHasGenerated(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (report.length === 0) {
      alert('Please generate a report first');
      return;
    }

    try {
      const filePath = await window.api.report.export(report, format);
      if (filePath) {
        alert(`Report exported successfully to ${filePath}`);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report');
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
        <h1>Reports</h1>
        <p>Generate time tracking reports</p>
      </div>

      <div className="card">
        <h2>Report Filters</h2>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start_date">Start Date</label>
            <input
              type="date"
              id="start_date"
              value={filter.start_date}
              onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="end_date">End Date</label>
            <input
              type="date"
              id="end_date"
              value={filter.end_date}
              onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
            />
          </div>
        </div>

        {projects.length > 0 && (
          <div className="form-group">
            <label>Projects (leave empty for all)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
              {projects.map((project) => (
                <label
                  key={project.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: selectedProjects.includes(project.id) ? '#e3f2fd' : 'white',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                  />
                  {project.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="btn-group">
          <button className="btn btn-primary" onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
          {hasGenerated && (
            <>
              <button className="btn btn-success" onClick={() => handleExport('csv')}>
                Export CSV
              </button>
              <button className="btn btn-success" onClick={() => handleExport('json')}>
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {hasGenerated && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Hours</h3>
              <div className="value">{getTotalHours().toFixed(2)}</div>
            </div>
            {getTotalValue() !== undefined && (
              <div className="stat-card">
                <h3>Total Value</h3>
                <div className="value">${getTotalValue()!.toFixed(2)}</div>
              </div>
            )}
          </div>

          {report.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <h3>No data found</h3>
                <p>No time entries found for the selected date range and projects</p>
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
                      <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                        Client: {projectReport.client_name}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '600' }}>
                      {projectReport.total_hours.toFixed(2)}h
                    </div>
                    {projectReport.total_value !== undefined && (
                      <div style={{ color: '#27ae60', fontSize: '18px', marginTop: '4px' }}>
                        ${projectReport.total_value.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {projectReport.entries.length > 0 && (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Start</th>
                          <th>End</th>
                          <th>Duration</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectReport.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.date}</td>
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
