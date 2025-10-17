import React from 'react';
import AuthForm from './components/AuthForm';
import HomeView from './components/HomeView';
import MapPage from './components/MapPage';
import useGameData from './hooks/useGameData';

export default function App() {
  const {
    user,
    buildings,
    population,
    isLoading,
    uiMessage,
    canBuild,
    handleAuth,
    handleBuild,
    handleLogout,
    buildCosts,
    fetchBuildCost,
  } = useGameData();

  const [showMap, setShowMap] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);

  // Mostrar loading o mensaje inicial mientras carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Cargando datos del juego...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar formulario de login/registro
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
        <AuthForm
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
          handleAuth={handleAuth}
        />
      </div>
    );
  }

  // Si estamos en la vista del mapa
  if (showMap) {
    return <MapPage token={localStorage.getItem('authToken')} onBack={() => setShowMap(false)} />;
  }

  // Vista principal del juego (Home)
  return (
    <HomeView
      userData={user}
      buildings={buildings}
      population={population}
      canBuild={canBuild}
      onBuild={handleBuild}
      onShowMap={() => setShowMap(true)}
      onLogout={handleLogout}
      uiMessage={uiMessage}
      buildCosts={buildCosts}
      fetchBuildCost={fetchBuildCost}
    />
  );
}
