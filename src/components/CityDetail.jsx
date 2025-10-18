import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../hooks/useGameData';
import { RESOURCE_CATEGORIES, RESOURCE_LABELS } from '../constants/resourceCategories';

export default function CityDetail({ entityId, token, onBack }) {
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marketPrices, setMarketPrices] = useState({});

  // fetchCity is a reusable function so we can refresh after trades
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

        // Fetch market prices for resources in this city
        try {
          const resources = Array.isArray(data.resources) ? data.resources : [];
          if (resources.length > 0) {
            const trades = [];
            resources.forEach(r => {
              const amt = Number(r.amount || 0);
              // ask for buy and sell prices using current volume as amount
              trades.push({ type: r.name, amount: amt, action: 'buy' });
              trades.push({ type: r.name, amount: amt, action: 'sell' });
            });

            const mRes = await fetch(`${API_BASE_URL}/resources/market-price`, {
              method: 'POST',
              headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
              body: JSON.stringify({ trades })
            });
            if (mRes.ok) {
              const mData = await mRes.json();
              // mData.results is array in same order as trades
              const priceMap = {};
              (mData.results || []).forEach(r => {
                const key = `${(r.type||'').toLowerCase()}:${(r.action||'').toLowerCase()}`;
                priceMap[key] = r;
              });
              setMarketPrices(priceMap);
            }
          }
        } catch (mpErr) {
          // ignore market price errors for now
          console.warn('Failed to fetch market prices:', mpErr.message || mpErr);
        }
      }
    } catch (e) {
      setError(e.message);
      setCity(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, token]);

  const [tradeInProgress, setTradeInProgress] = useState(false);
  const [quantities, setQuantities] = useState({}); // { resourceName: qty }

  // Helper to obtain current user's entity id via /me
  const getMyEntityId = async () => {
    try {
      const t = token || localStorage.getItem('authToken');
      if (!t) return null;
      const res = await fetch(`${API_BASE_URL}/me`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return null;
      const data = await res.json();
      return data.entity?.id || data.entity_id || null;
    } catch (e) {
      return null;
    }
  };

  const executeTrade = async ({ buyerId, sellerId, resourceName, price, amount = 1 }) => {
    const t = token || localStorage.getItem('authToken');
    if (!t) {
      setError('Necesitas iniciar sesión para comerciar.');
      return false;
    }

    setTradeInProgress(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/resources/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ buyerId, sellerId, resource: resourceName, price, amount })
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError(body.message || `Error ejecutando trade (${resp.status})`);
        return false;
      }
      // success -> refresh city details
      await fetchCity();
      return true;
    } catch (e) {
      setError(e.message || 'Error ejecutando trade');
      return false;
    } finally {
      setTradeInProgress(false);
    }
  };

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
  const columnOrder = ['common', 'processed', 'specialized', 'strategic', 'gold', 'other'];
  const COLUMN_LABELS = {
    common: 'Comunes',
    processed: 'Procesados',
    specialized: 'Especializados',
    strategic: 'Estratégicos',
    gold: 'Oro',
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
                      {(grouped[col] || []).map(r => {
                        const keyBuy = `${(r.name||'').toLowerCase()}:buy`;
                        const keySell = `${(r.name||'').toLowerCase()}:sell`;
                        const buy = marketPrices[keyBuy];
                        const sell = marketPrices[keySell];
                        return (
                        <div key={r.name} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                          <div className="text-sm text-gray-300">{RESOURCE_LABELS[r.name] || (r.name.charAt(0).toUpperCase()+r.name.slice(1))}</div>
                          <div className="text-lg font-bold mx-3">{r.amount}</div>
                          <div className="flex items-center space-x-2 mr-2">
                            <button
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                              onClick={() => {
                                setQuantities(prev => ({ ...prev, [r.name]: Math.max(1, (prev[r.name] || 1) - 1) }));
                              }}
                              disabled={tradeInProgress}
                            >-</button>
                            <input
                              type="number"
                              min={1}
                              value={quantities[r.name] || 1}
                              onChange={(e) => {
                                const v = parseInt(e.target.value || '1', 10) || 1;
                                setQuantities(prev => ({ ...prev, [r.name]: Math.max(1, v) }));
                              }}
                              className="w-12 text-center rounded bg-gray-800 text-white border border-gray-600"
                            />
                            <button
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                              onClick={() => {
                                setQuantities(prev => ({ ...prev, [r.name]: (prev[r.name] || 1) + 1 }));
                              }}
                              disabled={tradeInProgress}
                            >+</button>
                          </div>
                          <div className="text-right text-xs text-gray-200 space-y-1">
                            <div className="text-green-300">
                              <button
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                disabled={tradeInProgress}
                                onClick={async () => {
                                    // User sells to the city: buyer is city, seller is current user
                                    const myEntity = await getMyEntityId();
                                    if (!myEntity) { setError('Necesitas iniciar sesión para vender.'); return; }
                                    const qty = quantities[r.name] || 1;
                                    const success = await executeTrade({ buyerId: entityId, sellerId: myEntity, resourceName: r.name, price: sell?.price ?? 0, amount: qty });
                                    if (success) {
                                      // refresh handled by executeTrade
                                    }
                                  }}
                              >Vender: {sell?.price ?? '—'}</button>
                            </div>
                            <div className="text-yellow-300">
                              <button
                                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
                                disabled={tradeInProgress}
                                onClick={async () => {
                                    // User buys from the city: buyer is current user, seller is city
                                    const myEntity = await getMyEntityId();
                                    if (!myEntity) { setError('Necesitas iniciar sesión para comprar.'); return; }
                                    const qty = quantities[r.name] || 1;
                                    const success = await executeTrade({ buyerId: myEntity, sellerId: entityId, resourceName: r.name, price: buy?.price ?? 0, amount: qty });
                                    if (success) {
                                      // refresh handled by executeTrade
                                    }
                                  }}
                              >Comprar: {buy?.price ?? '—'}</button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
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
