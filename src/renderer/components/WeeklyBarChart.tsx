import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';

interface ProjectHours {
  projectId: number;
  projectName: string;
  hours: number;
  revenue: number;
  color: string;
}

export interface WeekData {
  weekLabel: string;
  totalHours: number;
  totalRevenue: number;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  projects: ProjectHours[];
}

interface WeeklyBarChartProps {
  data: WeekData[];
  metric: 'hours' | 'revenue';
  onWeekClick?: (week: WeekData) => void;
}

const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data, metric, onWeekClick }) => {
  const { t, formatCurrency } = useI18n();
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);

  if (data.length === 0) {
    return null;
  }

  const formatHoursMinutes = (totalHours: number): string => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    if (hours === 0 && minutes === 0) {
      return '0 Min';
    } else if (hours === 0) {
      return `${minutes} Min`;
    } else if (minutes === 0) {
      return `${hours} ${t.dashboard.hours}`;
    } else {
      return `${hours} ${t.dashboard.hours} ${minutes} Min`;
    }
  };

  const formatValue = (value: number): string => {
    if (metric === 'revenue') {
      return formatCurrency(value);
    }
    return formatHoursMinutes(value);
  };

  // Get all unique projects for legend
  const allProjects = new Map<number, { name: string; color: string }>();
  data.forEach(week => {
    week.projects.forEach(proj => {
      if (!allProjects.has(proj.projectId)) {
        allProjects.set(proj.projectId, { name: proj.projectName, color: proj.color });
      }
    });
  });

  const getWeekTotal = (week: WeekData): number => (
    metric === 'revenue' ? week.totalRevenue : week.totalHours
  );
  const getProjectValue = (project: ProjectHours): number => (
    metric === 'revenue' ? project.revenue : project.hours
  );

  const maxValue = Math.max(...data.map(getWeekTotal), 1);
  const chartHeight = 200;
  const topPadding = 30; // Extra space for labels above bars
  const barWidth = 50;
  const gap = 12;
  const chartWidth = data.length * (barWidth + gap) - gap;

  return (
    <div>
      <div style={{
        overflowX: 'auto',
        padding: '20px 0',
      }}>
        <svg
          width={chartWidth}
          height={chartHeight + topPadding + 60}
          style={{ minWidth: '100%' }}
        >
          {data.map((week, index) => {
            const x = index * (barWidth + gap);
            let currentY = topPadding + chartHeight;
            const weekKey = `${week.year}-${week.weekNumber}`;
            const isHovered = hoveredWeek === weekKey;

            return (
              <g
                key={weekKey}
                style={{ cursor: onWeekClick ? 'pointer' : 'default' }}
                onMouseEnter={() => setHoveredWeek(weekKey)}
                onMouseLeave={() => setHoveredWeek(null)}
                onClick={() => onWeekClick?.(week)}
              >
                {/* Hover background */}
                {isHovered && (
                  <rect
                    x={x - 4}
                    y={topPadding}
                    width={barWidth + 8}
                    height={chartHeight + 30}
                    fill="var(--bg-tertiary)"
                    rx={6}
                    style={{ opacity: 0.5 }}
                  />
                )}
                {/* Stacked bars for each project */}
                {week.projects.map((project, projIndex) => {
                  const value = getProjectValue(project);
                  const segmentHeight = (value / maxValue) * chartHeight;
                  const segmentY = currentY - segmentHeight;

                  // Only apply border radius to top segment
                  const isTopSegment = projIndex === week.projects.length - 1;

                  const segment = (
                    <g key={`${week.year}-${week.weekNumber}-${project.projectId}`}>
                      <rect
                        x={x}
                        y={segmentY}
                        width={barWidth}
                        height={segmentHeight}
                        fill={project.color}
                        rx={isTopSegment ? 4 : 0}
                        style={{
                          clipPath: isTopSegment ? undefined : 'inset(0 0 -4px 0)'
                        }}
                      />
                      {/* Show hours for each segment only if there are multiple projects and segment is large enough */}
                      {week.projects.length > 1 && segmentHeight > 25 && (
                        <text
                          x={x + barWidth / 2}
                          y={segmentY + segmentHeight / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: '10px',
                            fill: 'white',
                            fontWeight: '600',
                            pointerEvents: 'none',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }}
                        >
                          {formatValue(value)}
                        </text>
                      )}
                    </g>
                  );

                  currentY = segmentY;
                  return segment;
                })}

                {/* Total hours label on top of bar */}
                {getWeekTotal(week) > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={currentY - 8}
                    textAnchor="middle"
                    style={{
                      fontSize: '11px',
                      fill: 'var(--text-primary)',
                      fontWeight: '600'
                    }}
                  >
                    {formatValue(getWeekTotal(week))}
                  </text>
                )}

                {/* Week label below bar */}
                <text
                  x={x + barWidth / 2}
                  y={topPadding + chartHeight + 20}
                  textAnchor="middle"
                  style={{
                    fontSize: '11px',
                    fill: 'var(--text-secondary)',
                  }}
                >
                  {week.weekLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      {allProjects.size > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '16px',
          justifyContent: 'center',
        }}>
          {Array.from(allProjects.entries()).map(([projectId, project]) => (
            <div
              key={projectId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: project.color,
                  borderRadius: '3px',
                }}
              />
              <span style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                {project.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklyBarChart;
