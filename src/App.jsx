import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Zap, Home, Axe, Mountain, Utensils, Users } from 'lucide-react';

// URL base de tu backend (Asegúrate de cambiar esto si es necesario)
const API_BASE_URL = 'http://localhost:3000/api'; 
const GENERATION_INTERVAL_MS = 10000; // 10 segundos

// Definiciones de Edificios y Costes (Alineados con gameRoutes.js)
const BUILDING_COSTS = {
    'house': { wood: 20, stone: 10, food: 5 },
    'sawmill': { wood: 50, stone: 30, food: 10 },
    'quarry': { wood: 40, stone: 80, food: 15 },
    'farm': { wood: 40, stone: 10, food: 10 }
};

// Definiciones de Producción (Alineados con gameUtils.js)
const PRODUCTION_RATES = {
    'house': { wood: 0, stone: 0, food: 0 }, 
    'sawmill': { wood: 5, stone: 0, food: -1 },
    'quarry':{stone:8, wood:0, food:-2}, 
    'farm': { food: 10, wood: -1, stone: 0 } 
};

// Función de utilidad simple para formatear números con signo
const formatProduction = (value) => {
    return value > 0 ? `+${value}` : `${value}`;
};

// Componente para la barra de estado de Recursos
const ResourceBar = ({ user, population }) => {
    if (!user) return null;

    const resources = [
        { name: 'Madera', value: user.wood, icon: Axe, color: 'bg-green-600' },
        { name: 'Piedra', value: user.stone, icon: Mountain, color: 'bg-gray-600' },
        { name: 'Comida', value: user.food, icon: Utensils, color: 'bg-yellow-600' },
    ];

    return (
        <div className="flex flex-wrap justify-between p-4 bg-gray-800 text-white rounded-xl shadow-lg mb-6">
            <div className="flex items-center space-x-2 text-xl font-bold bg-indigo-700 p-2 rounded-full px-4 min-w-[180px] mb-2 md:mb-0">
                <Users className="w-6 h-6" />
                <span>Población: {user.current_population} / {population.max_population}</span>
            </div>
            {resources.map((res) => (
                <div key={res.name} className={`flex items-center space-x-1 ${res.color} p-2 rounded-lg font-semibold text-lg min-w-[140px] mb-2 md:mb-0`}>
                    <res.icon className="w-5 h-5" />
                    <span>{res.name}: {res.value}</span>
                </div>
            ))}
        </div>
    );
};

// Componente para la lista de Edificios y su Producción
const ProductionDetails = ({ buildings }) => {
    const list = useMemo(() => {
        const buildingDetails = buildings.reduce((acc, b) => {
            acc[b.type] = b.count;
            return acc;
        }, {});

        // Mapear los tipos de edificio para mostrar
        return Object.keys(BUILDING_COSTS).map(type => {
            const count = buildingDetails[type] || 0;
            const rates = PRODUCTION_RATES[type];
            return {
                type,
                name: type.charAt(0).toUpperCase() + type.slice(1), // Capitalizar
                count,
                rates,
            };
        }).filter(b => b.count > 0);
    }, [buildings]);

    if (list.length === 0) {
        return <p className="text-center text-gray-500">Aún no tienes edificios. ¡Construye uno!</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {list.map(b => (
                <div key={b.type} className="bg-gray-700 p-4 rounded-xl shadow-md border-t-4 border-indigo-500">
                    <h3 className="text-xl font-bold text-indigo-300 flex items-center">
                        <Home className="w-5 h-5 mr-2" /> {b.name}
                    </h3>
                    <p className="text-4xl font-extrabold text-white my-1">{b.count}</p>
                    <p className="text-sm text-gray-400 mt-2">Producción por unidad:</p>
                    <ul className="text-sm text-gray-300">
                        {Object.entries(b.rates).map(([res, rate]) => rate !== 0 && (
                            <li key={res}>
                                {res.charAt(0).toUpperCase() + res.slice(1)}: <span className={rate > 0 ? 'text-green-400' : 'text-red-400'}>{formatProduction(rate)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};


// Componente principal de la aplicación
const App = () => {
    const [user, setUser] = useState(null);
    const [buildings, setBuildings] = useState([]);
    const [population, setPopulation] = useState({ max_population: 0, current_population: 0 });
    const [token, setToken] = useState(localStorage.getItem('jwtToken') || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

    // --- Lógica de Autenticación y Carga Inicial ---

    const fetchData = useCallback(async (endpoint, method = 'GET', body = null) => {
        setError('');
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    handleLogout();
                    return { error: 'Sesión expirada o no válida.' };
                }
                return { error: data.message || `Error en la solicitud (${response.status})` };
            }

            return data;

        } catch (err) {
            return { error: 'Error de conexión con el servidor.' };
        }
    }, [token]);

    const handleAuthSubmit = async (username, password) => {
        setLoading(true);
        const endpoint = authMode === 'login' ? '/login' : '/register';
        
        const data = await fetchData(endpoint, 'POST', { username, password });

        if (data.error) {
            setError(data.error);
        } else {
            setToken(data.token);
            localStorage.setItem('jwtToken', data.token);
            setUser(data.user);
            setBuildings(data.buildings);
            setPopulation(data.population);
            setError(''); // Limpiar errores de auth si es exitoso
        }
        setLoading(false);
    };

    const loadUserData = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        const data = await fetchData('/me');

        if (data.error) {
            setError(data.error);
            handleLogout();
        } else {
            setUser(data.user);
            setBuildings(data.buildings);
            setPopulation(data.population);
        }
        setLoading(false);
    }, [token, fetchData]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);


    const handleLogout = () => {
        setToken('');
        setUser(null);
        setBuildings([]);
        setPopulation({ max_population: 0, current_population: 0 });
        localStorage.removeItem('jwtToken');
        setLoading(false);
    };

    // --- Lógica de Juego ---

    const handleBuild = async (buildingType) => {
        setLoading(true);
        const data = await fetchData('/build', 'POST', { buildingType });

        if (data.error) {
            setError(data.error);
        } else {
            setUser(data.user);
            setBuildings(data.buildings);
            setPopulation(data.population);
            setError(data.message); // Mostrar mensaje de éxito
        }
        setLoading(false);
    };

    const generateResources = useCallback(async () => {
        if (!user) return;
        
        const data = await fetchData('/generate-resources', 'POST');

        if (data.error) {
            console.error('Error generando recursos:', data.error);
            // No mostrar un error grande, sino solo loguear
        } else {
            setUser(data.user);
            setBuildings(data.buildings);
            setPopulation(data.population);
            // Opcional: mostrar un mensaje temporal de generación
            // setError(data.message); 
        }
    }, [user, fetchData]);

    // Polling automático para la generación de recursos
    useEffect(() => {
        let interval;
        if (user) {
            interval = setInterval(generateResources, GENERATION_INTERVAL_MS);
        }
        return () => clearInterval(interval);
    }, [user, generateResources]);


    // Componente de Autenticación
    const AuthScreen = () => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');

        const handleSubmit = (e) => {
            e.preventDefault();
            handleAuthSubmit(username, password);
        };

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
                <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm">
                    <h2 className="text-3xl font-bold mb-6 text-center text-white">
                        {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                    </h2>
                    {error && <p className="bg-red-900 text-red-300 p-2 rounded mb-4 text-center text-sm">{error}</p>}

                    <input
                        type="text"
                        placeholder="Nombre de usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 mb-6 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold p-3 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-900 flex items-center justify-center"
                    >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : (authMode === 'login' ? 'Entrar' : 'Crear Cuenta')}
                    </button>
                    
                    <p className="mt-4 text-center text-gray-400 text-sm">
                        {authMode === 'login' ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                        <button
                            type="button"
                            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                            {authMode === 'login' ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </p>
                </form>
            </div>
        );
    };

    // Componente de Edificios
    const BuildingList = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(BUILDING_COSTS).map(([type, cost]) => {
                const canBuild = user && user.wood >= cost.wood && user.stone >= cost.stone && user.food >= cost.food;
                
                const currentCount = buildings.find(b => b.type === type)?.count || 0;
                
                return (
                    <div 
                        key={type} 
                        className={`p-5 rounded-xl shadow-xl transition transform hover:scale-[1.02] 
                                    ${canBuild ? 'bg-indigo-900 border-2 border-indigo-600' : 'bg-gray-800 border-2 border-gray-600 opacity-70'}`}
                    >
                        <h3 className="text-2xl font-extrabold text-white mb-2">
                            {type.charAt(0).toUpperCase() + type.slice(1)} ({currentCount})
                        </h3>
                        <p className="text-sm text-indigo-300 mb-3">
                            {type === 'house' && 'Aumenta la población máxima.'}
                            {type === 'sawmill' && 'Produce madera. Consume comida.'}
                            {type === 'quarry' && 'Produce piedra. Consume comida.'}
                            {type === 'farm' && 'Produce comida. Consume madera.'}
                        </p>
                        
                        <div className="text-xs text-gray-300 mb-4">
                            <p className="font-bold mb-1">Coste:</p>
                            {Object.entries(cost).map(([res, val]) => val > 0 && (
                                <span key={res} className={`mr-2 ${user && user[res] >= val ? 'text-green-400' : 'text-red-400'}`}>
                                    {res.charAt(0).toUpperCase() + res.slice(1)}: {val}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={() => handleBuild(type)}
                            disabled={!canBuild || loading}
                            className={`w-full py-2 font-bold rounded-lg transition duration-200 
                                ${canBuild ? 'bg-green-500 hover:bg-green-600 text-gray-900' : 'bg-red-800 text-red-300 cursor-not-allowed'}`}
                        >
                            {loading && canBuild ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Construir'}
                        </button>
                    </div>
                );
            })}
        </div>
    );

    if (loading && token && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white text-xl flex items-center">
                    <RefreshCw className="w-6 h-6 animate-spin mr-3" />
                    Cargando datos del imperio...
                </div>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4 sm:p-8 font-sans">
            <header className="flex flex-col md:flex-row justify-between items-start mb-8 pb-4 border-b border-gray-700">
                <h1 className="text-4xl font-extrabold text-white mb-2">
                    Imperio de {user.username}
                </h1>
                <div className="flex space-x-4">
                    <button
                        onClick={generateResources}
                        disabled={loading}
                        className="flex items-center bg-yellow-500 text-gray-900 font-bold p-3 rounded-full shadow-lg hover:bg-yellow-400 transition"
                    >
                        <Zap className="w-5 h-5 mr-2" />
                        Generar Recursos (Manual)
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white font-bold p-3 rounded-full shadow-lg hover:bg-red-700 transition"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-yellow-900 text-yellow-300 p-3 rounded-lg mb-6 shadow-md border border-yellow-700">
                    <p className="font-semibold">Mensaje del sistema:</p>
                    <p>{error}</p>
                </div>
            )}

            <ResourceBar user={user} population={population} />

            <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Estadísticas de Producción</h2>
                <ProductionDetails buildings={buildings} />
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Construir Edificios</h2>
                <BuildingList />
            </section>
            
            <footer className="mt-12 text-center text-gray-500 text-sm">
                Generación automática cada {GENERATION_INTERVAL_MS / 1000} segundos.
            </footer>
        </div>
    );
};

// Necesario para el entorno Canvas, asumimos que Tailwind está disponible globalmente.
export default App;
