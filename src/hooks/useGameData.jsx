import { useState, useEffect, useCallback } from 'react';

// --- CONSTANTES Y DEFINICIONES ---
// (Exportadas para que el componente GameUI pueda acceder a ellas para renderizar costos)
export const API_BASE_URL = 'https://ogame-medieval-api.onrender.com/api';
export const GENERATION_INTERVAL_MS = 10000; // 10 segundos

export const BUILDING_DEFINITIONS = {
    'house': { 
        name: 'Casa Simple', 
        cost: { wood: 20, stone: 10, food: 5 },
        description: 'Aumenta el límite de población y la moral.' 
    },
    'sawmill': {
        name: 'Aserradero',
        cost: { wood: 50, stone: 30, food: 10 },
        description: 'Produce Madera (+5) y consume Comida cada tick.'
    },
    'quarry': {
        name: 'Cantera',
        cost: { wood: 40, stone: 80, food: 15 },
        description: 'Produce Piedra (+8) y consume Comida cada tick.'
    },
    'farm': {
        name: 'Granja',
        cost: { wood: 40, stone: 10, food: 10 },
        description: 'Produce Comida (+10) cada tick.'
    },
};

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

        return {
            // id/username vienen normalmente en user
            id: baseUser.id || baseUser.user_id || undefined,
            username: baseUser.username || baseUser.name || currentUser.username || '',
            // Recursos a nivel top
            wood: resources.wood || baseUser.wood || 0,
            stone: resources.stone || baseUser.stone || 0,
            food: resources.food || baseUser.food || 0,
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
    // Comprueba si el usuario tiene suficientes recursos
    const canBuild = useCallback((cost) => {
        if (!user) return false;
        // Asegura que los recursos existen y son suficientes
        const wood = user.wood || 0;
        const stone = user.stone || 0;
        const food = user.food || 0;

        return wood >= (cost.wood || 0) && 
               stone >= (cost.stone || 0) && 
               food >= (cost.food || 0);
    }, [user]);

    // Manejador para la construcción
    const handleBuild = useCallback(async (buildingType) => {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
            displayMessage('Debes iniciar sesión para construir.', 'error');
            return;
        }
        
        // Pre-check local resources to avoid unnecessary requests that will 400
        const costDef = BUILDING_DEFINITIONS[buildingType]?.cost;
        if (costDef && !canBuild(costDef)) {
            displayMessage('No tienes recursos suficientes para construir (comprobación local).', 'error');
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
            // Normalizar respuesta de build: suele venir con entity/resources
            if (data.user || data.entity || data.resources) {
                setUser(prev => normalizeUserFromResponse(data, prev || {}));
            }
            saveBuildings(data.buildings || []);
            setPopulation(data.population || data.entity?.population || {});
            displayMessage(data.message || 'Construcción finalizada.', 'success');

        } catch (error) {
            displayMessage(`Error: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, displayMessage, normalizeUserFromResponse, user, saveBuildings, canBuild]);


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
    };
};

export default useGameData;
