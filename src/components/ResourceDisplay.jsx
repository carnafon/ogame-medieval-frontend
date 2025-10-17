import React, { useEffect, useState } from 'react';
import { RESOURCE_CATEGORIES, RESOURCE_LABELS } from '../constants/resourceCategories';
import { useApi } from '../hooks/useApi';

export default function ResourceDisplay(props) {
  const resources = props.resources || {};
  const population = props.population || {};
  const api = useApi();
  const [resourceTypes, setResourceTypes] = useState([]); // array of {id,name}

  useEffect(() => {
    let mounted = true;
    const fetchTypes = async () => {
      try {
        const res = await api.get('/api/resources/types');
        if (!mounted) return;
        if (res && res.resourceTypes) setResourceTypes(res.resourceTypes);
      } catch (err) {
        // ignore: if fetch fails, we'll fallback to showing available keys from props
        console.warn('No se pudieron obtener tipos de recursos:', err.message || err);
      }
    };
    fetchTypes();
    return () => { mounted = false; };
  }, [api]);

  // Build a grouped structure by category using resourceTypes from backend
  const grouped = {
    common: {},
    processed: {},
    specialized: {},
    strategic: {}
  };

  // If we have resource types from the server, iterate them; otherwise fallback to keys in resources
  const keysToRender = resourceTypes.length > 0 ? resourceTypes.map(rt => rt.name.toLowerCase()) : Object.keys(resources);

  keysToRender.forEach(k => {
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
            <strong className="mr-2">{RESOURCE_LABELS[k] || k}</strong>
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

// fetch resource types on mount
ResourceDisplay.defaultProps = {};

export function ResourceDisplayLoader(props) {
  // wrapper in case some pages don't use useApi; fetch happens in child via hook too
  return <ResourceDisplay {...props} />;
}
