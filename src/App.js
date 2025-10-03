import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Definir los costes en el frontend para la interfaz
const BUILDING_COSTS_FRONTEND = {
    'house': { 
        name: 'Casa Simple', 
        wood: 20, 
        stone: 10, 
        food: 5,
        description: 'Aumenta el límite de población y la moral.' 
    },
    // Añade más edificios aquí
};

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Inicia sesión o regístrate.');
  const [resources, setResources] = useState(null);
  const [buildings, setBuildings] = useState([]); // Nuevo estado para edificios
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL; // Asegúrate de definir esta variable en tu .env

  // Función para obtener todos los datos del usuario (recursos y edificios)
  const fetchUserData = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/api/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        // La ruta /api/me necesita devolver también la lista de edificios. 
        // MODIFICACIÓN PENDIENTE: Por ahora, la cargaremos con un valor por defecto []
        setResources(response.data.user);
        // PENDIENTE: Aquí se cargarían los edificios del backend. Por ahora, asumimos vacio.
        // setBuildings(response.data.buildings || []); 
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
  };

  // Efecto para cargar la sesión al inicio (F5)
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      fetchUserData(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [API_URL]);

  // Manejador de Login/Registro
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'register' : 'login';
    
    try {
      const response = await axios.post(`${API_URL}/api/${endpoint}`, { username, password });
      
      localStorage.setItem('authToken', response.data.token); 
      
      setMessage(response.data.message);
      setResources(response.data.user);
      setUsername('');
      setPassword('');
      
      // Tras el login/registro, cargar también los edificios del usuario
      fetchUserData(response.data.token); 

    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : 'Error de conexión con el servidor.';
      setMessage(`Error: ${errorMessage}`);
    }
  };

  // ⭐️ Manejador para la construcción
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
        
        // Actualizar el estado con los recursos y edificios devueltos por el backend
        setResources(response.data.user);
        setBuildings(response.data.buildings); 
        setMessage(response.data.message);

    } catch (error) {
        const errorMessage = error.response ? error.response.data.message : 'Error de construcción.';
        setMessage(`Error: ${errorMessage}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setResources(null);
    setBuildings([]); // Limpiar edificios al cerrar sesión
    setIsRegistering(false); 
    setMessage('Has cerrado sesión.');
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Cargando sesión...</div>;
  }

  // Comprueba si el usuario tiene suficientes recursos
  const canBuild = (cost) => {
      if (!resources) return false;
      return resources.wood >= cost.wood && 
             resources.stone >= cost.stone && 
             resources.food >= cost.food;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Juego de Comercio Medieval</h1>
      
      {resources ? (
        // Estado de USUARIO LOGUEADO
        <div>
          <h2>Bienvenido, {resources.username}</h2>
          <button onClick={handleLogout} style={{ float: 'right' }}>Cerrar Sesión</button>
          
          {/* SECCIÓN DE RECURSOS */}
          <h3>💰 Tus Recursos:</h3>
          <ul>
            <li>**Madera:** {resources.wood}</li>
            <li>**Piedra:** {resources.stone}</li>
            <li>**Comida:** {resources.food}</li>
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
            <div key={type} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
                <h4>{details.name} ({type.charAt(0).toUpperCase() + type.slice(1)})</h4>
                <p>{details.description}</p>
                <p>
                    **Coste:** {details.wood > 0 && `Madera: ${details.wood}, `}
                    {details.stone > 0 && `Piedra: ${details.stone}, `}
                    {details.food > 0 && `Comida: ${details.food}`}
                </p>
                <button 
                    onClick={() => handleBuild(type)} 
                    disabled={!canBuild(details)}
                    style={{ backgroundColor: canBuild(details) ? 'green' : 'gray', color: 'white', border: 'none', padding: '10px' }}>
                    Construir 1 {details.name}
                </button>
                {!canBuild(details) && <span style={{ color: 'red', marginLeft: '10px' }}>Recursos insuficientes.</span>}
            </div>
          ))}
          
        </div>
      ) : (
        // Estado de NO LOGUEADO: Formulario
        <div>
          <button 
            onClick={() => setIsRegistering(!isRegistering)} 
            style={{ marginBottom: '20px' }}>
            {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
          
          <form onSubmit={handleAuth}>
            <h2>{isRegistering ? 'Registro' : 'Iniciar Sesión'}</h2>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ display: 'block', margin: '10px 0' }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: 'block', margin: '10px 0' }}
            />
            <button type="submit">
              {isRegistering ? 'Crear Cuenta' : 'Acceder'}
            </button>
            <p style={{ color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;