// src/hooks/useEnviosFabrica.ts
import { useEffect, useState } from "react";
import { fetchFromDynamicApi } from "../services/dinamicApi";

export interface EnvioFabrica {
  EnvioFabricaID: number;
  Fecha: string;
  GranjaDestinoID: number;
  SiloDestinoID: number;
  TipoAlimento: string;
  CantidadKg: number;
  Chofer: string;
  Placas: string;
  Observaciones?: string;
}

export function useEnviosFabrica() {
  const [envios, setEnvios] = useState<EnvioFabrica[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar envíos
  const loadEnvios = async () => {
    try {
      setLoading(true);
      const data: EnvioFabrica[] = await fetchFromDynamicApi({
        metodo: "ALVEZH_EnvioFabrica",
        tipo: "tabla",
        operacion: "consultar",
        data: {}
      });
      setEnvios(data || []);
    } catch (err: any) {
      setError(err.message || "Error cargando envíos a fábrica");
      setEnvios([]);
    } finally {
      setLoading(false);
    }
  };

  // Guardar envío y agregar lote
  const saveEnvio = async (envio: Partial<EnvioFabrica>) => {
    try {
      const operacion = envio.EnvioFabricaID ? "actualizar" : "insertar";

      const payload: any = {
        GranjaDestinoID: envio.GranjaDestinoID || 0,
        SiloDestinoID: envio.SiloDestinoID || 0,
        TipoAlimento: envio.TipoAlimento || "",
        CantidadKg: envio.CantidadKg?.toString() || "0",
        Chofer: envio.Chofer || null,
        Placas: envio.Placas || null,
        Observaciones: envio.Observaciones || null,
        Fecha: envio.Fecha || new Date().toISOString(),
      };

      if (envio.EnvioFabricaID) {
        payload.EnvioFabricaID = envio.EnvioFabricaID;
      }

      // Guardar envío
      await fetchFromDynamicApi({
        metodo: "ALVEZH_EnvioFabrica",
        tipo: "tabla",
        operacion,
        data: payload,
      });

      // Recargar envíos
      const listaEnvios: EnvioFabrica[] = await fetchFromDynamicApi({
        metodo: "ALVEZH_EnvioFabrica",
        tipo: "tabla",
        operacion: "consultar",
        data: {}
      });

      // Obtener el envío recién insertado
      const nuevoEnvio = listaEnvios.find(e =>
        e.GranjaDestinoID === envio.GranjaDestinoID &&
        e.SiloDestinoID === envio.SiloDestinoID &&
        e.TipoAlimento === envio.TipoAlimento &&
        e.CantidadKg === envio.CantidadKg
      );

      if (nuevoEnvio) {
        // Insertar lote en ALZEposturaD
        await fetchFromDynamicApi({
          metodo: "LotesAlimento",
          tipo: "tabla",
          operacion: "insertar",
          data: {
            SiloID: nuevoEnvio.SiloDestinoID,
            TipoAlimento: nuevoEnvio.TipoAlimento,
            FechaEntrada: nuevoEnvio.Fecha,
            CantidadInicialKg: nuevoEnvio.CantidadKg,
            CantidadDisponibleKg: nuevoEnvio.CantidadKg,
            Origen: "Fabrica",
            TransferenciaID: nuevoEnvio.EnvioFabricaID,
            Observaciones: nuevoEnvio.Observaciones || "",
          },
        });
      }

      setEnvios(listaEnvios);
    } catch (err: any) {
      throw new Error(err.message || "No se pudo guardar el envío");
    }
  };

  // Eliminar envío
  const deleteEnvio = async (EnvioFabricaID: number) => {
    try {
      await fetchFromDynamicApi({
        metodo: "ALVEZH_EnvioFabrica",
        tipo: "tabla",
        operacion: "eliminar",
        data: { EnvioFabricaID },
      });
      await loadEnvios();
    } catch (err: any) {
      throw new Error(err.message || "No se pudo eliminar el envío");
    }
  };

  useEffect(() => {
    loadEnvios();
  }, []);

  return {
    envios,
    loading,
    error,
    reload: loadEnvios,
    saveEnvio,
    deleteEnvio,
  };
}
