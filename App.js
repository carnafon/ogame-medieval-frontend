// App.js (Ejemplo en React)

import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resources, setResources] = useState(null);

  const API_URL = 'const API_URL = process.env.REACT_APP_API_URL'; // **¡IMPORTANTE! Cambia esto por la URL de tu servicio en Render**

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/register`, { username, password });
      setMessage(response.data.message);
      setResources(response.data.user);
    } catch (error) {
      setMessage(error.response.data.message);
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
          <p>{message}</p>
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
