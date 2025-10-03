import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Definir los costes y detalles de construcción en el frontend
const BUILDING_COSTS_FRONTEND = {
    'house': { 
        name: 'Casa Simple', 
        wood: 20, 
        stone: 10, 
        food: 5,
        description: 'Aumenta el límite de población y la moral.' 
    },
    // Añade más edificios aquí según los definas en el backend
};

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Inicia sesión o regístrate.');
  const [resources, setResources] = useState(null);
  const [buildings, setBuildings] = useState([]); 
  const [isRegistering, setIsRegistering] = useState(false); // Por defecto, login
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL; 

  // Función para obtener todos los datos del usuario (Recursos y Edificios)
  // Definida internamente para ser usada en useEffect, lo cual es la mejor práctica.
  const checkSession = async (storedToken) => {
    if (storedToken) {
        try {
            // Envía el token al backend para validación
            const response = await axios.get(`${API_URL}/api/me`, {
                headers: {
                    Authorization: `Bearer ${storedToken}`
                }
            });
            
            // Si el backend responde 200, la sesión es válida y cargamos los datos
            setResources(response.data.user);
            // NOTA: Necesitas actualizar la ruta /api/me en el backend para que devuelva
            // la lista de edificios del usuario. Por ahora, asumiremos que está vacía
            // hasta que integremos esa lógica.
            // setBuildings(response.data.buildings || []); 
            setMessage(response.data.message);
            
        } catch (error) {
            // Token no válido (401 o 403)
            localStorage.removeItem('authToken');
            setResources(null);
            setMessage('Sesión expirada o inválida. Inicia sesión.');
        }
    }
    setIsLoading(false); // Finaliza la carga inicial
  };

  // ⭐️ CORRECCIÓN DEL ERROR DE NETLIFY: Se llama a la función dentro del useEffect.
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    // Para resolver el error de eslint, definimos esta función auxiliar dentro
    // del useEffect para que no necesitemos incluirla en el array de dependencias.
    const runCheck = () => checkSession(storedToken);

    runCheck();
  }, [API_URL]); // Solo API_URL es una dependencia externa que no es de estado/prop

  // Manejador de Login/Registro
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'register' : 'login';
    setMessage('');
    
    try {
      const response = await axios.post(`${API_URL}/api/${endpoint}`, { username, password });
      
      // Guarda el nuevo token JWT y actualiza el estado
      const token = response.data.token;
      localStorage.setItem('authToken', token); 
      
      setMessage(response.data.message);
      setResources(response.data.user);
      setUsername('');
      setPassword('');
      
      // Llama a checkSession para cargar los datos completos tras el login/registro
      checkSession(token); 

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