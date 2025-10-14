import React from "react";

export default function AuthForm({
  username,
  password,
  faction,
  isRegistering,
  setUsername,
  setPassword,
  setFaction,
  setIsRegistering,
  handleAuth,
  isLoading,
}) {
  const onSubmit = async (e) => {
    e.preventDefault();

    if (typeof handleAuth !== "function") {
      console.error("handleAuth no es una función");
      return;
    }

    await handleAuth(username, password, isRegistering, faction);
  };

  return (
    <div className="w-full max-w-md p-6 bg-gray-900 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-bold mb-4">
        {isRegistering ? "Registro" : "Iniciar sesión"}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-800 border border-gray-600"
          />
        </div>

        <div>
          <label className="block mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-800 border border-gray-600"
          />
        </div>

        {isRegistering && (
          <div>
            <label className="block mb-1">Facción</label>
            <select
              value={faction}
              onChange={(e) => setFaction(e.target.value)}
              required
              className="w-full p-2 rounded bg-gray-800 border border-gray-600"
            >
              <option value="">Selecciona una facción</option>
              <option value="humans">Humanos</option>
              <option value="elves">Elfos</option>
              <option value="dwarves">Enanos</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold"
        >
          {isLoading ? "Procesando..." : isRegistering ? "Registrarse" : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-400">
        {isRegistering ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
        <button
          className="text-blue-400 underline"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Iniciar sesión" : "Regístrate"}
        </button>
      </p>
    </div>
  );
}
