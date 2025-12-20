import React, { useRef } from 'react';
import { useI18n } from '../context/I18nContext';

interface LocalizedDateInputProps {
  id?: string;
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  required?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const LocalizedDateInput: React.FC<LocalizedDateInputProps> = ({
  id,
  value,
  onChange,
  required,
  style,
  className,
}) => {
  const { locale, formatDate } = useI18n();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClick = () => {
    // Open the native date picker
    dateInputRef.current?.showPicker?.();
  };

  const displayValue = value ? formatDate(value) : '';
  const placeholder = locale === 'de' ? 'TT.MM.JJJJ' : 'DD/MM/YYYY';

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Hidden native date input for the picker */}
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={handleDateChange}
        required={required}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
        }}
      />
      {/* Visible formatted text input */}
      <input
        type="text"
        id={id}
        value={displayValue}
        onClick={handleClick}
        readOnly
        placeholder={placeholder}
        required={required}
        className={className}
        style={{
          width: '100%',
          cursor: 'pointer',
        }}
      />
    </div>
  );
};
