import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Inicia sesión o regístrate.');
  const [resources, setResources] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false); // Por defecto, mostrar Login
  const [isLoading, setIsLoading] = useState(true); // Bloquea la UI hasta revisar la sesión

  const API_URL = process.env.REACT_APP_API_URL; 

  // Función para reanudar la sesión al cargar (F5)
  useEffect(() => {
    const checkSession = async () => {
        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
            try {
                // Envía el token al backend para validación
                const response = await axios.get(`${API_URL}/api/me`, {
                    headers: {
                        // Formato estándar para enviar el token
                        Authorization: `Bearer ${storedToken}`
                    }
                });
                
                // Si el backend responde 200, la sesión es válida
                setResources(response.data.user);
                setMessage(response.data.message);
                
            } catch (error) {
                // Token no válido (401 o 403), lo borramos y forzamos el login
                localStorage.removeItem('authToken');
                setMessage('Sesión expirada o inválida. Inicia sesión.');
            }
        }
        setIsLoading(false); // La carga inicial ha terminado, muestra la UI
    };
    checkSession();
  }, [API_URL]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'register' : 'login';
    
    try {
      const response = await axios.post(`${API_URL}/api/${endpoint}`, { username, password });
      
      // Guarda el nuevo token JWT
      localStorage.setItem('authToken', response.data.token); 
      
      setMessage(response.data.message);
      setResources(response.data.user);
      setUsername('');
      setPassword('');
    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : 'Error de conexión con el servidor.';
      setMessage(`Error: ${errorMessage}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setResources(null);
    setIsRegistering(false); 
    setMessage('Has cerrado sesión.');
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Cargando sesión...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Juego de Comercio Medieval</h1>
      
      {resources ? (
        // USUARIO LOGUEADO: Muestra Recursos
        <div>
          <h2>Bienvenido, {resources.username}</h2>
          <button onClick={handleLogout} style={{ float: 'right' }}>Cerrar Sesión</button>
          {/* Muestra los recursos */}
          <h3>Tus Recursos:</h3>
          {/* ... (código de listado de recursos) ... */}
          <ul>
            <li>Madera: {resources.wood}</li>
            <li>Piedra: {resources.stone}</li>
            <li>Comida: {resources.food}</li>
          </ul>
          <p>Tus recursos aumentan automáticamente cada minuto.</p>
        </div>
      ) : (
        // NO LOGUEADO: Formulario simplificado
        <div>
          <button 
            onClick={() => setIsRegistering(!isRegistering)} 
            style={{ marginBottom: '20px' }}>
            {/* Botón que conmuta entre Registro y Login */}
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
              {/* Texto de botón simple, no redundante */}
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