import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../hooks/useGameData';
import { RESOURCE_CATEGORIES, RESOURCE_LABELS } from '../constants/resourceCategories';

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

  // Convert resources array to map-like display and group by category
  const resources = Array.isArray(city.resources) ? city.resources : [];
  const grouped = resources.reduce((acc, r) => {
    const key = RESOURCE_CATEGORIES[r.name] || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Order of columns we want to show
  const columnOrder = ['common', 'processed', 'specialized', 'strategic', 'other'];
  const COLUMN_LABELS = {
    common: 'Comunes',
    processed: 'Procesados',
    specialized: 'Especializados',
    strategic: 'Estratégicos',
    other: 'Otros'
  };

  return (
    // full-height container; content area scrolls if too tall
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full bg-gray-800 rounded-lg shadow-lg flex flex-col" style={{ minHeight: '80vh' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{city.name || city.username || `Entidad ${city.id}`}</h2>
          <button onClick={onBack} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded">Volver</button>
        </div>
        <div className="px-6 pb-6 overflow-hidden">
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

          <div className="flex-1 overflow-auto" style={{ maxHeight: '65vh' }}>
            <h3 className="text-lg font-semibold mb-3">Recursos</h3>

            <div className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
                {columnOrder.map(col => (
                  <div key={col} className="bg-gray-700 rounded p-3 w-full">
                    <div className="font-semibold mb-2 text-sm">{COLUMN_LABELS[col] || col}</div>
                    <div className="space-y-2">
                      {(grouped[col] || []).map(r => (
                        <div key={r.name} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                          <div className="text-sm text-gray-300">{RESOURCE_LABELS[r.name] || (r.name.charAt(0).toUpperCase()+r.name.slice(1))}</div>
                          <div className="text-lg font-bold">{r.amount}</div>
                        </div>
                      ))}
                      {(!grouped[col] || grouped[col].length === 0) && (
                        <div className="text-xs text-gray-400 italic">—</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
