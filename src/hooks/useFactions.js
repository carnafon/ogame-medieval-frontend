import { useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/config";

export function useFactions() {
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeoutMs = 8000; // 8s timeout for slow/unresponsive APIs
    const to = setTimeout(() => controller.abort(), timeoutMs);

    async function fetchFactions() {
      try {
        const res = await fetch(`${API_BASE_URL}/factions`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) setFactions(data);
      } catch (err) {
        // surface a lightweight error state for the UI
        if (mounted) {
          if (err.name === 'AbortError') {
            setError('timeout');
          } else {
            setError(err.message || 'unknown');
          }
        }
      } finally {
        clearTimeout(to);
        if (mounted) setLoading(false);
      }
    }

    fetchFactions();

    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(to);
    };
  }, []);

  return { factions, loading, error };
}
