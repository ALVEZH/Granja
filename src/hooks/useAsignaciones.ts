import { useEffect, useState } from "react";
import { fetchFromDynamicApi } from "../services/dinamicApi";

export interface Asignacion {
  AsignacionID: number;
  GranjaID: number;
  CasetaID: number;
  SiloPreferenteID: number | null;
  TipoAlimento: string;
  FechaAsignacion: string;
  Notas?: string;
}

export function useAsignaciones() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista
  const loadAsignaciones = async () => {
    try {
      setLoading(true);
      const data = await fetchFromDynamicApi({
        metodo: "ALVEZH_Asignacion",
        tipo: "tabla",
        operacion: "consultar",
      });
      setAsignaciones(data);
    } catch (err: any) {
      setError(err.message || "Error cargando asignaciones");
    } finally {
      setLoading(false);
    }
  };

  // Insertar nueva asignación
  const saveAsignacion = async (asignacion: Partial<Asignacion>) => {
    try {
      await fetchFromDynamicApi({
        metodo: "ALVEZH_Asignacion",
        tipo: "tabla",
        operacion: "insertar",
        data: asignacion,
      });
      await loadAsignaciones();
    } catch (err: any) {
      throw new Error(err.message || "No se pudo guardar la asignación");
    }
  };

  useEffect(() => {
    loadAsignaciones();
  }, []);

  return { asignaciones, loading, error, reload: loadAsignaciones, saveAsignacion };
}
