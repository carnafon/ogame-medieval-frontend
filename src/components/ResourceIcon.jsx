import React from 'react';

// Small inline SVG icons mapped by resource key. Keep them minimal and tailwind-friendly.
export const ICONS = {
  wood: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20c0-2 2-4 6-6 4-2 6-4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  stone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10l9-7 9 7-9 11L3 10z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  food: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2c2 2 4 2 6 4s2 4 0 6-4 2-6 4-4 2-6 0-2-4 0-6 4-2 6-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  water: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2s4 5 4 8a4 4 0 11-8 0c0-3 4-8 4-8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  default: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
};

export default function ResourceIcon({ name, label }) {
  const icon = ICONS[name] || ICONS.default;
  return (
    <div className="relative group inline-flex items-center" aria-label={label}>
      <div className="text-gray-300 w-4 h-4">{icon}</div>
      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
        {label}
      </div>
    </div>
  );
}
