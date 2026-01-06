import React, { useEffect, useState } from 'react';
import type { TimeEntry, Project } from '../../shared/types';
import { useI18n } from '../context/I18nContext';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

interface WeekInfo {
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
}

interface GroupedEntries {
  project: Project;
  entries: TimeEntry[];
  totalMinutes: number;
  totalRevenue: number;
  color: string;
}

interface WeekDetailDrawerProps {
  week: WeekInfo | null;
  onClose: () => void;
  projects: Project[];
  projectColors: Map<number, string>;
  onEntryClick?: (entryId: number) => void;
}

const WeekDetailDrawer: React.FC<WeekDetailDrawerProps> = ({
  week,
  onClose,
  projects,
  projectColors,
  onEntryClick,
}) => {
  const { t, formatDate, formatCurrency } = useI18n();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (week) {
      loadEntries();
      // Expand all projects by default
      const allProjectIds = new Set(projects.map(p => p.id));
      setExpandedProjects(allProjectIds);
    } else {
      setEntries([]);
    }
  }, [week]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && week) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [week, onClose]);

  const loadEntries = async () => {
    if (!week) return;

    setIsLoading(true);
    try {
      const allEntries = await window.api.timeEntry.getAll();
      const weekEntries = allEntries.filter(
        entry => entry.date >= week.startDate && entry.date <= week.endDate
      );
      // Sort by date desc, then by start_time desc
      weekEntries.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.start_time || '').localeCompare(a.start_time || '');
      });
      setEntries(weekEntries);
    } catch (error) {
      console.error('Failed to load week entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getGroupedEntries = (): GroupedEntries[] => {
    const projectMap = new Map<number, Project>();
    projects.forEach(p => projectMap.set(p.id, p));

    const groups = new Map<number, GroupedEntries>();

    entries.forEach(entry => {
      const project = projectMap.get(entry.project_id);
      if (!project) return;

      if (!groups.has(entry.project_id)) {
        groups.set(entry.project_id, {
          project,
          entries: [],
          totalMinutes: 0,
          totalRevenue: 0,
          color: projectColors.get(entry.project_id) || '#3B82F6',
        });
      }

      const group = groups.get(entry.project_id)!;
      group.entries.push(entry);
      group.totalMinutes += entry.duration_minutes;
      group.totalRevenue += (entry.duration_minutes / 60) * (project.hourly_rate || 0);
    });

    // Sort groups by total minutes desc
    return Array.from(groups.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  };

  const groupedEntries = getGroupedEntries();
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const totalRevenue = groupedEntries.reduce((sum, g) => sum + g.totalRevenue, 0);

  if (!week) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999,
          transition: 'opacity 0.2s ease',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '450px',
          maxWidth: '90vw',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {t.dashboard.week} {week.weekNumber}, {week.year}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {formatDate(week.startDate)} - {formatDate(week.endDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--bg-secondary)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              {t.dashboard.totalTime}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: '600' }}>
              {formatDuration(totalMinutes)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              {t.dashboard.totalRevenue}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: '600' }}>
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              {t.common.loading}
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              {t.timeEntries.noEntries}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupedEntries.map((group) => (
                <div
                  key={group.project.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Project Header */}
                  <button
                    onClick={() => toggleProject(group.project.id)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        backgroundColor: group.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {group.project.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {formatDuration(group.totalMinutes)} · {formatCurrency(group.totalRevenue)}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {expandedProjects.has(group.project.id) ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </div>
                  </button>

                  {/* Entries List */}
                  {expandedProjects.has(group.project.id) && (
                    <div style={{ borderTop: '1px solid var(--border-color)' }}>
                      {group.entries.map((entry, index) => (
                        <div
                          key={entry.id}
                          onClick={() => onEntryClick?.(entry.id)}
                          style={{
                            padding: '10px 16px',
                            borderBottom: index < group.entries.length - 1 ? '1px solid var(--border-color)' : 'none',
                            cursor: onEntryClick ? 'pointer' : 'default',
                            transition: 'background-color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (onEntryClick) {
                              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {formatDate(entry.date)}
                              {entry.start_time && entry.end_time && (
                                <span> · {entry.start_time} - {entry.end_time}</span>
                              )}
                            </span>
                            <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                              {formatDuration(entry.duration_minutes)}
                            </span>
                          </div>
                          {entry.description && (
                            <div
                              style={{
                                marginTop: '4px',
                                fontSize: '0.875rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {entry.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>
            {t.common.close}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default WeekDetailDrawer;
