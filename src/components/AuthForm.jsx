import React, { useState } from "react";
import { useFactions } from "../hooks/useFactions";

export default function AuthForm({ onSubmit, isRegistering }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [factionId, setFactionId] = useState("");
  const { factions, loading } = useFactions();
 console.log('Facciones id:', factionId);
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar que haya facción si es registro
    if (isRegistering && !factionId) {
      alert("Por favor, selecciona una facción.");
      return;
    }

    onSubmit(username, password, isRegistering, factionId);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-white mb-4">
          {isRegistering ? "Registro" : "Iniciar Sesión"}
        </h2>

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

        {isRegistering && (
          <div>
            {loading ? (
              <p className="text-gray-400 text-sm">Cargando facciones...</p>
            ) : (
              <select
                value={factionId}
                onChange={(e) => setFactionId(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona una facción</option>
                {factions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {isRegistering ? "Registrarse" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
