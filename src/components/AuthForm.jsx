import React, { useState } from "react";
import { useFactions } from "../hooks/useFactions";

export default function AuthForm({ handleAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [factionId, setFactionId] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const { factions, loading } = useFactions();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isRegistering && !factionId) {
      alert("Por favor, selecciona una facción.");
      return;
    }

    handleAuth(username, password, isRegistering, factionId);
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

        {/* Usuario */}
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Contraseña */}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={isRegistering ? "new-password" : "current-password"}
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Selector de facción (solo en registro) */}
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

        {/* Botón principal */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {isRegistering ? "Registrarse" : "Entrar"}
        </button>

        {/* Toggle entre registro / login */}
        <p className="text-sm text-gray-400 text-center mt-2">
          {isRegistering ? (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="text-blue-400 underline"
                onClick={() => setIsRegistering(false)}
              >
                Entrar
              </button>
            </>
          ) : (
            <>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="text-blue-400 underline"
                onClick={() => setIsRegistering(true)}
              >
                Registrarse
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
