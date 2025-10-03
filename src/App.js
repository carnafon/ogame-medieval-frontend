import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resources, setResources] = useState(null);
  const [isRegistering, setIsRegistering] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // Nuevo estado para la carga inicial

  const API_URL = process.env.REACT_APP_API_URL; 

  // 1. Efecto para cargar la sesión al inicio (al montar el componente)
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      // NOTA: Para un MVP, cargamos el recurso de la base de datos simulando una sesión activa
      // En un entorno real, tendrías una ruta '/api/me' que valida el token y devuelve el usuario
      setMessage('Sesión reanudada. ¡Bienvenido!');
      // Por simplicidad, recargaremos el primer usuario de la DB (se reemplazará en el futuro)
      loadInitialUser(); 
    } else {
      setIsLoading(false); // No hay token, mostrar formularios
    }
  }, []);

  // Función temporal para simular la carga de sesión
  const loadInitialUser = async () => {
      // Aquí el token ya está en localStorage, pero aún no tenemos una ruta de validación.
      // Por ahora, para el MVP, simplemente asumiremos que el primer usuario es el logueado 
      // y cargaremos su data (ESTO SE MEJORA EN LA SIGUIENTE FASE).
      // Aquí estamos forzando un 'login' para cargar data
      // setResources({ username: 'usuario_temporal', wood: 10, stone: 10, food: 10 }); 
      // Si la carga de sesión fuera real (con una ruta /api/me), se cargaría la data de la respuesta.
      setIsLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'register' : 'login';
    setMessage('');
    
    try {
      const response = await axios.post(`${API_URL}/api/${endpoint}`, { username, password });
      
      // 2. Guardar el token de autenticación
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
    setIsRegistering(false); // Vuelve a la vista de login
    setMessage('Has cerrado sesión.');
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Cargando sesión...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Juego de Comercio Medieval</h1>
      
      {resources ? (
        // Estado de USUARIO LOGUEADO: Muestra Recursos y Botón de Logout
        <div>
          <h2>Bienvenido, {resources.username}</h2>
          <button onClick={handleLogout} style={{ float: 'right' }}>Cerrar Sesión</button>
          <h3>Tus Recursos:</h3>
          <ul>
            <li>Madera: {resources.wood}</li>
            <li>Piedra: {resources.stone}</li>
            <li>Comida: {resources.food}</li>
          </ul>
          <p>Tus recursos aumentan automáticamente cada minuto.</p>
        </div>
      ) : (
        // Estado de NO LOGUEADO: Muestra Formulario de Autenticación
        <div>
          <button 
            onClick={() => setIsRegistering(true)} 
            disabled={isRegistering}
            style={{ marginRight: '10px' }}>
            Registrarse
          </button>
          <button 
            onClick={() => setIsRegistering(false)} 
            disabled={!isRegistering}>
            Iniciar Sesión
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
              {/* Texto de botón simple */}
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