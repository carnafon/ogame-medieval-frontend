import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * ResourceDisplay Component
 * Displays a list of resources with their names, icons, and current amounts.
 * @param {Array<{name: string, icon: string, amount: number}>} resources - The list of resources to display.
 */
const ResourceDisplay = ({ resources }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 p-4 md:p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-5xl w-full mx-auto">
      {resources.map((resource, index) => (
        <div
          key={resource.name}
          className="flex items-center space-x-4 p-4 w-full sm:w-56 bg-gray-700 rounded-lg transition duration-300 hover:shadow-lg hover:bg-gray-600/70"
        >
          {/* Icon/Emoji Container */}
          <div className="flex-shrink-0 text-3xl p-2 bg-yellow-400/20 rounded-full flex items-center justify-center">
            {/* Using emoji for simplicity, but could be an SVG icon */}
            <span>{resource.icon}</span>
          </div>
          {/* Resource Details */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              {resource.name}
            </span>
            <span className="text-2xl font-bold text-white tabular-nonum">
              {resource.amount.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main Application Component (Required to demonstrate the display) ---

const initialResources = [
  { name: 'Gold', icon: '💰', amount: 1500 },
  { name: 'Wood', icon: '🪵', amount: 450 },
  { name: 'Stone', icon: '⛏️', amount: 890 },
];

const App = () => {
  const [resources, setResources] = useState(initialResources);

  // Function to simulate resource update for demonstration
  const handleRefresh = () => {
    const newResources = resources.map(res => ({
      ...res,
      // Simulate a change in amount
      amount: Math.floor(res.amount * (1 + (Math.random() * 0.2 - 0.1))), // +/- 10% change
    }));
    setResources(newResources);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-inter">
      <h1 className="text-4xl font-extrabold text-white mb-8">
        Inventory Dashboard
      </h1>

      <ResourceDisplay resources={resources} />

      {/* Control Panel */}
      <div className="mt-8 flex flex-col items-center">
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 transform hover:scale-105 active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Simulate Resource Update</span>
        </button>
        <p className="mt-4 text-gray-400 text-sm">
          Click the button to see the resource amounts change in real-time.
        </p>
      </div>

    </div>
  );
};

export default App;