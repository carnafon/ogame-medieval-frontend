import React from 'react';
// Using Heroicons for clean UI icons. Install with:
// npm install @heroicons/react
import {
  CubeIcon,
  SparklesIcon,
  ArrowPathIcon,
  DropIcon,
  DiamondIcon,
  BoltIcon,
  BeakerIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';

// Map resource keys to Heroicons components. These are general-purpose icons
// chosen to visually represent resource types. You can swap icons freely.
const ICON_COMPONENTS = {
  wood: CubeIcon, // generic block
  stone: CubeIcon,
  food: SparklesIcon,
  water: DropIcon,
  rare_iron: DiamondIcon,
  sea_salt: BeakerIcon,
  silk: SparklesIcon,
  purple_dye: SparklesIcon,
  sulfur: BoltIcon,
  precious_gems: DiamondIcon
};

export default function ResourceIcon({ name, label }) {
  const Comp = ICON_COMPONENTS[name] || ChevronUpDownIcon;
  // Prefer a custom SVG placed in public/icons/<name>.svg (download from game-icons.net)
  const publicUrl = `${process.env.PUBLIC_URL || ''}/icons/${name}.svg`;

  const [useFallback, setUseFallback] = React.useState(false);

  const onImgError = (e) => {
    setUseFallback(true);
  };

  return (
    <div className="relative group inline-flex items-center" aria-label={label}>
      {!useFallback ? (
        // try to load user-provided icon from public folder
        <img
          src={publicUrl}
          alt={label}
          className="w-4 h-4 text-gray-300"
          onError={onImgError}
        />
      ) : (
        // fallback to heroicon
        <Comp className="w-4 h-4 text-gray-300" aria-hidden="true" />
      )}

      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
        {label}
      </div>
    </div>
  );
}
