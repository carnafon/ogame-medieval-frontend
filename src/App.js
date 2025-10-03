import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- CONFIGURACIÓN FRONTAL ---

// Intervalo de tiempo para la generación de recursos (en milisegundos)
// 10000 ms = 10 segundos
const GENERATION_INTERVAL_MS = 10000; 

// Definir los costes y detalles de construcción en el frontend
const BUILDING_COSTS_FRONTEND = {
    'house': { 
        name: 'Casa Simple', 
        wood: 20, 
        stone: 10, 
        food: 5,
        description: 'Aumenta el límite de población y la moral.' 
    },
      'sawmill': {
        name: 'Aserradero',
        wood: 50,
        stone: 30,
        food: 10,
        description: 'Produce Madera (+5) consumiendo Comida (-1) cada 10 segundos.'
    },
    // ⭐️ NUEVO: CANTERA AÑADIDA
    'quarry': {
        name: 'Cantera',
        wood: 40,
        stone: 80,
        food: 15,
        description: 'Produce Piedra (+8) consumiendo Comida (-2) cada 10 segundos.'
    },
    // Aquí puedes añadir más edificios
};

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Inicia sesión o regístrate.');
  const [resources, setResources] = useState(null);
  const [buildings, setBuildings] = useState([]); 
  const [population, setPopulation] = useState({ current_population: 0, max_population: 0 });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL; 

  // --- LÓGICA DE SESIÓN (ESTABLE CON useCallback) ---

  // Función para realizar el fetch de datos del usuario
  const fetchUserData = useCallback(async (token) => {
    try {
        const response = await axios.get(`${API_URL}/api/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Actualiza estados con los datos del usuario
        setResources(response.data.user);
        // PENDIENTE: Actualizar el backend para que devuelva la lista de edificios
        setBuildings(response.data.buildings || []); 
        setPopulation(response.data.population || { current_population: 0, max_population: 0 });
        setMessage(response.data.message);
        return true;
    } catch (error) {
        localStorage.removeItem('authToken');
        setResources(null);
        setMessage('Sesión expirada o inválida. Inicia sesión.');
        return false;
    } finally {
        setIsLoading(false);
    }
  }, [API_URL, setResources, setMessage, setIsLoading]); // Dependencias de useCallback

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
  }, [fetchUserData, setIsLoading]); 
  
  // --- LÓGICA DE GENERACIÓN DE RECURSOS ---
  
  // Efecto 2: Generación periódica de recursos
  useEffect(() => {
    // Solo inicia el intervalo si el usuario está logueado (resources no es null)
    if (resources && localStorage.getItem('authToken')) {
        
        const intervalId = setInterval(async () => {
            const storedToken = localStorage.getItem('authToken');
            if (!storedToken) {
                // Si el token desaparece, detener el intervalo inmediatamente.
                clearInterval(intervalId);
                return;
            }

            try {
                // Llama al endpoint de generación de recursos
                const response = await axios.post(`${API_URL}/api/generate-resources`, {}, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });
                
                // Actualizar los recursos con los nuevos valores del backend
                setResources(response.data.user);
                setPopulation(response.data.population);
                
                // Opcional: mostrar un mensaje de que los recursos se actualizaron
                // setMessage(response.data.message || 'Recursos actualizados.'); 

            } catch (error) {
                // Error 401 (token inválido/expirado)
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('authToken');
                    setResources(null);
                    setMessage('Sesión expirada. Inicia sesión de nuevo.');
                } else {
                    console.error("Error al generar recursos:", error);
                    setMessage('Error en la conexión o generación de recursos.');
                }
                clearInterval(intervalId); // Detener el intervalo tras un error serio
            }
        }, GENERATION_INTERVAL_MS);

        // Función de limpieza: se ejecuta al desmontar el componente o si 'resources' cambia (ej: logout)
        return () => clearInterval(intervalId);
    }
  }, [resources, API_URL, setResources,setPopulation, setMessage]); // Se reinicia si el usuario se loguea/desloguea

  // --- MANEJADORES DE ACCIONES ---

  // Manejador de Login/Registro
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'register' : 'login';
    setMessage('');
    
    try {
      const response = await axios.post(`${API_URL}/api/${endpoint}`, { username, password });
      
      const token = response.data.token;
      localStorage.setItem('authToken', token); 
      
      setMessage(response.data.message);
      setUsername('');
      setPassword('');
      
      // Tras el login/registro, cargamos los datos
      await fetchUserData(token); 

    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : 'Error de conexión con el servidor.';
      setMessage(`Error: ${errorMessage}`);
    }
  };

  // Manejador para la construcción
  const handleBuild = async (buildingType) => {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
        setMessage('Debes iniciar sesión para construir.');
        return;
    }

    try {
        const response = await axios.post(`${API_URL}/api/build`, { buildingType }, {
            headers: {
                Authorization: `Bearer ${storedToken}`
            }
        });
        
        setResources(response.data.user);
        setBuildings(response.data.buildings); 
        setPopulation(response.data.population);
        setMessage(response.data.message);

    } catch (error) {
        const errorMessage = error.response ? error.response.data.message : 'Error de construcción.';
        setMessage(`Error: ${errorMessage}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setResources(null);
    setBuildings([]);
    setIsRegistering(false); 
    setMessage('Has cerrado sesión.');
  };

  // Comprueba si el usuario tiene suficientes recursos
  const canBuild = (cost) => {
      if (!resources) return false;
      return resources.wood >= cost.wood && 
             resources.stone >= cost.stone && 
             resources.food >= cost.food;
  };


  if (isLoading) {
    return <div style={{ padding: '20px' }}>Cargando sesión...</div>;
  }

  // --- RENDERIZADO ---
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Juego de Comercio Medieval</h1>
      
      {resources ? (
        // Estado de USUARIO LOGUEADO
        <div>
          <h2>Bienvenido, {resources.username}</h2>
          <button onClick={handleLogout} style={{ float: 'right' }}>Cerrar Sesión</button>
          
          {/* SECCIÓN DE RECURSOS Y POBLACION*/}
          <h3>💰 Tus Recursos:</h3>
          <ul>
            <li>**Madera:** {resources.wood}</li>
            <li>**Piedra:** {resources.stone}</li>
            <li>🍎 Comida:** {resources.food}</li>
            <li>👥 Población: {population.current_population} / {population.max_population}</li>
          </ul>
          <p style={{ color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>
          
          <hr/>
          
          {/* SECCIÓN DE EDIFICIOS ACTUALES */}
          <h3>🏰 Tus Edificios:</h3>
          {buildings.length === 0 ? (
              <p>Aún no tienes edificios. ¡Construye uno!</p>
          ) : (
              <ul>
                  {buildings.map((b) => (
                      <li key={b.type}>{b.count} x {b.type.charAt(0).toUpperCase() + b.type.slice(1)}</li>
                  ))}
              </ul>
          )}
          
          <hr/>

          {/* SECCIÓN DE CONSTRUCCIÓN */}
          <h3>🔨 Construir:</h3>
          
          {Object.entries(BUILDING_COSTS_FRONTEND).map(([type, details]) => (
            <div key={type} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px', margin: '15px 0' }}>
                <h4>{details.name} ({type.charAt(0).toUpperCase() + type.slice(1)})</h4>
                <p style={{ fontSize: '0.9em', color: '#555' }}>{details.description}</p>
                <p style={{ fontWeight: 'bold' }}>
                    Coste: 
                    {details.wood > 0 && ` | Madera: ${details.wood}`}
                    {details.stone > 0 && ` | Piedra: ${details.stone}`}
                    {details.food > 0 && ` | Comida: ${details.food}`}
                </p>
                <button 
                    onClick={() => handleBuild(type)} 
                    disabled={!canBuild(details)}
                    style={{ 
                        backgroundColor: canBuild(details) ? '#10b981' : '#a0a0a0', 
                        color: 'white', 
                        border: 'none', 
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: canBuild(details) ? 'pointer' : 'not-allowed'
                    }}>
                    Construir 1 {details.name}
                </button>
                {!canBuild(details) && <span style={{ color: '#dc2626', marginLeft: '10px' }}>Recursos insuficientes.</span>}
            </div>
          ))}
          
        </div>
      ) : (
        // Estado de NO LOGUEADO: Formulario de Autenticación
        <div>
          <button 
            onClick={() => setIsRegistering(!isRegistering)} 
            style={{ 
                marginBottom: '20px', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                padding: '10px',
                border: 'none',
                borderRadius: '5px'
            }}>
            {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
          
          <form onSubmit={handleAuth} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <h2>{isRegistering ? 'Registro' : 'Iniciar Sesión'}</h2>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ display: 'block', margin: '10px 0', padding: '10px', width: '90%', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: 'block', margin: '10px 0', padding: '10px', width: '90%', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ backgroundColor: '#10b981', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {isRegistering ? 'Crear Cuenta' : 'Acceder'}
            </button>
            <p style={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '15px' }}>{message}</p>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
