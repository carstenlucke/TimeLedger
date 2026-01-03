import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';

interface DurationPickerProps {
  value: number | undefined;
  onChange: (minutes: number | undefined) => void;
  required?: boolean;
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
  required,
}) => {
  const { t } = useI18n();
  const [showManualInput, setShowManualInput] = useState(false);

  // Calculate hours and minutes from total minutes
  const hours = value !== undefined ? Math.floor(value / 60) : undefined;
  const minutes = value !== undefined ? value % 60 : undefined;

  // Round minutes to nearest 5 for button selection
  const roundedMinutes = minutes !== undefined ? Math.round(minutes / 5) * 5 : undefined;

  const handleHourClick = (h: number) => {
    const currentMinutes = minutes ?? 0;
    const newTotal = h * 60 + currentMinutes;
    onChange(newTotal > 0 ? newTotal : undefined);
  };

  const handleMinuteClick = (m: number) => {
    const currentHours = hours ?? 0;
    const newTotal = currentHours * 60 + m;
    onChange(newTotal > 0 ? newTotal : undefined);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val ? parseInt(val, 10) : undefined);
  };

  const formatDuration = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const hourButtons = [
    [0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
  ];

  const minuteButtons = [
    [0, 5, 10, 15, 20, 25],
    [30, 35, 40, 45, 50, 55],
  ];

  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    minWidth: '44px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-secondary)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
  };

  const selectedButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'var(--accent-blue)',
    borderColor: 'var(--accent-blue)',
    color: 'var(--bg-primary)',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '6px',
    marginBottom: '6px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  };

  return (
    <div>
      {/* Hours Section */}
      <div style={sectionStyle}>
        <span style={labelStyle}>{t.durationPicker?.hours || 'Hours'}</span>
        {hourButtons.map((row, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {row.map((h) => (
              <button
                key={h}
                type="button"
                style={hours === h ? selectedButtonStyle : buttonStyle}
                onClick={() => handleHourClick(h)}
                onMouseEnter={(e) => {
                  if (hours !== h) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hours !== h) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.borderColor = 'var(--border-secondary)';
                  }
                }}
              >
                {h}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Minutes Section */}
      <div style={sectionStyle}>
        <span style={labelStyle}>{t.durationPicker?.minutes || 'Minutes'}</span>
        {minuteButtons.map((row, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {row.map((m) => (
              <button
                key={m}
                type="button"
                style={roundedMinutes === m ? selectedButtonStyle : buttonStyle}
                onClick={() => handleMinuteClick(m)}
                onMouseEnter={(e) => {
                  if (roundedMinutes !== m) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (roundedMinutes !== m) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.borderColor = 'var(--border-secondary)';
                  }
                }}
              >
                {m.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Total Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '6px',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {t.durationPicker?.total || 'Total'}:
        </span>
        <span
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: value ? 'var(--accent-blue)' : 'var(--text-tertiary)',
          }}
        >
          {value ? formatDuration(value) : '—'}
        </span>
      </div>

      {/* Manual Input Toggle */}
      <button
        type="button"
        onClick={() => setShowManualInput(!showManualInput)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-tertiary)',
          fontSize: '13px',
          cursor: 'pointer',
          padding: '4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '10px' }}>{showManualInput ? '▼' : '▶'}</span>
        {t.durationPicker?.manualInput || 'Manual input'}
      </button>

      {/* Collapsible Manual Input */}
      {showManualInput && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min="1"
              value={value || ''}
              onChange={handleManualChange}
              placeholder="0"
              required={required && !value}
              style={{
                width: '100px',
                padding: '8px 12px',
                border: '1px solid var(--border-secondary)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {t.durationPicker?.minutesLabel || 'minutes'}
            </span>
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="hidden"
          value={value || ''}
          required
        />
      )}
    </div>
  );
};
