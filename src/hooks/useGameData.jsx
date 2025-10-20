import { useState, useEffect, useCallback } from 'react';
import { BUILDING_DEFINITIONS } from '../constants/buildings';

// --- CONSTANTES Y DEFINICIONES ---
// (Exportadas para que el componente GameUI pueda acceder a ellas para renderizar costos)
export const API_BASE_URL = 'https://ogame-medieval-api.onrender.com/api';
export const GENERATION_INTERVAL_MS = 10000; // 10 segundos

// Re-export so other modules that import BUILDING_DEFINITIONS from this hook keep working
export { BUILDING_DEFINITIONS };

// =========================================================================
// CUSTOM HOOK: useGameData (Lógica de la Aplicación)
// =========================================================================

export const useGameData = () => {
    // --- ESTADO DE LA APLICACIÓN ---
    const [user, setUser] = useState(null); 
    const [buildings, setBuildings] = useState(() => {
        try {
            const raw = localStorage.getItem('userBuildings');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }); 
    const [population, setPopulation] = useState({ current_population: 0, max_population: 0, available_population: 0 });
    const [buildCosts, setBuildCosts] = useState({}); // { [buildingType]: { cost, resources, canBuild, entityId } }
    const [gameConstants, setGameConstants] = useState(null);
    
    // --- ESTADO DE UI / MENSAJES ---
    const [isLoading, setIsLoading] = useState(true);
    const [uiMessage, setUIMessage] = useState({ text: 'Inicia sesión o regístrate.', type: 'info' });

    // Función para manejar las cabeceras de la API
    const getAuthHeaders = useCallback((token) => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), []);

    const displayMessage = useCallback((text, type = 'info') => {
        setUIMessage({ text, type });
    }, []);

    // --- LÓGICA CORE ---

    // Helper: normalizar respuesta del backend en un objeto `user` usable por la UI
    const normalizeUserFromResponse = useCallback((data, currentUser = {}) => {
        // data puede venir como { user, entity, resources } o { user, resources, buildings }
        const baseUser = data.user || currentUser || {};
        const entity = data.entity || {};
        const resources = data.resources || entity.resources || {};
        // normalize keys to lowercase and ensure numeric values
        const normalizedResources = {};
        Object.keys(resources || {}).forEach(k => {
            const key = k.toLowerCase();
            normalizedResources[key] = typeof resources[k] === 'number' ? resources[k] : Number(resources[k]) || 0;
        });

        return {
            // id/username vienen normalmente en user
            id: baseUser.id || baseUser.user_id || undefined,
            username: baseUser.username || baseUser.name || currentUser.username || '',
            // Recursos a nivel top
            // keep top-level shorthands for legacy UI
            wood: normalizedResources.wood || baseUser.wood || 0,
            stone: normalizedResources.stone || baseUser.stone || 0,
            food: normalizedResources.food || baseUser.food || 0,
            // full resources map
            resources: normalizedResources,
            // Datos de entidad útiles
            entity_id: entity.id || baseUser.entity_id || undefined,
            x_coord: entity.x_coord || baseUser.x_coord || 0,
            y_coord: entity.y_coord || baseUser.y_coord || 0,
            faction_id: entity.faction_id || baseUser.faction_id || null,
            faction_name: entity.faction_name || baseUser.faction_name || '',
            // conservar otros campos originales
            ...baseUser,
        };
    }, []);

    // helper para persistir edificios en localStorage
    const saveBuildings = useCallback((items) => {
        setBuildings(items || []);
        try {
            localStorage.setItem('userBuildings', JSON.stringify(items || []));
        } catch (e) {
            // ignore storage errors
        }
    }, []);

    // 1. Cargar datos del usuario
    const fetchUserData = useCallback(async (token) => {
        setIsLoading(true);
    // debug: fetchUserData start
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'GET',
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                const errData = await response.json();
                // fetchUserData response not ok
                throw new Error(errData.message || 'Fallo al cargar datos.');
            }
            
            const data = await response.json();
            // fetchUserData success
            // Normalizamos user a partir de la respuesta (user + entity + resources)
            setUser(normalizeUserFromResponse(data));
            saveBuildings(data.buildings || []);
            setPopulation(data.population || { current_population: 0, max_population: 0, available_population: 0 });
            displayMessage(data.message || 'Datos cargados correctamente.', 'success');
            return true;
        } catch (error) {
            // Error al cargar datos
            localStorage.removeItem('authToken');
            setUser(null);
            displayMessage('Sesión expirada o inválida. Inicia sesión.', 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, displayMessage, normalizeUserFromResponse, saveBuildings]);

    // Fetch server-calculated build cost for a building type and cache it
    const fetchBuildCost = useCallback(async (buildingType, entityId = null) => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        try {
            const qs = `buildingType=${encodeURIComponent(buildingType)}` + (entityId ? `&entityId=${Number(entityId)}` : '');
            const res = await fetch(`${API_BASE_URL}/build/cost?${qs}`, {
                method: 'GET',
                headers: getAuthHeaders(token)
            });
            if (!res.ok) {
                return null;
            }
            const data = await res.json();
            setBuildCosts(prev => ({ ...prev, [buildingType]: data }));
            return data;
        } catch (e) {
            return null;
        }
    }, [getAuthHeaders]);

    // Fetch global game constants (production rates, processing recipes, categories, building costs)
    useEffect(() => {
        let mounted = true;
        const fetchConstants = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/game/constants`);
                if (!mounted) return;
                if (!res.ok) return;
                const data = await res.json();
                setGameConstants(data);
                // If backend provided buildingCosts, merge into local buildCosts initial cache
                if (data && data.buildingCosts) {
                    setBuildCosts(prev => ({ ...Object.fromEntries(Object.keys(data.buildingCosts).map(k => [k, { cost: data.buildingCosts[k], canBuild: true }])), ...prev }));
                }
            } catch (e) {
                // ignore
            }
        };
        fetchConstants();
        return () => { mounted = false; };
    }, []);

    // --- MANEJADORES DE ACCIONES ---

    // Manejador de Login/Registro
    const handleAuth = useCallback(async (username, password, isRegistering,factionId) => {
        const endpoint = isRegistering ? 'register' : 'login';
        displayMessage('Conectando...', 'info');
        
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password,factionId })
            });

            const data = await response.json();
            // handleAuth response

            if (!response.ok) {
                throw new Error(data.message || 'Error desconocido en la autenticación.');
            }
            
            const token = data.token;
            localStorage.setItem('authToken', token); 
            // token saved
            // Si la respuesta ya incluye datos del usuario, actualizamos el estado inmediatamente
            if (data.user || data.entity || data.resources) {
                setUser(normalizeUserFromResponse(data));
                saveBuildings(data.buildings || []);
                setPopulation(data.population || data.entity?.population || { current_population: 0, max_population: 0, available_population: 0 });
                displayMessage(data.message || 'Autenticación exitosa.', 'success');
                return true;
            }

            // Si la respuesta solo incluyó el token, intentamos cargar los datos mediante /me
            const loaded = await fetchUserData(token);
            // fetchUserData loaded = (omitted)
            if (loaded) {
                displayMessage(data.message || 'Autenticación exitosa.', 'success');
                return true;
            }
            // Si no se pudieron cargar los datos, asegurar limpieza
            localStorage.removeItem('authToken');
            return false;

        } catch (error) {
            const errorMessage = error.message.includes('failed to fetch') 
                ? 'Error de conexión con el servidor.' 
                : error.message;
            displayMessage(`Error: ${errorMessage}`, 'error');
            return false;
        }
    }, [fetchUserData, displayMessage, normalizeUserFromResponse, saveBuildings]);
    // Comprueba si el usuario tiene suficientes recursos y población disponible
    // cost: resource cost object
    // buildingType: optional building type string (used to determine population need)
    const canBuild = useCallback((cost, buildingType = null) => {
        if (!user) return false;

        // If server-provided cost info exists for this building, prefer it
        const server = buildingType ? buildCosts[buildingType] : null;
        if (server && typeof server.canBuild === 'boolean') {
            // Server.canBuild reflects resource availability; still check population using server fields
            const popNeeded = typeof server.popNeeded === 'number' ? server.popNeeded : (buildingType === 'house' ? 0 : 1);
            const popAvailable = Number(server.popAvailable ?? population?.available_population ?? population?.available ?? 0);
            return server.canBuild && popAvailable >= popNeeded;
        }

        // Fallback: local resource check
        const resources = user.resources || {};
        for (const key of Object.keys(cost || {})) {
            const need = Number(cost[key] || 0);
            const have = Number(resources[key] || 0);
            if (have < need) return false;
        }

        // Fallback population rule if server info not available
        const popNeeded = buildingType === 'house' ? 0 : 1;
        const havePop = Number(population?.available_population ?? population?.available ?? 0);
        if (havePop < popNeeded) return false;

        return true;
    }, [user, population, buildCosts]);

    // Helper: build a human-friendly missing resources message
    const buildMissingResourcesMessage = useCallback((cost, buildingType = null) => {
        // Prefer server-side data if available
        const server = buildingType ? buildCosts[buildingType] : null;
        const missing = [];

        if (server && server.cost && server.resources) {
            // Server gives current resources and computed cost — compute diffs
            const scost = server.cost || {};
            const sres = server.resources || {};
            for (const key of Object.keys(scost || {})) {
                const need = Number(scost[key] || 0);
                const have = Number(sres[key] || 0);
                if (have < need) missing.push({ key, need, have });
            }
            const popNeeded = typeof server.popNeeded === 'number' ? server.popNeeded : (buildingType === 'house' ? 0 : 1);
            const popAvailable = Number(server.popAvailable ?? population?.available_population ?? population?.available ?? 0);
            if (popAvailable < popNeeded) missing.push({ key: 'población', need: popNeeded, have: popAvailable });
        } else {
            const resources = user?.resources || {};
            for (const key of Object.keys(cost || {})) {
                const need = Number(cost[key] || 0);
                const have = Number(resources[key] || 0);
                if (have < need) missing.push({ key, need, have });
            }
            // Check population shortfall fallback
            const popNeeded = buildingType === 'house' ? 0 : 1;
            const havePop = Number(population?.available_population ?? population?.available ?? 0);
            if (havePop < popNeeded) missing.push({ key: 'población', need: popNeeded, have: havePop });
        }

        if (missing.length === 0) return null;
        const parts = missing.map(m => `${m.key.charAt(0).toUpperCase() + m.key.slice(1)} (necesitas ${m.need}, tienes ${m.have})`);
        return `Faltan: ${parts.join(', ')}`;
    }, [user, population, buildCosts]);

    // Manejador para la construcción
    const handleBuild = useCallback(async (buildingType) => {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
            displayMessage('Debes iniciar sesión para construir.', 'error');
            return;
        }
        
        // Pre-check local resources to avoid unnecessary requests that will 400
        const costDef = BUILDING_DEFINITIONS[buildingType]?.cost;
        if (costDef && !canBuild(costDef, buildingType)) {
            const msg = buildMissingResourcesMessage(costDef, buildingType) || 'No tienes recursos suficientes para construir (comprobación local).';
            displayMessage(msg, 'error');
            return;
        }

        setIsLoading(true);
        displayMessage('Construyendo...', 'info');

        try {
            // Necesitamos enviar la entidad (id) asociada al usuario para que el backend sepa
            // sobre cuál asentamiento construir. Si no está disponible, mostramos un error local.
            const entityId = user?.entity_id;
            if (!entityId) {
                displayMessage('No se encontró la entidad del usuario. Recarga y vuelve a intentarlo.', 'error');
                setIsLoading(false);
                return;
            }

            // handleBuild: sending build request

            const response = await fetch(`${API_BASE_URL}/build`, {
                method: 'POST',
                headers: getAuthHeaders(storedToken),
                body: JSON.stringify({ buildingType, entity: { id: entityId } })
            });

            if (!response.ok) {
                let errText = `Status ${response.status}`;
                try {
                    const errData = await response.json();
                    // If backend provided structured insufficient-resource info, format it nicely
                    if (errData && errData.code === 'INSUFFICIENT') {
                        const r = errData.resource || 'recursos';
                        const need = errData.need ?? '';
                        const have = errData.have ?? '';
                        errText = `${errData.message || 'Recursos insuficientes'} (${r} necesita ${need}, tienes ${have})`;
                    } else {
                        errText = errData.message || JSON.stringify(errData);
                    }
                    // handleBuild backend error body (omitted)
                } catch (e) {
                    // failed to parse error body
                }
                displayMessage(`Error al construir: ${errText}`, 'error');
                setIsLoading(false);
                return;
            }

                    const data = await response.json();
                    // handleBuild success
                    // En lugar de confiar en respuesta parcial, recargamos el estado completo del usuario
                    // para replicar el comportamiento de F5 y mantener consistencia.
                    await fetchUserData(storedToken);
                    // Asegurar que buildings locales se sincronicen inmediatamente si vienen en la respuesta
                    if (data.buildings) saveBuildings(data.buildings || []);
                    displayMessage(data.message || 'Construcción finalizada.', 'success');

        } catch (error) {
            displayMessage(`Error: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, displayMessage, user, saveBuildings, canBuild, fetchUserData, buildMissingResourcesMessage]);


    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        setUser(null);
        saveBuildings([]);
        displayMessage('Has cerrado sesión.', 'info');
    }, [displayMessage, saveBuildings]);


    // --- EFECTOS (Game Loop y Carga Inicial) ---

    // Efecto 1: Comprobación de sesión al inicio
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const checkSessionAndLoad = async () => {
            if (storedToken) {
                // Pasamos el token directamente para cargar los datos
                await fetchUserData(storedToken);
            } else {
                setIsLoading(false);
            }
        };
        checkSessionAndLoad();
    }, [fetchUserData]); 


    // Exportar el estado y las funciones
    return {
        user,
        buildings,
        population,
        isLoading,
        uiMessage,
        canBuild,
        handleAuth,
        handleBuild,
        handleLogout,
        buildCosts,
        fetchBuildCost,
        // expose server constants for components to prefer (may be null if fetch failed)
        gameConstants,
    };
};

export default useGameData;
