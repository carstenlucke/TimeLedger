import React from 'react';
import { useI18n } from '../context/I18nContext';

interface WeekData {
  weekLabel: string;
  hours: number;
  weekNumber: number;
  year: number;
}

interface WeeklyBarChartProps {
  data: WeekData[];
}

const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data }) => {
  const { t } = useI18n();

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

  const maxHours = Math.max(...data.map(d => d.hours), 1);
  const chartHeight = 200;
  const topPadding = 30; // Extra space for labels above bars
  const barWidth = 40;
  const gap = 12;
  const chartWidth = data.length * (barWidth + gap) - gap;

  return (
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
          const barHeight = (week.hours / maxHours) * chartHeight;
          const x = index * (barWidth + gap);
          const y = topPadding + chartHeight - barHeight;

          return (
            <g key={`${week.year}-${week.weekNumber}`}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="var(--accent-blue)"
                rx="4"
              />

              {/* Hours label on top of bar */}
              {week.hours > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  style={{
                    fontSize: '11px',
                    fill: 'var(--text-primary)',
                    fontWeight: '600'
                  }}
                >
                  {formatHoursMinutes(week.hours)}
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
  );
};

export default WeeklyBarChart;
