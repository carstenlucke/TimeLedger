import React from 'react';
import type { DashboardStatistics } from '../../shared/types';
import { useI18n } from '../context/I18nContext';

interface DashboardStatsProps {
  stats: DashboardStatistics;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const { t, formatCurrency } = useI18n();

  // Berechne Prozentanteile für Donut Chart
  const total = stats.totalProjects;
  const activePercent = total > 0 ? (stats.activeProjects / total) * 100 : 0;
  const completedPercent = total > 0 ? (stats.completedProjects / total) * 100 : 0;
  const pausedPercent = total > 0 ? (stats.pausedProjects / total) * 100 : 0;

  // SVG Donut Chart für Projekt-Status
  const renderProjectStatusChart = () => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    // Berechne Stroke-Offsets für gestackte Segmente
    const activeOffset = 0;
    const completedOffset = (activePercent / 100) * circumference;
    const pausedOffset = ((activePercent + completedPercent) / 100) * circumference;

    // Berechne Positionen für Labels auf dem Ring
    const getLabelPosition = (startPercent: number, segmentPercent: number) => {
      const angle = ((startPercent + segmentPercent / 2) / 100) * 2 * Math.PI - Math.PI / 2;
      const labelRadius = 40;
      return {
        x: 60 + labelRadius * Math.cos(angle),
        y: 60 + labelRadius * Math.sin(angle),
      };
    };

    return (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#e5e7eb" strokeWidth="20" />

        {/* Active segment */}
        {activePercent > 0 && (
          <>
            <circle
              cx="60" cy="60" r={radius}
              fill="transparent"
              stroke="#10B981"
              strokeWidth="20"
              strokeDasharray={`${(activePercent / 100) * circumference} ${circumference}`}
              strokeDashoffset={-activeOffset}
              transform="rotate(-90 60 60)"
            />
            {activePercent > 8 && (
              <text
                x={getLabelPosition(0, activePercent).x}
                y={getLabelPosition(0, activePercent).y}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="white"
              >
                {activePercent.toFixed(2)}%
              </text>
            )}
          </>
        )}

        {/* Completed segment */}
        {completedPercent > 0 && (
          <>
            <circle
              cx="60" cy="60" r={radius}
              fill="transparent"
              stroke="#3B82F6"
              strokeWidth="20"
              strokeDasharray={`${(completedPercent / 100) * circumference} ${circumference}`}
              strokeDashoffset={-completedOffset}
              transform="rotate(-90 60 60)"
            />
            {completedPercent > 8 && (
              <text
                x={getLabelPosition(activePercent, completedPercent).x}
                y={getLabelPosition(activePercent, completedPercent).y}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="white"
              >
                {completedPercent.toFixed(2)}%
              </text>
            )}
          </>
        )}

        {/* Paused segment */}
        {pausedPercent > 0 && (
          <>
            <circle
              cx="60" cy="60" r={radius}
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth="20"
              strokeDasharray={`${(pausedPercent / 100) * circumference} ${circumference}`}
              strokeDashoffset={-pausedOffset}
              transform="rotate(-90 60 60)"
            />
            {pausedPercent > 8 && (
              <text
                x={getLabelPosition(activePercent + completedPercent, pausedPercent).x}
                y={getLabelPosition(activePercent + completedPercent, pausedPercent).y}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="white"
              >
                {pausedPercent.toFixed(2)}%
              </text>
            )}
          </>
        )}

        <text x="60" y="65" textAnchor="middle" fontSize="24" fontWeight="bold" fill="var(--text-primary)">
          {total}
        </text>
      </svg>
    );
  };

  // SVG Donut Chart für Revenue
  const renderRevenueChart = () => {
    const totalRev = stats.totalRevenue;
    const activeRevPercent = totalRev > 0 ? (stats.activeRevenue / totalRev) * 100 : 0;
    const completedRevPercent = totalRev > 0 ? (stats.completedRevenue / totalRev) * 100 : 0;
    const pausedRevPercent = totalRev > 0 ? (stats.pausedRevenue / totalRev) * 100 : 0;

    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    const activeOffset = 0;
    const completedOffset = (activeRevPercent / 100) * circumference;
    const pausedOffset = ((activeRevPercent + completedRevPercent) / 100) * circumference;

    // Berechne Positionen für Labels auf dem Ring
    const getLabelPosition = (startPercent: number, segmentPercent: number) => {
      const angle = ((startPercent + segmentPercent / 2) / 100) * 2 * Math.PI - Math.PI / 2;
      const labelRadius = 40;
      return {
        x: 60 + labelRadius * Math.cos(angle),
        y: 60 + labelRadius * Math.sin(angle),
      };
    };

    return (
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#e5e7eb" strokeWidth="20" />

        {activeRevPercent > 0 && (
          <>
            <circle
              cx="60" cy="60" r={radius}
              fill="transparent"
              stroke="#10B981"
              strokeWidth="20"
              strokeDasharray={`${(activeRevPercent / 100) * circumference} ${circumference}`}
              strokeDashoffset={-activeOffset}
              transform="rotate(-90 60 60)"
            />
            {activeRevPercent > 8 && (
              <text
                x={getLabelPosition(0, activeRevPercent).x}
                y={getLabelPosition(0, activeRevPercent).y}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="white"
              >
                {activeRevPercent.toFixed(2)}%
              </text>
            )}
          </>
        )}

        {completedRevPercent > 0 && (
          <>
            <circle
              cx="60" cy="60" r={radius}
              fill="transparent"
              stroke="#3B82F6"
              strokeWidth="20"
              strokeDasharray={`${(completedRevPercent / 100) * circumference} ${circumference}`}
              strokeDashoffset={-completedOffset}
              transform="rotate(-90 60 60)"
            />
            {completedRevPercent > 8 && (
              <text
                x={getLabelPosition(activeRevPercent, completedRevPercent).x}
                y={getLabelPosition(activeRevPercent, completedRevPercent).y}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="white"
              >
                {completedRevPercent.toFixed(2)}%
              </text>
            )}
          </>
        )}

        {pausedRevPercent > 0 && (
          <>
            <circle
              cx="60" cy="60" r={radius}
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth="20"
              strokeDasharray={`${(pausedRevPercent / 100) * circumference} ${circumference}`}
              strokeDashoffset={-pausedOffset}
              transform="rotate(-90 60 60)"
            />
            {pausedRevPercent > 8 && (
              <text
                x={getLabelPosition(activeRevPercent + completedRevPercent, pausedRevPercent).x}
                y={getLabelPosition(activeRevPercent + completedRevPercent, pausedRevPercent).y}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="white"
              >
                {pausedRevPercent.toFixed(2)}%
              </text>
            )}
          </>
        )}
      </svg>
    );
  };

  return (
    <div className="dashboard-stats">
      {/* Projekt-Status-Übersicht mit Donut */}
      <div className="stat-card">
        <h3>{t.dashboard.projectStatus}</h3>
        <div className="stat-chart-container">
          {renderProjectStatusChart()}
          <div className="stat-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#10B981' }}></span>
              <span>{t.projects.status.active}: {stats.activeProjects}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#3B82F6' }}></span>
              <span>{t.projects.status.completed}: {stats.completedProjects}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#F59E0B' }}></span>
              <span>{t.projects.status.paused}: {stats.pausedProjects}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown mit Donut */}
      <div className="stat-card">
        <h3>{t.dashboard.revenueBreakdown}</h3>
        <div className="stat-chart-container">
          {renderRevenueChart()}
          <div className="stat-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#10B981' }}></span>
              <span>{t.projects.status.active}: {formatCurrency(stats.activeRevenue)}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#3B82F6' }}></span>
              <span>{t.projects.status.completed}: {formatCurrency(stats.completedRevenue)}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#F59E0B' }}></span>
              <span>{t.projects.status.paused}: {formatCurrency(stats.pausedRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unbilled Revenue */}
      <div className="stat-card highlight">
        <h3>{t.dashboard.unbilledRevenue}</h3>
        <div className="stat-number-large">
          {formatCurrency(stats.unbilledRevenue)}
        </div>
        <div className="stat-subtitle">
          {stats.unbilledHours.toFixed(1)} {t.common.hours}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
