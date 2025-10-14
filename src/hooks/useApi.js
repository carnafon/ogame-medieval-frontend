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

  return { fetchUserData, generateResources, build };
};
