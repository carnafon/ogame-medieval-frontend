import React, { useState, useCallback } from 'react';
import { Axe, House, Users, Bolt, Factory, Store, Shield, RefreshCcw, Landmark } from 'lucide-react';

// --- Reusable Card Component (For consistent dark-mode styling) ---
/**
 * Card Component
 * A reusable container component with standard modern styling.
 */
const Card = ({ children, className = '', fullWidth = false }) => {
  const widthClass = fullWidth ? 'max-w-5xl w-full' : 'max-w-4xl w-full';

  return (
    <div
      className={`
        ${widthClass} 
        mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl 
        border border-gray-700 
        transition-all duration-300 
        ${className}
      `}
    >
      {children}
    </div>
  );
};
// --- End Card Component ---


// --- Resource Bar Component ---

const ResourceBar = ({ resources }) => {
  const resourceData = [
    { name: 'Wood', icon: Axe, amount: resources.wood, color: 'text-yellow-600', bg: 'bg-yellow-600/10' },
    { name: 'Stone', icon: Landmark, amount: resources.stone, color: 'text-gray-400', bg: 'bg-gray-400/10' },
    { name: 'Food', icon: Store, amount: resources.food, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Population', icon: Users, amount: resources.population, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { name: 'Energy', icon: Bolt, amount: resources.energy, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700 w-full max-w-6xl mx-auto shadow-inner">
      {resourceData.map((resource) => (
        <div
          key={resource.name}
          className="flex items-center space-x-2 p-2 w-32 sm:w-40 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition duration-150"
        >
          <div className={`p-1 rounded-full ${resource.bg}`}>
            <resource.icon className={`w-5 h-5 ${resource.color}`} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {resource.name}
            </span>
            <span className="text-lg font-bold text-white tabular-nonum">
              {resource.amount.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Action Panel Component ---

const ActionPanel = ({ handleBuild, disabled }) => {
    
    const buildings = [
        { type: 'house', name: 'House', icon: House, cost: { wood: 50, stone: 20 }, produces: '1 Pop/s' },
        { type: 'factory', name: 'Factory', icon: Factory, cost: { wood: 100, stone: 50 }, produces: '10 Energy/s' },
        { type: 'barracks', name: 'Barracks', icon: Shield, cost: { wood: 80, stone: 80 }, produces: 'Defense' },
    ];

    return (
        <Card className="p-4" fullWidth>
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-2">
                Available Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {buildings.map(building => (
                    <button
                        key={building.type}
                        onClick={() => handleBuild(building)}
                        disabled={disabled}
                        className="flex flex-col items-center justify-center p-3 text-center bg-indigo-600/20 text-indigo-300 rounded-lg border border-indigo-700 transition duration-150 hover:bg-indigo-600/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                        <building.icon className="w-8 h-8 mb-1" />
                        <span className="font-semibold">{building.name}</span>
                        <div className="text-xs mt-1 text-gray-300 space-y-0.5">
                            <p className="text-yellow-400">Wood: {building.cost.wood}</p>
                            <p className="text-gray-400">Stone: {building.cost.stone}</p>
                        </div>
                    </button>
                ))}
            </div>
        </Card>
    );
};


// --- Main Game UI Component ---

const GameUI = () => {
    // Initial State for a demo game
    const [gameState, setGameState] = useState({
        resources: {
            wood: 500,
            stone: 300,
            food: 150,
            population: 10,
            energy: 50,
        },
        buildings: {
            house: 1,
            factory: 0,
            barracks: 0,
        },
        message: 'Welcome to your settlement!',
        isBuilding: false,
    });

    const handleBuild = useCallback((building) => {
        const { cost, type } = building;
        const { resources } = gameState;

        // 1. Check if the user has enough resources
        if (resources.wood < cost.wood || resources.stone < cost.stone) {
            setGameState(prev => ({
                ...prev,
                message: `Not enough resources to build ${building.name}!`
            }));
            return;
        }

        setGameState(prev => ({ ...prev, isBuilding: true }));

        // 2. Simulate building time and resource deduction
        setTimeout(() => {
            setGameState(prev => ({
                ...prev,
                resources: {
                    ...prev.resources,
                    wood: prev.resources.wood - cost.wood,
                    stone: prev.resources.stone - cost.stone,
                },
                buildings: {
                    ...prev.buildings,
                    [type]: prev.buildings[type] + 1,
                },
                message: `${building.name} successfully built!`,
                isBuilding: false,
            }));
        }, 1000); // 1 second build time simulation

    }, [gameState]);

    // Simple function to simulate resource tick/generation
    const handleTick = () => {
        setGameState(prev => ({
            ...prev,
            resources: {
                ...prev.resources,
                wood: prev.resources.wood + 5,
                stone: prev.resources.stone + 3,
                food: prev.resources.food + prev.buildings.house * 2, // Food scales with houses
                energy: prev.resources.energy + prev.buildings.factory * 10, // Energy scales with factories
            },
            message: 'Resources generated (Tick +5 Wood, +3 Stone + Production)!'
        }));
    };


    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 font-inter text-white space-y-6">
            <h1 className="text-4xl font-extrabold text-white pt-8">
                Settlement Builder
            </h1>
            
            {/* Resource Display */}
            <ResourceBar resources={gameState.resources} />

            {/* Main Game Area and Messages */}
            <Card fullWidth className="min-h-96 flex flex-col items-center justify-center p-8 bg-gray-900/30">
                <div className="w-full text-center">
                    <h2 className="text-3xl font-bold text-teal-400 mb-4">Your Kingdom</h2>
                    <p className="text-lg text-gray-300 mb-6">{gameState.message}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center w-full max-w-md mt-4">
                    <p className="text-gray-400">Houses: <span className="text-white font-bold">{gameState.buildings.house}</span></p>
                    <p className="text-gray-400">Factories: <span className="text-white font-bold">{gameState.buildings.factory}</span></p>
                    <p className="text-gray-400">Barracks: <span className="text-white font-bold">{gameState.buildings.barracks}</span></p>
                </div>
                
                {/* Manual Tick Button for demo */}
                <button
                    onClick={handleTick}
                    className="mt-8 flex items-center space-x-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 transition duration-150 transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                    <RefreshCcw className="w-5 h-5" />
                    <span>Simulate Game Tick / Gather</span>
                </button>

            </Card>

            {/* Action Panel */}
            <ActionPanel 
                handleBuild={handleBuild}
                disabled={gameState.isBuilding}
            />
            
            <div className="h-10"></div> {/* Footer spacing */}
        </div>
    );
};

const App = () => {
    return <GameUI />;
};

export default App;
