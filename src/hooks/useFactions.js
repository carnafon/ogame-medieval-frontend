import { useEffect, useState } from "react";
import { API_BASE_URL } from "../constants/config";

export function useFactions() {
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFactions() {
      try {
        const res = await fetch(`${API_BASE_URL}/factions`);
        const data = await res.json();
        
        setFactions(data);
      } catch (error) {
        // Errores de carga de facciones: informar por UI no por consola
        // Dejar silent fail para no contaminar logs en producción
        // Puedes habilitar logging aquí si necesitas depuración.
        // console.error("Error cargando facciones:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFactions();
  }, []);

  return { factions, loading };
}
