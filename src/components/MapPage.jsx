import React, { useState, useEffect, useRef } from 'react';
import MapCanvas from './MapCanvas';
import { Loader, Map as MapIcon } from 'lucide-react';

export default function MapPage({ user, setUIMessage, API_BASE_URL, MAP_SIZE, onBack }) {
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState({ players: [], mapSize: MAP_SIZE });
  const [userId, setUserId] = useState(null);

  // WebSocket para sincronizar mapa
  const wsRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/api/game/map`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMapData(data);
        setUserId(user.id);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setUIMessage('Error al cargar el mapa');
        setLoading(false);
      });
  }, [user, API_BASE_URL, setUIMessage]);

  useEffect(() => {
    if (!user) return;

    wsRef.current = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/api/ws/game`);
    wsRef.current.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'mapUpdate') {
        setMapData((prev) => ({
          ...prev,
          players: update.players,
        }));
      }
    };
    return () => {
      wsRef.current && wsRef.current.close();
    };
  }, [user, API_BASE_URL]);

  return (
    <div className="p-4 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded">
          <MapIcon size={20} /> Volver
        </button>
        <h1 className="text-2xl font-bold">Mapa Interactivo</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin" size={40} />
        </div>
      ) : (
        <div className="flex justify-center">
          <MapCanvas
            players={mapData.players}
            activeId={userId}
            gridSize={mapData.mapSize || MAP_SIZE}
            cellSize={20}
          />
        </div>
      )}
    </div>
  );
}
