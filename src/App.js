import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resources, setResources] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL; 

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!API_URL) {
      setMessage('Error: La URL del API no está configurada. ¿Estás en el entorno de producción?');
      return;
    }
    
    try {
      // Envía la petición a la URL obtenida de la variable de entorno
      const response = await axios.post(`${API_URL}/api/register`, { username, password });
      setMessage(response.data.message);
      setResources(response.data.user);
    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : 'Error de conexión con el servidor.';
      setMessage(errorMessage);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Juego de Comercio Medieval</h1>
      {!resources ? (
        <form onSubmit={handleRegister}>
          <h2>Registro</h2>
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
          <button type="submit">Registrarse</button>
          <p style={{ color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>
        </form>
      ) : (
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
      )}
    </div>
  );
}

export default App;
