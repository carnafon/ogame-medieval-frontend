import React, { useState, useEffect } from 'react';
import MapCanvas from './MapCanvas';
import { Loader, Map as MapIcon } from 'lucide-react';

export default function MapPage({ user, setUIMessage, API_BASE_URL, MAP_SIZE, onBack }) {
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState({ players: [], mapSize: MAP_SIZE });
  const userId = user?.id;

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/map`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMapData({
          
          players: data || [],
          mapSize: data.mapSize || MAP_SIZE,
        });
        setUIMessage && setUIMessage('Mapa cargado.', 'success');
        console.log("Pdata:", data);
      })
      .catch((err) => {
        console.error(err);
        setMapData({
          players: [{ id: userId, x: Math.floor(MAP_SIZE/2), y: Math.floor(MAP_SIZE/2) }],
          mapSize: MAP_SIZE,
        });
        setUIMessage && setUIMessage('Error cargando mapa. Se muestran datos simulados.', 'warning');
      })
      .finally(() => setLoading(false));
  }, [user, API_BASE_URL, MAP_SIZE, setUIMessage, userId]);

  return (
    <div className="p-4 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded">
          <MapIcon size={20} /> Volver
        </button>
        <h1 className="text-2xl font-bold text-white">Mapa Interactivo</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin text-cyan-400" size={40} />
        </div>
      ) : (
        <div className="flex justify-center">
          <MapCanvas
            players={mapData.players || []}
            activeId={userId}
            gridSize={mapData.mapSize || MAP_SIZE}
            cellSize={20}
          />
        </div>
      )}
    </div>
  );
}
