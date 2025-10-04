import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapGrid from './components/MapGrid';
import { 
    Home, Factory, Users, Soup, Mountain, Axe, Loader, LogIn, UserPlus, Map, ChevronLeft
} from 'lucide-react';

// --- CONFIGURACIÓN FRONTAL ---

// URL base de tu backend desplegado en Render (Actualizada)
const API_BASE_URL = 'https://ogame-medieval-api.onrender.com/api';

// Intervalo de tiempo para la generación de recursos (en milisegundos)
// 10000 ms = 10 segundos
const GENERATION_INTERVAL_MS = 10000; 
const MAP_REFRESH_INTERVAL = 10000; // 10 segundos para actualizar el mapa

// Si los players vienen con lat/lon, mapearlos a la imagen de España.
// Caja geográfica aproximada para la península ibérica (mainland Spain)
const MAP_GEO_BBOX = {
    minLat: 36.0, // sur
    maxLat: 44.5, // norte
    minLon: -9.5, // oeste
    maxLon: 3.5    // este
};

const MAP_SIZE = 100; // Tamaño del mapa 100x100




// Definiciones de Edificios (adaptadas del código que proporcionaste)
const BUILDING_DEFINITIONS = {
    'house': { 
        name: 'Casa Simple', 
        icon: Home,
        cost: { wood: 20, stone: 10, food: 5 },
        description: 'Aumenta el límite de población y la moral.' 
    },
    'sawmill': {
        name: 'Aserradero',
        icon: Factory,
        cost: { wood: 50, stone: 30, food: 10 },
        description: 'Produce Madera (+5) y consume Comida cada tick.'
    },
    'quarry': {
        name: 'Cantera',
        icon: Mountain,
        cost: { wood: 40, stone: 80, food: 15 },
        description: 'Produce Piedra (+8) y consume Comida cada tick.'
    },
    'farm': {
        name: 'Granja',
        icon: Soup,
        cost: { wood: 40, stone: 10, food: 0 },
        description: 'Produce Comida (+10) cada tick.'
    },
};

function App() {
    // Estado de la Aplicación
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // 'user' almacena todos los recursos y datos del usuario (wood, stone, etc.)
    const [user, setUser] = useState(null); 
    const [buildings, setBuildings] = useState([]); 
    const [population, setPopulation] = useState({ current_population: 0, max_population: 0, available_population: 0 });
    
    // Estado de UI
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [uiMessage, setUIMessage] = useState({ text: 'Inicia sesión o regístrate.', type: 'info' });

    // Estado de Navegación: 'home' o 'map'
    const [currentView, setCurrentView] = useState('home'); 

    // --- Funciones de Utilidad ---

    const displayMessage = useCallback((text, type = 'info') => {
        setUIMessage({ text, type });
        // Opcional: limpiar el mensaje después de un tiempo
        // setTimeout(() => setUIMessage({ text: '', type: 'info' }), 5000);
    }, []);
    
    // Función para manejar las cabeceras de la API
    const getAuthHeaders = useCallback((token) => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), []);

    // --- LÓGICA DE SESIÓN (ESTABLE CON useCallback) ---

    // 1. Cargar datos del usuario
    const fetchUserData = useCallback(async (token) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'GET',
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                // Si la respuesta no es OK (ej. 401), se lanza un error
                const errData = await response.json();
                throw new Error(errData.message || 'Fallo al cargar datos.');
            }
            
            const data = await response.json();
            
            // Actualiza estados con los datos del usuario
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

    // Efecto 1: Comprobación de sesión al inicio
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const checkSessionAndLoad = async () => {
            if (storedToken) {
                await fetchUserData(storedToken);
            } else {
                setIsLoading(false);
            }
        };
        checkSessionAndLoad();
    }, [fetchUserData]); 

    // --- LÓGICA DE GENERACIÓN DE RECURSOS (Game Loop) ---
    
    // Función para generar recursos (usada por el intervalo) - ENVUELTA EN useCallback
    const generateResources = useCallback(async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/generate-resources`, {
                method: 'POST',
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                const errData = await response.json();
                // Si el backend devuelve un error (ej: falta de comida), mostrarlo, pero no desloguear
                if (response.status !== 401) { 
                    displayMessage(errData.message || 'Error en la producción.', 'warning');
                    return false;
                }
                throw new Error(errData.message || 'Token inválido.');
            }
            
            const data = await response.json();
            setUser(data.user);
            setPopulation(data.population);
            // displayMessage(data.message || 'Recursos actualizados.', 'success'); 
            return true;

        } catch (error) {
            // Manejar error 401: Sesión expirada
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
    }, [getAuthHeaders, displayMessage]); // Dependencia de getAuthHeaders y displayMessage

    
    // Efecto 2: Generación periódica de recursos
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        
        // Solo inicia el intervalo si hay un token
        if (user && storedToken) {
            let timer;
            
            const startInterval = () => {
                timer = setInterval(async () => {
                    const success = await generateResources(storedToken);
                    if (!success) {
                        // Si el error fue un 401, generateResources ya limpió el token. 
                        // Detener el intervalo.
                        clearInterval(timer); 
                    }
                }, GENERATION_INTERVAL_MS);
            };

            startInterval(); // Llama inmediatamente al inicio si estás logueado
            
            // Función de limpieza
            return () => clearInterval(timer);
        }
    // El intervalo se reinicia si 'user' cambia o 'generateResources' cambia (aunque es estable por useCallback)
    }, [user, generateResources]); 

    // --- MANEJADORES DE ACCIONES ---

    // Manejador de Login/Registro
    const handleAuth = async (e) => {
        e.preventDefault();
        const endpoint = isRegistering ? 'register' : 'login';
        displayMessage('Conectando...', 'info');
        
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error desconocido en la autenticación.');
            }
            
            const token = data.token;
            localStorage.setItem('authToken', token); 
            
            // Limpiar formulario
            setUsername('');
            setPassword('');
            
            // Tras el login/registro, cargamos los datos
            await fetchUserData(token); 
            displayMessage(data.message || 'Autenticación exitosa.', 'success');

        } catch (error) {
            const errorMessage = error.message.includes('failed to fetch') 
                ? 'Error de conexión con el servidor.' 
                : error.message;
            displayMessage(`Error: ${errorMessage}`, 'error');
        }
    };

    // Manejador para la construcción
    const handleBuild = async (buildingType) => {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
            displayMessage('Debes iniciar sesión para construir.', 'error');
            return;
        }
        // Antes de construir, solicitar generación de recursos para aplicar producción pasiva pendiente
        try {
            await generateResources(storedToken);
        } catch (err) {
            // Si falla la actualización de recursos, mostrar aviso pero continuar para que el backend valide de todas formas
            console.warn('No se pudo refrescar recursos antes de construir:', err && err.message);
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
                 const errData = await response.json().catch(() => ({}));
                 // Mostrar en consola el cuerpo de error para depuración
                 console.error('Build failed response', { status: response.status, body: errData, buildingType });
                 const serverMessage = errData && errData.message ? errData.message : 'Fallo al construir.';
                 displayMessage(`Error: ${serverMessage}`, 'error');
                 throw new Error(serverMessage);
            }
            
            const data = await response.json();
            
            // Actualizar estados
            setUser(data.user);
            setBuildings(data.buildings); 
            setPopulation(data.population);
            displayMessage(data.message || 'Construcción finalizada.', 'success');

        } catch (error) {
            displayMessage(`Error: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setBuildings([]);
        setIsRegistering(false); 
        displayMessage('Has cerrado sesión.', 'info');
    };

    // Comprueba si el usuario tiene suficientes recursos
    const canBuild = (cost) => {
        if (!user) return false;
        return user.wood >= cost.wood && 
               user.stone >= cost.stone && 
               user.food >= cost.food;
    };


    if (isLoading && !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <Loader className="w-8 h-8 mr-2 animate-spin text-cyan-400" />
                Cargando sesión...
            </div>
        );
    }

    // --- Componentes de UI ---

    const ResourceDisplay = ({ icon: Icon, value, label, color }) => (
        <div className="flex flex-col items-center p-3 bg-gray-700/50 rounded-lg shadow-inner w-full sm:w-1/4">
            <Icon className={`w-6 h-6 ${color}`} />
            <div className="text-xl font-bold mt-1 text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
        </div>
    );
    
    const Card = ({ title, children, icon: Icon }) => (
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-cyan-500/30">
            <h2 className="text-2xl font-extrabold text-cyan-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
                {Icon && <Icon className="w-6 h-6 mr-2" />}
                {title}
            </h2>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );

   // --- COMPONENTE MAPA (MapContent) ---

    const MapContent = () => {
        const [mapData, setMapData] = useState({ players: [] });
        const [loadingMap, setLoadingMap] = useState(true);
        const token = localStorage.getItem('authToken');
        // Función para simular/llamar a la API /map
        const isFetchingRef = useRef(false);
        const lastControllerRef = useRef(null);

        const fetchMapData = useCallback(async () => {
            if (!token || !userId) {
                // No hay token o usuario: limpiar datos y salir
                setMapData({ players: [] });
                setLoadingMap(false);
                return;
            }

            // Evitar fetch concurrente
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;
            setLoadingMap(true);

            const controller = new AbortController();
            lastControllerRef.current = controller;
            const TIMEOUT_MS = 8000; // 8s timeout para evitar bloqueos
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            try {
                const response = await fetch(`${API_BASE_URL}/map`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    signal: controller.signal
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        // Endpoint no implementado: avisar y usar fallback
                        setUIMessage({ text: 'Endpoint /map no encontrado en el servidor. Usando datos simulados.', type: 'warning' });
                        throw new Error('404');
                    }
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Error al cargar el mapa.');
                }

                const data = await response.json();
                // Aceptar varias formas posibles de respuesta:
                // - array directo -> [{id,x,y}, ...]
                // - { players: [...] }
                // - { playersList: [...] }
                // - { map: [...] }
                let players = [];
                if (Array.isArray(data)) {
                    players = data;
                } else if (data && Array.isArray(data.players)) {
                    players = data.players;
                } else if (data && Array.isArray(data.playersList)) {
                    players = data.playersList;
                } else if (data && Array.isArray(data.map)) {
                    players = data.map;
                }

                if (!players || !Array.isArray(players)) {
                    console.warn('Respuesta /map inesperada, usando fallback. Respuesta completa:', data);
                    throw new Error('Formato de mapa inválido');
                }

                setMapData({ players });
                setUIMessage({ text: 'Mapa actualizado.', type: 'info' });
                // MapGrid se encargará de renderizar cuando mapData cambie

            } catch (error) {
                // Timeout o cualquier error: registrar y generar fallback inmediato
                console.warn('Error fetching map data, using fallback simulation:', error && error.message);

                const numOtherPlayers = 3;
                setMapData(prev => {
                    const prevPlayers = Array.isArray(prev.players) ? prev.players : [];
                    const simulatedPlayers = prevPlayers.filter(p => p.id === userId);

                    if (simulatedPlayers.length === 0) {
                        simulatedPlayers.push({
                            id: userId,
                            x: Math.floor(Math.random() * MAP_SIZE),
                            y: Math.floor(Math.random() * MAP_SIZE)
                        });
                    } else {
                        simulatedPlayers[0].x = Math.max(0, Math.min(MAP_SIZE - 1, simulatedPlayers[0].x + Math.floor(Math.random() * 3) - 1));
                        simulatedPlayers[0].y = Math.max(0, Math.min(MAP_SIZE - 1, simulatedPlayers[0].y + Math.floor(Math.random() * 3) - 1));
                    }

                    for (let i = 0; i < numOtherPlayers; i++) {
                        const id = `user-${i + 1}`;
                        let existingPlayer = prevPlayers.find(p => p.id === id);
                        if (!existingPlayer) {
                            existingPlayer = { id, x: Math.floor(Math.random() * MAP_SIZE), y: Math.floor(Math.random() * MAP_SIZE) };
                        } else {
                            existingPlayer.x = Math.max(0, Math.min(MAP_SIZE - 1, existingPlayer.x + Math.floor(Math.random() * 3) - 1));
                            existingPlayer.y = Math.max(0, Math.min(MAP_SIZE - 1, existingPlayer.y + Math.floor(Math.random() * 3) - 1));
                        }
                        simulatedPlayers.push(existingPlayer);
                    }

                    return { players: simulatedPlayers };
                });

            } finally {
                clearTimeout(timeoutId);
                // limpiar controller referencia si coincide
                if (lastControllerRef.current === controller) lastControllerRef.current = null;
                isFetchingRef.current = false;
                setLoadingMap(false);
            }
    }, [token, userId]);


        // Efecto para el bucle de actualización del mapa
        useEffect(() => {
            fetchMapData(); // Cargar inmediatamente

            const timer = setInterval(fetchMapData, MAP_REFRESH_INTERVAL);
            return () => clearInterval(timer);
        }, [fetchMapData]);

        // Efecto para redibujar el canvas cuando cambian los datos o el tamaño de la ventana
        useEffect(() => {
            // Redibujar cuando cambian los datos del mapa
            const players = Array.isArray(mapData.players) ? mapData.players : [];
            // MapGrid se encarga del renderizado cuando cambia mapData
            if (players.length > 0) {
                // nothing here; MapGrid will render the new players
            }
            // Manejar resize (no necesita re-dibujar manualmente; MapGrid responde a tamaño)
            const handleResize = () => { /* noop, MapGrid handles its own resize */ };
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, [mapData, userId]); 

    const myPlayer = mapData.players.find(p => p.id === userId) || {x: 'N/A', y: 'N/A'};


        return (
            <div className="p-4 bg-gray-900 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <button 
                        onClick={() => setCurrentView('home')}
                        className="flex items-center text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" /> Volver a la Ciudad
                    </button>
                    <button  
                        onClick={handleLogout}  
                        className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-full transition-colors" 
                        disabled={isLoading} 
                    > 
                        Cerrar Sesión 
                    </button> 
                </div>

                <Card title={`Mapa Global (Territorio ${MAP_SIZE}x${MAP_SIZE})`} icon={Map}>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Contenedor del Mapa */}
                        <div className="md:w-3/4 flex justify-center items-center">
                            <div className="relative w-full max-w-xl aspect-square border-4 border-gray-600 rounded-xl overflow-hidden">
                                <MapGrid players={mapData.players} activeId={userId} mapSize={MAP_SIZE} bgImage="/spain.jpg" />
                            </div>
                        </div>

                        {/* Leyenda y Coordenadas */}
                        <div className="md:w-1/4 bg-gray-700 p-4 rounded-lg shadow-inner">
                            <h3 className="text-xl font-semibold text-white mb-3">Información</h3>
                            
                            <p className="text-sm text-gray-300 mb-4">
                                Posición de los jugadores en el territorio.
                                <br/>El mapa se actualiza cada ${MAP_REFRESH_INTERVAL / 1000}$ segundos.
                            </p>
                            
                            <div className="space-y-3">
                                {/* Mi Posición */}
                                <div className="bg-gray-800 p-3 rounded-lg shadow-md border-l-4 border-green-500">
                                    <p className="font-semibold text-green-400 flex items-center mb-1">
                                        <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div> Mi Posición
                                    </p>
                                    <p className="text-sm text-gray-200">
                                        Coordenadas: <span className="font-bold">({myPlayer.x}, {myPlayer.y})</span>
                                    </p>
                                </div>
                                {/* Otros Jugadores */}
                                <div className="bg-gray-800 p-3 rounded-lg shadow-md border-l-4 border-blue-500">
                                    <p className="font-semibold text-blue-400 flex items-center mb-1">
                                        <div className="w-3 h-3 rounded-full mr-2 bg-blue-500"></div> Otros Jugadores
                                    </p>
                                    <p className="text-sm text-gray-200">
                                        Total Vistos: <span className="font-bold">{mapData.players.length - 1}</span>
                                    </p>
                                </div>
                                
                                {loadingMap && (
                                    <p className="text-center text-yellow-500 mt-4 flex items-center justify-center">
                                        <Loader className="w-4 h-4 mr-2 animate-spin" /> 
                                        Cargando datos...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    // --- RENDERIZADO PRINCIPAL --- 
    
    // Contenido del Dashboard principal (Home View)
    const HomeContent = () => (
        <div className="max-w-6xl mx-auto"> 
            <div className="flex justify-end mb-4">
                <button  
                    onClick={() => setCurrentView('map')}  
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center shadow-lg shadow-purple-500/50 mr-4" 
                    disabled={isLoading} 
                > 
                    <Map className="w-5 h-5 mr-2" /> Ver Mapa Global 
                </button> 
                <button  
                    onClick={handleLogout}  
                    className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-full transition-colors" 
                    disabled={isLoading} 
                > 
                    Cerrar Sesión 
                </button> 
            </div>
            
            <div className="mb-8 pt-4"> 
                {/* Display de Recursos y Población */} 
                <section className="flex flex-wrap justify-center gap-4"> 
                    <ResourceDisplay icon={Axe} value={user.wood} label="Madera" color="text-amber-500" /> 
                    <ResourceDisplay icon={Mountain} value={user.stone} label="Piedra" color="text-gray-400" /> 
                    <ResourceDisplay icon={Soup} value={user.food} label="Comida" color="text-green-500" /> 
                    <ResourceDisplay  
                        icon={Users}  
                        value={`${population.current_population}/${population.max_population}`}  
                        label="Población Usada/Max"  
                        color="text-blue-400"  
                    /> 
                </section> 
            </div> 

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8"> 
                {/* Panel de Edificios Construidos */} 
                <Card title="Edificios Actuales" icon={Home}> 
                    {buildings.length === 0 ? ( 
                        <p className="text-gray-400">Aún no tienes edificios. ¡Construye uno!</p> 
                    ) : ( 
                        <ul className="list-none space-y-2"> 
                            {buildings.map((b) => { 
                                const def = BUILDING_DEFINITIONS[b.type]; 
                                return ( 
                                    <li key={b.type} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between shadow-md"> 
                                        <div className="flex items-center space-x-3"> 
                                            {def && <def.icon className="w-5 h-5 text-yellow-400" />} 
                                            <span className="font-medium text-white">{def ? def.name : b.type}</span> 
                                        </div> 
                                        <span className="text-lg font-bold text-cyan-300">Nivel {b.count}</span> 
                                    </li> 
                                ); 
                            })} 
                        </ul> 
                    )} 
                </Card> 

                {/* SECCIÓN DE CONSTRUCCIÓN */} 
                <Card title="Opciones de Construcción" icon={Factory}> 
                    {Object.entries(BUILDING_DEFINITIONS).map(([type, details]) => { 
                        const count = buildings.find(b => b.type === type)?.count || 0; 
                        return ( 
                        <div key={type} className="border border-gray-700 bg-gray-700/50 rounded-xl p-4 shadow-lg"> 
                            <h4 className="text-xl font-bold text-yellow-300 mb-2">{details.name} (Nivel {count + 1})</h4> 
                            <p className="text-sm text-gray-400 mb-3">{details.description}</p> 
                            
                            <p className="font-semibold text-gray-300 text-sm"> 
                                Costo:  
                                {details.cost.wood > 0 && ` | Madera: ${details.cost.wood}`} 
                                {details.cost.stone > 0 && ` | Piedra: ${details.cost.stone}`} 
                                {details.cost.food > 0 && ` | Comida: ${details.cost.food}`} 
                            </p> 

                            <button  
                                onClick={() => handleBuild(type)}  
                                disabled={!canBuild(details.cost) || isLoading} 
                                className={`mt-3 w-full py-2 font-bold rounded-lg transition-all ${ 
                                    canBuild(details.cost) && !isLoading  
                                        ? 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-500/30 text-white'  
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                }`} 
                            > 
                                {isLoading ? 'Cargando...' : `Construir 1 ${details.name}`} 
                            </button> 
                            {!canBuild(details.cost) && <p className="text-xs text-center text-red-400 mt-2">Recursos insuficientes.</p>} 
                        </div> 
                        )})} 
                </Card> 
            </main> 
        </div> 
    );
    
    return ( 
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8"> 
            <style>{` 
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap'); 
                body { font-family: 'Inter', sans-serif; } 
            `}</style> 
            
            <header className="text-center mb-8"> 
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"> 
                    Juego de Comercio Medieval 
                </h1> 
                {user && <p className="text-lg text-gray-400 mt-2">Bienvenido, **{user.username}**</p>} 
                <div className="h-6"> 
                    {uiMessage.text && ( 
                        <div className={`mt-2 p-2 rounded-lg font-semibold inline-block ${ 
                            uiMessage.type === 'error' ? 'bg-red-600' :  
                            uiMessage.type === 'warning' ? 'bg-yellow-600' :  
                            'bg-green-600' 
                        }`}> 
                            {uiMessage.text} 
                        </div> 
                    )} 
                </div> 
            </header> 

            {user ? ( 
                // Estado de USUARIO LOGUEADO - Renderizado condicional por vista
                <>
                    {currentView === 'home' && <HomeContent />}
                    {currentView === 'map' && <MapContent />}
                </>
            ) : ( 
                // Estado de NO LOGUEADO: Formulario de Autenticación 
                <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl"> 
                    <div className="flex justify-between mb-6"> 
                        <button  
                            onClick={() => setIsRegistering(false)}  
                            className={`flex-1 py-3 font-bold rounded-t-lg transition-colors ${ 
                                !isRegistering ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400' 
                            }`} 
                        > 
                            <LogIn className="w-5 h-5 inline mr-2" /> Iniciar Sesión 
                        </button> 
                        <button  
                            onClick={() => setIsRegistering(true)}  
                            className={`flex-1 py-3 font-bold rounded-t-lg transition-colors ${ 
                                isRegistering ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-400' 
                            }`} 
                        > 
                            <UserPlus className="w-5 h-5 inline mr-2" /> Registrarse 
                        </button> 
                    </div> 
                    
                    <form onSubmit={handleAuth} className="space-y-4"> 
                        <input 
                            type="text" 
                            placeholder="Usuario" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500" 
                        /> 
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500" 
                        /> 
                        <button  
                            type="submit"  
                            disabled={isLoading} 
                            className={`w-full py-3 font-bold rounded-lg transition-all ${ 
                                isLoading ? 'bg-gray-500' : 'bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-500/30' 
                            } text-white`} 
                        > 
                            {isLoading ? <Loader className="w-5 h-5 inline animate-spin" /> : (isRegistering ? 'Crear Cuenta' : 'Acceder')} 
                        </button> 
                    </form> 
                </div> 
            )} 

            <footer className="text-center mt-12 text-gray-500 text-sm"> 
                <p>Juego de Comercio Medieval desarrollado con React y Tailwind CSS.</p> 
            </footer> 
        </div> 
    ); 
} 

export default App;
