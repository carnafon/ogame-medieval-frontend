import React, { useEffect } from 'react';
import ResourceDisplay from './ResourceDisplay';
import Card from './Card';
import { BUILDING_DEFINITIONS } from '../hooks/useGameData';
import { PRODUCTION_RATES } from '../constants/productionRates';
import { perTickToPerMinute, perTickToPerHour } from '../utils/productionUtils';

export default function HomeView({
  userData,
  buildings,
  population,
  canBuild,
  onBuild,
  onShowMap,
  onLogout,
  uiMessage,
  buildCosts = {},
  fetchBuildCost,
}) {

  // Fetch server costs when user data changes
  useEffect(() => {
    if (!userData || !fetchBuildCost) return;
    // fetch for all building types
    Object.keys(BUILDING_DEFINITIONS).forEach(type => fetchBuildCost(type, userData.entity_id));
  }, [userData, fetchBuildCost]);
  // Si la población máxima no viene desde el backend, calcularla desde los edificios
  const computeMaxFromBuildings = (buildings = []) => {
    const BASE = 10;
    const PER_HOUSE = 5;
    let houses = 0;
    if (!Array.isArray(buildings)) return BASE;
    buildings.forEach(b => {
      if (!b) return;
      if (b.type === 'house') {
        const qty = typeof b.level === 'number' ? b.level : (typeof b.count === 'number' ? b.count : 0);
        houses += qty;
      }
    });
    return BASE + houses * PER_HOUSE;
  };

  const pop = population || { current_population: 0, max_population: 0 };
  const computedMax = computeMaxFromBuildings(buildings || []);
  const mergedPopulation = {
    current_population: pop.current_population || 0,
    max_population: (pop.max_population && pop.max_population > 0) ? pop.max_population : computedMax
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col">
      {/* --- Header --- */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{userData.username || 'Jugador'}</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700"
            title="Refrescar (F5)"
          >
            Refrescar
          </button>
          <button
            onClick={onShowMap}
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
          >
            Ver Mapa
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* --- Mensaje de UI --- */}
      {uiMessage?.text && (
        <div
          className={`mb-4 p-2 rounded ${
            uiMessage.type === 'error' ? 'bg-red-700' :
            uiMessage.type === 'success' ? 'bg-green-700' :
            'bg-gray-700'
          }`}
        >
          {uiMessage.text}
        </div>
      )}

      {/* --- Recursos y población --- */}
      <section className="mt-4">
        <h2 className="text-xl font-semibold mb-3">Recursos</h2>
          <div className="bg-gray-800 p-4 rounded">
          <ResourceDisplay
            resources={userData.resources || { wood: userData.wood || 0, stone: userData.stone || 0, food: userData.food || 0 }}
            population={mergedPopulation}
            entityId={userData.entity_id}
          />
        </div>
      </section>

      {/* --- Construcción de edificios por secciones --- */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Construir Edificios</h2>
        {['common', 'processed', 'specialized'].map(cat => {
          const items = Object.entries(BUILDING_DEFINITIONS).filter(([,d]) => (d.category || 'common') === cat);
          if (items.length === 0) return null;
          const title = cat === 'common' ? 'Comunes' : (cat === 'processed' ? 'Procesados' : 'Especializados');
          return (
            <div key={cat} className="mb-6">
              <h3 className="text-lg font-medium mb-2">{title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(([type, def]) => {
                  const server = buildCosts[type];
                  const cost = server?.cost || def.cost;
                  const enough = typeof server?.canBuild === 'boolean' ? server.canBuild : canBuild(cost);
                  return (
                    <Card key={type} title={def.name} description={def.description} icon={def.icon}>
                      <div className="mb-2 text-sm text-gray-300">
                        <strong>Coste:</strong>
                        <span className="ml-2">
                          {cost.wood > 0 && `Madera: ${cost.wood} `}
                          {cost.stone > 0 && `Piedra: ${cost.stone} `}
                          {cost.food > 0 && `Comida: ${cost.food}`}
                        </span>
                      </div>

                      {/* Producción por tick si existe */}
                      {PRODUCTION_RATES[type] && Object.keys(PRODUCTION_RATES[type]).length > 0 && (
                        <div className="mb-2 text-sm text-gray-400">
                          <div><strong>Producción/tick:</strong> <span className="ml-2">{Object.entries(PRODUCTION_RATES[type]).map(([res, val]) => `${val > 0 ? '+' : ''}${val} ${res}`).join(', ')}</span></div>
                          <div className="text-xs text-gray-500 mt-1">(≈ {Object.entries(PRODUCTION_RATES[type]).map(([res, val]) => `${perTickToPerMinute(val)} ${res}/min`).join(', ')})</div>
                          <div className="text-xs text-gray-500">(≈ {Object.entries(PRODUCTION_RATES[type]).map(([res, val]) => `${perTickToPerHour(val)} ${res}/hr`).join(', ')})</div>
                        </div>
                      )}

                      <button
                        onClick={() => onBuild(type)}
                        disabled={!enough}
                        className={`px-3 py-1 rounded ${
                          enough
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-600 cursor-not-allowed'
                        }`}
                      >
                        Construir
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* --- Lista de edificios existentes --- */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Edificios Actuales</h2>
        {(!Array.isArray(buildings) || buildings.length === 0) ? (
          <p>No tienes edificios aún.</p>
        ) : (
          ['common','processed','specialized'].map(cat => {
            const title = cat === 'common' ? 'Comunes' : (cat === 'processed' ? 'Procesados' : 'Especializados');
            const items = buildings.filter(b => (BUILDING_DEFINITIONS[b.type]?.category || 'common') === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-4">
                <h3 className="text-lg font-medium mb-2">{title}</h3>
                <ul className="space-y-1">
                  {items.map((b, idx) => {
                    const def = BUILDING_DEFINITIONS[b.type] || {};
                    const displayName = def.name || b.name || b.type;
                    const meta = b.level ? `Nivel ${b.level}` : (b.count ? `${b.count}` : null);
                    return (
                      <li key={idx} className="bg-gray-800 p-2 rounded flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          {def.icon && <def.icon className="w-5 h-5 text-yellow-400" />}
                          <span>{displayName}</span>
                        </div>
                        {meta && <span className="text-sm text-gray-400">{meta}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
