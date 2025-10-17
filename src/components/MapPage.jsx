import React, { useEffect, useState } from "react";
import MapCanvas from "./MapCanvas";
import { API_BASE_URL } from "../hooks/useGameData";
import { ArrowLeft } from "lucide-react";

export default function MapPage({ onBack, token }) {
  const [entities, setEntities] = useState([]);
  const [playerEntity, setPlayerEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 🛰️ Cargar datos del jugador y mapa
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (!token) {
          setErrorMsg('Token no disponible. Inicia sesión para ver el mapa.');
          setEntities([]);
          setPlayerEntity(null);
          return;
        }

        // 1️⃣ Obtener entidad del jugador
        const meRes = await fetch(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meRes.ok) {
          // intentar parsear mensaje de error
          let errData = null;
          try { errData = await meRes.json(); } catch (e) { /* ignore */ }
          setPlayerEntity(null);
          setErrorMsg(errData?.message || 'No se pudo cargar los datos del jugador.');
        } else {
          const meData = await meRes.json();
          // Si la entidad en /me no trae max_population, calcularlo desde buildings
          const entity = meData.entity || null;
          if (entity) {
            const buildings = Array.isArray(entity.buildings) ? entity.buildings : [];
            const BASE = 10;
            const PER_HOUSE = 5;
            let houses = 0;
            buildings.forEach(b => {
              if (!b) return;
              if (b.type === 'house') {
                const qty = typeof b.level === 'number' ? b.level : (typeof b.count === 'number' ? b.count : 0);
                houses += qty;
              }
            });
            const computedMax = BASE + houses * PER_HOUSE;
            entity.max_population = (entity.max_population && entity.max_population > 0) ? entity.max_population : computedMax;
          }
          setPlayerEntity(entity);
        }

        // 2️⃣ Obtener todas las entidades del mapa
        const mapRes = await fetch(`${API_BASE_URL}/map`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mapRes.ok) {
          let errData = null;
          try { errData = await mapRes.json(); } catch (e) { /* ignore */ }
          setEntities([]);
          setErrorMsg(errData?.message || 'No se pudo cargar el mapa.');
        } else {
          const mapData = await mapRes.json();
          // Asegurarse de que mapData sea un array y normalizar los campos usados por MapCanvas
          const rows = Array.isArray(mapData) ? mapData : [];

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

          const normalized = rows.map(r => {
            const buildings = Array.isArray(r.buildings) ? r.buildings : [];
            const maxFromData = Number(r.max_population);
            const computed = computeMaxFromBuildings(buildings);
            return {
              id: r.id,
              username: r.username || r.name || r.user_name || (r.user_id ? String(r.user_id) : String(r.id)),
              name: r.name || r.username || null,
              x_coord: Number(r.x_coord) || 0,
              y_coord: Number(r.y_coord) || 0,
              faction_id: r.faction_id || null,
              faction_name: r.faction_name || '',
              current_population: Number(r.current_population) || 0,
              max_population: (Number.isFinite(maxFromData) && maxFromData > 0) ? maxFromData : computed,
              wood: Number(r.wood) || 0,
              stone: Number(r.stone) || 0,
              food: Number(r.food) || 0,
              buildings: buildings
            };
          });

          setEntities(normalized);
        }
      } catch (err) {
        // Mostrar un mensaje de error visible en la UI (no log en consola por producción)
        setEntities([]);
        setPlayerEntity(null);
        setErrorMsg('Error al cargar mapa. Comprueba tu conexión.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // ⏱️ Opcional: refrescar el mapa cada 10 segundos
    const interval = setInterval(fetchData, 1000000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-300">
        <p className="text-xl mb-4">Cargando mapa...</p>
        <button
          onClick={onBack}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full flex items-center transition-all"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-950 text-white overflow-hidden flex flex-col items-center justify-center">
      {/* 🔙 Botón volver */}
      <button
        onClick={onBack}
        className="absolute top-5 left-5 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full flex items-center font-semibold shadow-lg shadow-purple-500/40 transition-all"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Volver
      </button>

      {/* 🌍 Título */}
      <div className="absolute top-5 right-5 z-50 bg-gray-800/80 text-white py-2 px-5 rounded-xl text-lg font-semibold shadow-lg border border-gray-700">
        Mapa global
      </div>

      {/* 🗺️ Canvas del mapa */}
      <div className="w-full h-full flex items-center justify-center">
        {errorMsg && (
          <div className="absolute top-24 z-40 bg-red-800 text-white px-4 py-2 rounded shadow-md">
            {errorMsg}
          </div>
        )}
        <MapCanvas
          players={entities}
          activeId={playerEntity?.id}
          gridSize={100}
          cellSize={20}
        />
      </div>
    </div>
  );
}
