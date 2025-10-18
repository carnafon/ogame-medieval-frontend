import React, { useEffect, useState } from 'react';
import { RESOURCE_CATEGORIES, RESOURCE_LABELS } from '../constants/resourceCategories';
import { useApi } from '../hooks/useApi';
import ResourceIcon from './ResourceIcon';

export default function ResourceDisplay(props) {
  const resources = props.resources || {};
  const population = props.population || {};
  const entityId = props.entityId || null;
  const api = useApi();
  const [resourceTypes, setResourceTypes] = useState([]); // array of {id,name}
  const [popBreakdown, setPopBreakdown] = useState(null); // { poor: {...}, burgess: {...}, patrician: {...} }

  useEffect(() => {
    let mounted = true;
    const fetchTypes = async () => {
      try {
        // Use stored auth token if available so deployed APIs that require auth accept the request
        const token = localStorage.getItem('authToken');
        const res = await api.get('/resources/types', token);
        if (!mounted) return;
        if (res && res.resourceTypes) setResourceTypes(res.resourceTypes);
      } catch (err) {
        // ignore: if fetch fails, we'll fallback to showing available keys from props
        console.warn('No se pudieron obtener tipos de recursos:', err.message || err);
      }
    };
    fetchTypes();
    // Fetch population breakdown for entity if available
    const fetchPop = async () => {
      if (!entityId) return;
      try {
        const token = localStorage.getItem('authToken');
        const url = `/population?entityId=${encodeURIComponent(entityId)}`;
        const res = await api.get(url, token);
        if (!mounted) return;
        if (res && res.types) {
          const map = {};
          res.types.forEach(t => { map[t.type] = t; });
          setPopBreakdown(map);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchPop();
    return () => { mounted = false; };
  }, [api, entityId]);

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
          <div key={k} className="text-sm bg-gray-700 px-2 py-1 rounded flex items-center gap-2">
            <ResourceIcon name={k} label={RESOURCE_LABELS[k] || k} />
            {/* hide textual label; show only icon (tooltip has the label) */}
            <span className="ml-1 text-sm font-medium">{v}</span>
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

      {!popBreakdown ? (
        <div className="bg-gray-800 p-3 rounded shadow w-48">
          <div className="font-semibold mb-2">Población</div>
          <div>{population.current_population || 0} / {population.max_population || 0}</div>
        </div>
      ) : (
        <div>
          <div className="font-semibold mb-2">Población</div>
          <div className="flex flex-col md:flex-row gap-3">
          <div className="bg-gray-800 p-3 rounded shadow w-full md:w-40">
            <div className="font-semibold mb-2">Pobres</div>
            <div className="text-sm">Disponible: <span className="font-medium">{popBreakdown.poor?.available_population ?? 0}</span></div>
            <div className="text-sm">Actual: <span className="font-medium">{popBreakdown.poor?.current_population ?? 0}</span></div>
            <div className="text-sm">Máx: <span className="font-medium">{popBreakdown.poor?.max_population ?? 0}</span></div>
          </div>

          <div className="bg-gray-800 p-3 rounded shadow w-full md:w-40">
            <div className="font-semibold mb-2">Burgueses</div>
            <div className="text-sm">Disponible: <span className="font-medium">{popBreakdown.burgess?.available_population ?? 0}</span></div>
            <div className="text-sm">Actual: <span className="font-medium">{popBreakdown.burgess?.current_population ?? 0}</span></div>
            <div className="text-sm">Máx: <span className="font-medium">{popBreakdown.burgess?.max_population ?? 0}</span></div>
          </div>

          <div className="bg-gray-800 p-3 rounded shadow w-full md:w-40">
            <div className="font-semibold mb-2">Patricios</div>
            <div className="text-sm">Disponible: <span className="font-medium">{popBreakdown.patrician?.available_population ?? 0}</span></div>
            <div className="text-sm">Actual: <span className="font-medium">{popBreakdown.patrician?.current_population ?? 0}</span></div>
            <div className="text-sm">Máx: <span className="font-medium">{popBreakdown.patrician?.max_population ?? 0}</span></div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

// fetch resource types on mount
ResourceDisplay.defaultProps = {};

export function ResourceDisplayLoader(props) {
  // wrapper in case some pages don't use useApi; fetch happens in child via hook too
  return <ResourceDisplay {...props} />;
}
