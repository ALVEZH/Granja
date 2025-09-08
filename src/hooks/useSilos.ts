import { useEffect, useState } from "react";
import { fetchFromDynamicApi } from "../services/dinamicApi";

export interface Silo {
  SiloID: number;
  GranjaID: number;
  Nombre: string;
  CapacidadKg: number;
  Activo: boolean;
  FechaCreacion: string;
}

export function useSilos() {
  const [silos, setSilos] = useState<Silo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de silos
  const loadSilos = async () => {
    try {
      setLoading(true);
      const data = await fetchFromDynamicApi({
        metodo: "ALVEZH_Silos",
        tipo: "tabla",
        operacion: "consultar",
      });
      setSilos(data);
    } catch (err: any) {
      setError(err.message || "Error cargando silos");
    } finally {
      setLoading(false);
    }
  };

  // Agregar o actualizar
  const saveSilo = async (silo: Partial<Silo>) => {
  try {
    const operacion = silo.SiloID ? "actualizar" : "insertar";

    // Para actualizar, el API acepta SiloID dentro de data
    const payload: any = {
      Nombre: silo.Nombre,
      CapacidadKg: silo.CapacidadKg,
      Activo: silo.Activo ?? 1,
      GranjaID: silo.GranjaID,
    };

    if (silo.SiloID) {
      payload.SiloID = silo.SiloID; // el endpoint lo toma como UPDATE
    }

    await fetchFromDynamicApi({
      metodo: "ALVEZH_Silos",
      tipo: "tabla",
      operacion,
      data: payload,
    });

    await loadSilos();
  } catch (err: any) {
    throw new Error(err.message || "No se pudo guardar el silo");
  }
};


  // Eliminar silo
  const deleteSilo = async (SiloID: number) => {
    try {
      await fetchFromDynamicApi({
        metodo: "ALVEZH_Silos",
        tipo: "tabla",
        operacion: "eliminar",
        data: { SiloID },
      });
      await loadSilos();
    } catch (err: any) {
      throw new Error(err.message || "No se pudo eliminar el silo");
    }
  };

  useEffect(() => {
    loadSilos();
  }, []);

  return {
    silos,
    loading,
    error,
    reload: loadSilos,
    saveSilo,
    deleteSilo,
  };
}
