import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resources, setResources] = useState(null);
  const [isRegistering, setIsRegistering] = useState(true); // Controla si es Registro o Login

  const API_URL = process.env.REACT_APP_API_URL; 

  const handleAuth = async (e) => {
    e.preventDefault();
    // Decide qué endpoint usar basado en el estado
    const endpoint = isRegistering ? 'register' : 'login';
    
    try {
      // Envía la petición al endpoint correcto (/api/register o /api/login)
      const response = await axios.post(`${API_URL}/api/${endpoint}`, { username, password });
      
      setMessage(response.data.message);
      setResources(response.data.user); // Carga el usuario y sus recursos
      setUsername('');
      setPassword('');
    } catch (error) {
      const errorMessage = error.response 
        ? error.response.data.message 
        : 'Error de conexión con el servidor.';
      
      // Si el backend devuelve 401 (no autorizado), muestra el mensaje de credenciales incorrectas
      setMessage(`Error: ${errorMessage}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Juego de Comercio Medieval</h1>
      
      {resources ? (
        // Muestra Recursos (Usuario logueado)
        <div>
          <h2>Bienvenido, {resources.username}</h2>
          <h3>Tus Recursos:</h3>
          <ul>
            <li>Madera: {resources.wood}</li>
            <li>Piedra: {resources.stone}</li>
            <li>Comida: {resources.food}</li>
          </ul>
          <p>Tus recursos aumentan automáticamente cada minuto.</p>
        </div>
      ) : (
        // Muestra Formulario de Autenticación
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