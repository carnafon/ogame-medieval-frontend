import React from 'react';

// ResourceIcon: loads SVGs from public/icons/<name>.svg (populated by tools/import_game_icons.js).
// If the SVG is missing or fails to load, we render a tiny neutral fallback.
export default function ResourceIcon({ name, label }) {
  const publicUrl = `${process.env.PUBLIC_URL || ''}/icons/${name}.svg`;

  const [errored, setErrored] = React.useState(false);
  const onImgError = () => setErrored(true);

  return (
    <div className="relative group inline-flex items-center" aria-label={label}>
      {!errored ? (
        <img src={publicUrl} alt={label} className="w-4 h-4" onError={onImgError} />
      ) : (
        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )}

      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
        {label}
      </div>
    </div>
  );
}
