import React, { useEffect, useState } from "react";
import MapCanvas from "./MapCanvas";
import { ArrowLeft } from "lucide-react";

export default function MapPage({ onBack, token }) {
  const [entities, setEntities] = useState([]);
  const [playerEntity, setPlayerEntity] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🛰️ Cargar datos del jugador y mapa
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Obtener entidad del jugador
        const meRes = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        setPlayerEntity(meData.entity);

        // 2️⃣ Obtener todas las entidades del mapa
        const mapRes = await fetch(`${import.meta.env.VITE_API_URL}/map`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mapData = await mapRes.json();

        setEntities(mapData);
      } catch (err) {
        console.error("Error al cargar mapa:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // ⏱️ Opcional: refrescar el mapa cada 10 segundos
    const interval = setInterval(fetchData, 10000);
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
