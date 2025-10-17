import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../constants/config";

export function useFactions() {
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mounted = useRef(true);

  async function fetchFactionsOnce() {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutMs = 8000; // 8s timeout for slow/unresponsive APIs
    const to = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE_URL}/factions`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (mounted.current) setFactions(data);
    } catch (err) {
      if (mounted.current) {
        if (err.name === 'AbortError') setError('timeout');
        else setError(err.message || 'unknown');
      }
    } finally {
      clearTimeout(to);
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    fetchFactionsOnce();
    return () => {
      mounted.current = false;
    };
  }, []);

  return { factions, loading, error, reload: fetchFactionsOnce };
}
