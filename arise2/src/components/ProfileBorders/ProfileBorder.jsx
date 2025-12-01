import React from 'react';
import './borders.css';

// Border style configuration
const BORDER_STYLES = {
  rankD: { className: 'border-rankD', label: 'Novice', color: '#8b7355' },
  rankC: { className: 'border-rankC', label: 'Apprentice', color: '#60a5fa' },
  rankB: { className: 'border-rankB', label: 'Warrior', color: '#818cf8' },
  rankA: { className: 'border-rankA', label: 'Legend', color: '#fbbf24' },
  rankS: { className: 'border-rankS', label: 'Mythic', color: '#ef4444' },
};

export default function ProfileBorder({ borderType = 'rankD', children, size = 120 }) {
  const borderStyle = BORDER_STYLES[borderType] || BORDER_STYLES.rankD;

  return (
    <div
      className={`profile-border-container ${borderStyle.className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {children}
    </div>
  );
}

export { BORDER_STYLES };
