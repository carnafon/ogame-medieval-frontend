import React, { useState, useEffect, useRef } from 'react';
import MapGrid from './MapGrid';
import { Loader, Map as MapIcon } from 'lucide-react';

// MapPage: fetch once on mount and on user click (Refresh). Does not auto-refresh on interval.
export default function MapPage({ user, setUIMessage, API_BASE_URL, MAP_SIZE }) {
  const [mapData, setMapData] = useState({ players: [], mapSize: MAP_SIZE });
  const [loadingMap, setLoadingMap] = useState(false);
  const isFetchingRef = useRef(false);
  const lastControllerRef = useRef(null);

  const userId = user?.id;

  async function fetchMapData() {
    const tokenNow = localStorage.getItem('authToken');
    const userIdNow = user?.id;
    if (!tokenNow || !userIdNow) {
      setMapData({ players: [], mapSize: MAP_SIZE });
      setLoadingMap(false);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingMap(true);

    const controller = new AbortController();
    lastControllerRef.current = controller;
    const TIMEOUT_MS = 8000;
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}/map`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenNow}`
        },
        signal: controller.signal
      });

      console.debug('[MapPage] HTTP', { status: response.status, ok: response.ok });

      if (!response.ok) {
        if (response.status === 404) {
          setUIMessage && setUIMessage({ text: 'Endpoint /map no encontrado. Usando datos simulados.', type: 'warning' });
          throw new Error('404');
        }
        let errorText = '';
        try { errorText = await response.text(); } catch (e) { errorText = e.message; }
        throw new Error(errorText || 'Error al cargar el mapa.');
      }

      let data;
      try { data = await response.json(); } catch (e) {
        let bodyText = '';
        try { bodyText = await response.text(); } catch (ex) { bodyText = ex.message; }
        console.warn('[MapPage] JSON parse error, body:', bodyText);
        throw e;
      }

      console.debug('[MapPage] raw response', data);

      let rawPlayers = [];
      if (Array.isArray(data)) rawPlayers = data;
      else if (data && Array.isArray(data.players)) rawPlayers = data.players;
      else if (data && Array.isArray(data.playersList)) rawPlayers = data.playersList;
      else if (data && Array.isArray(data.map)) rawPlayers = data.map;

      const players = rawPlayers.map(p => {
        if (!p) return null;
        const id = p.id || p.userId || p.username || null;
        const x = typeof p.x === 'number' ? p.x : (typeof p.x_coord === 'number' ? p.x_coord : (p.x_coord ? Number(p.x_coord) : undefined));
        const y = typeof p.y === 'number' ? p.y : (typeof p.y_coord === 'number' ? p.y_coord : (p.y_coord ? Number(p.y_coord) : undefined));
        return { id, x, y };
      }).filter(Boolean);

      console.debug('[MapPage] normalized players', players.length);
      const mapSizeFromServer = data && (data.mapSize || data.size || data.map_size);
      const mapSize = Number.isFinite(mapSizeFromServer) ? mapSizeFromServer : MAP_SIZE;

      setMapData({ players, mapSize });
      setUIMessage && setUIMessage({ text: 'Mapa cargado.', type: 'success' });

    } catch (err) {
      console.warn('[MapPage] fetch error, using fallback:', err && err.message);
      // fallback: simulated players
      setMapData(prev => {
        const currentMapSize = prev.mapSize || MAP_SIZE;
        const sample = [{ id: userId, x: Math.floor(currentMapSize / 2), y: Math.floor(currentMapSize / 2) }];
        sample.push({ id: 'user-1', x: 10, y: 20 }, { id: 'user-2', x: 60, y: 30 });
        return { players: sample, mapSize: currentMapSize };
      });
      setUIMessage && setUIMessage({ text: 'Usando datos simulados (map fetch falló).', type: 'warning' });
    } finally {
      clearTimeout(timeoutId);
      if (lastControllerRef.current === controller) lastControllerRef.current = null;
      isFetchingRef.current = false;
      setLoadingMap(false);
    }
  }

  useEffect(() => {
    // fetch once on mount
    fetchMapData();
    // cleanup abort on unmount
    return () => {
      if (lastControllerRef.current) {
        try { lastControllerRef.current.abort(); } catch (e) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myPlayer = (mapData.players || []).find(p => p.id === userId) || { x: 'N/A', y: 'N/A' };

  return (
    <div className="p-4 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center"><MapIcon className="w-5 h-5 mr-2"/>Mapa Global</h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchMapData} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded">Refrescar</button>
          {loadingMap && <Loader className="w-5 h-5 text-yellow-400 animate-spin" />}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 flex justify-center items-center">
          <div className="relative w-full max-w-xl aspect-square border-4 border-gray-600 rounded-xl overflow-hidden">
            <MapGrid players={mapData.players} activeId={userId} mapSize={mapData.mapSize || MAP_SIZE} bgImage="/spain.jpg" fillCells={true} />
          </div>
        </div>

        <aside className="w-80 bg-gray-700 p-4 rounded-lg shadow-inner">
          <h3 className="text-lg font-semibold text-white mb-3">Información</h3>
          <p className="text-sm text-gray-300 mb-4">Mapa: {mapData.mapSize || MAP_SIZE} x {mapData.mapSize || MAP_SIZE}</p>

          <div className="bg-gray-800 p-3 rounded-lg shadow-md border-l-4 border-green-500 mb-3">
            <p className="font-semibold text-green-400 flex items-center mb-1">Mi Posición</p>
            <p className="text-sm text-gray-200">Coordenadas: <span className="font-bold">({myPlayer.x}, {myPlayer.y})</span></p>
          </div>

          <div className="bg-gray-800 p-3 rounded-lg shadow-md border-l-4 border-blue-500 mb-3">
            <p className="font-semibold text-blue-400 mb-1">Otros Jugadores</p>
            <p className="text-sm text-gray-200">Total Vistos: <span className="font-bold">{Math.max(0, (mapData.players || []).length - 1)}</span></p>
          </div>

          <button onClick={() => {
            const uId = userId || (user && user.id) || 'me';
            const sample = { players: [ { id: uId, x: Math.floor((mapData.mapSize||MAP_SIZE)/2), y: Math.floor((mapData.mapSize||MAP_SIZE)/2) }, { id: 'user-1', x: 10, y: 20 }, { id: 'user-2', x: 60, y: 30 } ], mapSize: mapData.mapSize || MAP_SIZE };
            setMapData(sample);
          }} className="mb-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Simular mapa</button>

          <details className="p-2 bg-gray-800 rounded text-xs text-gray-300">
            <summary className="cursor-pointer text-sm text-gray-200">Depuración - mostrar datos del mapa</summary>
            <div className="mt-2">
              <pre className="whitespace-pre-wrap text-xs max-h-48 overflow-auto">{JSON.stringify({ mapData, userId, tokenPresent: !!localStorage.getItem('authToken'), userSummary: user ? { id: user.id, username: user.username, coords: { x: user.x_coord, y: user.y_coord } } : null }, null, 2)}</pre>
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
