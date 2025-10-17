import React from 'react';
import RESOURCE_CATEGORIES from '../constants/resourceCategories';

export default function ResourceDisplay(props) {
  const resources = props.resources || {};
  const population = props.population || {};

  // Build a grouped structure by category
  const grouped = {
    common: {},
    processed: {},
    specialized: {},
    strategic: {}
  };

  // Include known resources and any unknown as 'common'
  Object.keys(resources).forEach(k => {
    const cat = RESOURCE_CATEGORIES[k] || 'common';
    grouped[cat][k] = resources[k] || 0;
  });

  const renderCategory = (label, items) => (
    <div className="bg-gray-800 p-3 rounded shadow w-full md:w-auto">
      <div className="font-semibold mb-2">{label}</div>
      <div className="flex flex-wrap gap-3">
        {Object.keys(items).length === 0 ? <div className="text-sm text-gray-400">—</div> : null}
        {Object.entries(items).map(([k, v]) => (
          <div key={k} className="text-sm bg-gray-700 px-2 py-1 rounded">
            <strong className="mr-2">{k}</strong>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 mb-4 text-white">
      <div className="flex flex-wrap gap-4">
        {renderCategory('Comunes', grouped.common)}
        {renderCategory('Procesados', grouped.processed)}
        {renderCategory('Especializados', grouped.specialized)}
        {renderCategory('Estratégicos', grouped.strategic)}
      </div>

      <div className="bg-gray-800 p-3 rounded shadow w-48">
        <div className="font-semibold mb-2">Población</div>
        <div>{population.current_population || 0} / {population.max_population || 0}</div>
      </div>
    </div>
  );
}
