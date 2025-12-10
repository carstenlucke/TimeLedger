import React from 'react';

interface CopyIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const CopyIcon: React.FC<CopyIconProps> = ({
  size = 16,
  color = 'white',
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Back rectangle (top-right) */}
      <rect
        x="5.5"
        y="1.5"
        width="9"
        height="9"
        rx="2"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Front rectangle (bottom-left) */}
      <rect
        x="1.5"
        y="5.5"
        width="9"
        height="9"
        rx="2"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
};

export default CopyIcon;
