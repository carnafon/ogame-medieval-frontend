import React from 'react';
import ResourceDisplay from './ResourceDisplay';
import Card from './Card';
import { BUILDING_DEFINITIONS } from '../hooks/useGameData';

export default function HomeView({
  userData,
  buildings,
  population,
  canBuild,
  onBuild,
  onShowMap,
  onLogout,
  uiMessage,
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col">
      {/* --- Header --- */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{userData.username || 'Jugador'}</h1>
        <div className="flex items-center space-x-4">
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
      <ResourceDisplay
        resources={{
          wood: userData.wood || 0,
          stone: userData.stone || 0,
          food: userData.food || 0,
        }}
        population={population}
      />

      {/* --- Construcción de edificios --- */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Construir Edificios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(BUILDING_DEFINITIONS).map(([type, def]) => (
            <Card key={type} title={def.name} description={def.description}>
              <div className="mb-2">
                <strong>Coste:</strong> 
                <span> Madera: {def.cost.wood}, Piedra: {def.cost.stone}, Comida: {def.cost.food}</span>
              </div>
              <button
                onClick={() => onBuild(type)}
                disabled={!canBuild(def.cost)}
                className={`px-3 py-1 rounded ${
                  canBuild(def.cost)
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Construir
              </button>
            </Card>
          ))}
        </div>
      </section>

      {/* --- Lista de edificios existentes --- */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Edificios Actuales</h2>
        {buildings.length === 0 ? (
          <p>No tienes edificios aún.</p>
        ) : (
          <ul className="space-y-1">
            {buildings.map((b, idx) => (
              <li key={idx} className="bg-gray-800 p-2 rounded">
                {b.name || b.type}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
