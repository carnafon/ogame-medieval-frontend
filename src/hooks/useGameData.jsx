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
        cost: { wood: 40, stone: 10, food: 0 },
        description: 'Produce Comida (+10) cada tick.'
    },
};

// =========================================================================
// CUSTOM HOOK: useGameData (Lógica de la Aplicación)
// =========================================================================

export const useGameData = () => {
    // --- ESTADO DE LA APLICACIÓN ---
    const [user, setUser] = useState(null); 
    const [buildings, setBuildings] = useState([]); 
    const [population, setPopulation] = useState({ current_population: 0, max_population: 0, available_population: 0 });
    
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

    // 1. Cargar datos del usuario
    const fetchUserData = useCallback(async (token) => {
        setIsLoading(true);
        console.log('[useGameData] fetchUserData start, token=', token);
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'GET',
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                const errData = await response.json();
                console.log('[useGameData] fetchUserData response not ok', response.status, errData);
                throw new Error(errData.message || 'Fallo al cargar datos.');
            }
            
            const data = await response.json();
            console.log('[useGameData] fetchUserData success', data);
            
            setUser(data.user);
            setBuildings(data.buildings || []); 
            setPopulation(data.population || { current_population: 0, max_population: 0, available_population: 0 });
            displayMessage(data.message || 'Datos cargados correctamente.', 'success');
            return true;
        } catch (error) {
            console.error("Error al cargar datos:", error);
            localStorage.removeItem('authToken');
            setUser(null);
            displayMessage('Sesión expirada o inválida. Inicia sesión.', 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, displayMessage]);

    // 2. Generar recursos (Game Loop tick)
    const generateResources = useCallback(async (token) => {
        console.log('[useGameData] generateResources start, token=', token);
        try {
            const response = await fetch(`${API_BASE_URL}/generate-resources`, {
                method: 'POST',
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                const errData = await response.json();
                console.log('[useGameData] generateResources response not ok', response.status, errData);
                // Si el error es 401 (no autorizado), forzamos la sesión a expirar.
                if (response.status !== 401) { 
                    displayMessage(errData.message || 'Error en la producción.', 'warning');
                    return false;
                }
                throw new Error(errData.message || 'Token inválido.');
            }
            
            const data = await response.json();
            console.log('[useGameData] generateResources success', data);
            console.log('[useGameData] generateResources: response data fields', Object.keys(data));
            // Algunas respuestas a /generate-resources pueden no incluir `user`.
            // No sobrescribimos `user` con `undefined` — solo actualizamos si viene en la respuesta.
            if (data.user) {
                setUser(data.user);
            } else {
                console.log('[useGameData] generateResources: no user in response, keeping current user');
            }

            if (data.population) {
                setPopulation(data.population);
            }
            return true;

        } catch (error) {
            if (error.message.includes('Token inválido')) {
                localStorage.removeItem('authToken');
                setUser(null);
                displayMessage('Sesión expirada. Inicia sesión de nuevo.', 'error');
            } else {
                console.error("Error al generar recursos:", error);
                displayMessage('Error en la conexión o generación de recursos.', 'error');
            }
            return false;
        }
    }, [getAuthHeaders, displayMessage]);

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
            console.log('[useGameData] handleAuth response', data);

            if (!response.ok) {
                throw new Error(data.message || 'Error desconocido en la autenticación.');
            }
            
            const token = data.token;
            localStorage.setItem('authToken', token); 
            console.log('[useGameData] handleAuth saved token');
            // Si la respuesta ya incluye datos del usuario, actualizamos el estado inmediatamente
            if (data.user) {
                setUser(data.user);
                setBuildings(data.buildings || []);
                setPopulation(data.population || { current_population: 0, max_population: 0, available_population: 0 });
                displayMessage(data.message || 'Autenticación exitosa.', 'success');
                return true;
            }

            // Si la respuesta solo incluyó el token, intentamos cargar los datos mediante /me
            const loaded = await fetchUserData(token);
            console.log('[useGameData] handleAuth fetchUserData loaded=', loaded);
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
    }, [fetchUserData, displayMessage]);

    // Manejador para la construcción
    const handleBuild = useCallback(async (buildingType) => {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
            displayMessage('Debes iniciar sesión para construir.', 'error');
            return;
        }
        
        setIsLoading(true);
        displayMessage('Construyendo...', 'info');

        try {
            const response = await fetch(`${API_BASE_URL}/build`, {
                method: 'POST',
                headers: getAuthHeaders(storedToken),
                body: JSON.stringify({ buildingType })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Fallo al construir.');
            }
            
            const data = await response.json();
            
            setUser(data.user);
            setBuildings(data.buildings); 
            setPopulation(data.population);
            displayMessage(data.message || 'Construcción finalizada.', 'success');

        } catch (error) {
            displayMessage(`Error: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, displayMessage]);


    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        setUser(null);
        setBuildings([]);
        displayMessage('Has cerrado sesión.', 'info');
    }, [displayMessage]);


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

    // Efecto 2: Generación periódica de recursos
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        
        if (user && storedToken) {
            let timer;
            
            const startInterval = () => {
                timer = setInterval(async () => {
                    const success = await generateResources(storedToken);
                    if (!success) {
                        clearInterval(timer); 
                    }
                }, GENERATION_INTERVAL_MS);
            };

            // Ejecutamos la primera generación inmediatamente para actualizar el estado más rápido
            generateResources(storedToken);
            startInterval(); 
            
            return () => clearInterval(timer);
        }
    }, [user, generateResources]); 

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
    };
};

export default useGameData;
