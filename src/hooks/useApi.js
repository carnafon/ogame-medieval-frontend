import { useCallback } from 'react';
import { API_BASE_URL } from '../constants/config';

export const useApi = (displayMessage) => {
  const getAuthHeaders = useCallback((token) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), []);

  const fetchUserData = useCallback(async (token) => {
    const res = await fetch(`${API_BASE_URL}/me`, { headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error('Error al cargar /me');
    return res.json();
  }, [getAuthHeaders]);

  const generateResources = useCallback(async (token) => {
    const res = await fetch(`${API_BASE_URL}/generate-resources`, { method: 'POST', headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error('Error en /generate-resources');
    return res.json();
  }, [getAuthHeaders]);

  const build = useCallback(async (token, buildingType, entity) => {
    const res = await fetch(`${API_BASE_URL}/build`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ buildingType, entity })
    });
    if (!res.ok) throw new Error('Error en /build');
    return res.json();
  }, [getAuthHeaders]);

  // Generic helpers
  const get = useCallback(async (path, token) => {
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    const res = await fetch(url, { headers: getAuthHeaders(token) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`GET ${path} failed: ${res.status} ${text}`);
    }
    return res.json();
  }, [getAuthHeaders]);

  const post = useCallback(async (path, body, token) => {
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    const res = await fetch(url, { method: 'POST', headers: getAuthHeaders(token), body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`POST ${path} failed: ${res.status} ${text}`);
    }
    return res.json();
  }, [getAuthHeaders]);

  return { fetchUserData, generateResources, build, get, post };
};
