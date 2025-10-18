import React from 'react';

export default function CityDetail({ city, onBack }) {
  if (!city) return null;

  // If populations are provided as structured populations object, prefer that
  const pop = city.populations || null;
  const current_total = city.current_population ?? (pop ? ((pop.poor?.current_population||0) + (pop.burgess?.current_population||0) + (pop.patrician?.current_population||0)) : 0);
  const max_total = city.max_population ?? (pop ? ((pop.poor?.max_population||0) + (pop.burgess?.max_population||0) + (pop.patrician?.max_population||0)) : 0);

  const resources = [
    { key: 'wood', label: 'Madera', amount: city.wood ?? 0 },
    { key: 'stone', label: 'Piedra', amount: city.stone ?? 0 },
    { key: 'food', label: 'Comida', amount: city.food ?? 0 },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map(r => (
              <div key={r.key} className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-300">{r.label}</div>
                <div className="text-xl font-bold">{r.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
