import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../hooks/useGameData';

export default function CityDetail({ entityId, token, onBack }) {
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCity = async () => {
      if (!entityId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/entities/${entityId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.message || `Error loading entity ${entityId}`);
          setCity(null);
        } else {
          const data = await res.json();
          // our backend returns resources array and population.breakdown
          setCity(data);
        }
      } catch (e) {
        setError(e.message);
        setCity(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCity();
  }, [entityId, token]);

  if (loading) return <div className="p-6 text-white">Cargando detalles...</div>;
  if (error) return (
    <div className="p-6 text-white">
      <div>Error: {error}</div>
      <button onClick={onBack} className="mt-2 px-3 py-1 bg-purple-600 rounded">Volver</button>
    </div>
  );
  if (!city) return null;

  const pop = city.populations || null;
  const current_total = city.current_population ?? (pop ? ((pop.poor?.current_population||0) + (pop.burgess?.current_population||0) + (pop.patrician?.current_population||0)) : 0);
  const max_total = city.max_population ?? (pop ? ((pop.poor?.max_population||0) + (pop.burgess?.max_population||0) + (pop.patrician?.max_population||0)) : 0);

  // Convert resources array to map-like display
  const resources = Array.isArray(city.resources) ? city.resources : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{city.name || city.username || `Entidad ${city.id}`}</h2>
          <button onClick={onBack} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded">Volver</button>
        </div>

        <div className="mb-4">
          <div><strong>Facción:</strong> {city.faction_name || 'N/A'}</div>
          <div className="mt-2"><strong>Población:</strong> {current_total} / {max_total}</div>
          {pop && (
            <div className="mt-2">
              <div className="font-semibold">Detalle por clase:</div>
              <div className="text-sm">Pobres: {pop.poor?.current_population ?? 0} / {pop.poor?.max_population ?? 0}</div>
              <div className="text-sm">Burgueses: {pop.burgess?.current_population ?? 0} / {pop.burgess?.max_population ?? 0}</div>
              <div className="text-sm">Patricios: {pop.patrician?.current_population ?? 0} / {pop.patrician?.max_population ?? 0}</div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Recursos</h3>
          <div className="space-y-2">
            {resources.map(r => (
              <div key={r.name} className="flex justify-between bg-gray-700 p-2 rounded">
                <div className="text-sm text-gray-300">{r.name.charAt(0).toUpperCase()+r.name.slice(1)}</div>
                <div className="text-lg font-bold">{r.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
