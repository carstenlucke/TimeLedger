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
  const { formatNumber } = useI18n();

  if (data.length === 0) {
    return null;
  }

  const maxHours = Math.max(...data.map(d => d.hours), 1);
  const chartHeight = 200;
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
        height={chartHeight + 60}
        style={{ minWidth: '100%' }}
      >
        {data.map((week, index) => {
          const barHeight = (week.hours / maxHours) * chartHeight;
          const x = index * (barWidth + gap);
          const y = chartHeight - barHeight;

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
                  y={y - 5}
                  textAnchor="middle"
                  style={{
                    fontSize: '12px',
                    fill: 'var(--text-primary)',
                    fontWeight: '600'
                  }}
                >
                  {formatNumber(week.hours, 1)}h
                </text>
              )}

              {/* Week label below bar */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
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
