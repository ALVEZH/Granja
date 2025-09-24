// src/hooks/useTransferencias.ts
import { useEffect, useState } from "react";
import { fetchFromDynamicApi } from "../services/dinamicApi";

export interface Transferencia {
  TransferenciaID: number;
  Fecha: string;
  GranjaOrigenID: number;
  SiloOrigenID: number;
  GranjaDestinoID: number;
  SiloDestinoID: number;
  TipoAlimento: string;   
  CantidadKg: number;
  /* Estatus: string; */
  Chofer?: string;
  Placas?: string;
  Observaciones?: string;
}

export function useTransferencias() {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de transferencias
  const loadTransferencias = async () => {
    try {
      setLoading(true);
      const data = await fetchFromDynamicApi({
        metodo: "ALVEZH_Transferencia",
        tipo: "tabla",
        operacion: "consultar",
        data: {}
      });
      setTransferencias(data);
    } catch (err: any) {
      setError(err.message || "Error cargando transferencias");
    } finally {
      setLoading(false);
    }
  };

  const getLoteDefault = async (SiloID: number) => {
  try {
    const lotes: any[] = await fetchFromDynamicApi({
      metodo: "LotesAlimento",
      tipo: "tabla",
      operacion: "consultar",
      data: { where: { SiloID } }, // ✅ ahora sí filtra por SiloID
    });

    // Filtrar solo lotes con cantidad disponible > 0 y ordenar por fecha FIFO
    const loteFIFO = lotes
      .filter(l => l.CantidadDisponibleKg > 0)
      .sort((a, b) => new Date(a.FechaEntrada).getTime() - new Date(b.FechaEntrada).getTime())[0];

    if (!loteFIFO) return null;

    // Retornar un objeto con tipo de alimento y cantidad disponible
    return {
      tipoAlimento: loteFIFO.TipoAlimento,
      cantidadDisponible: loteFIFO.CantidadDisponibleKg
    };
  } catch (err) {
    console.error("Error obteniendo lote por defecto:", err);
    return "";
  }
};


  // Agregar o actualizar transferencia
  const saveTransferencia = async (transferencia: Partial<Transferencia>) => {
    try {
      const operacion = transferencia.TransferenciaID ? "actualizar" : "insertar";

      const payload: any = {
        GranjaOrigenID: transferencia.GranjaOrigenID,
        SiloOrigenID: transferencia.SiloOrigenID,
        GranjaDestinoID: transferencia.GranjaDestinoID,
        SiloDestinoID: transferencia.SiloDestinoID,
        TipoAlimento: transferencia.TipoAlimento,
        CantidadKg: transferencia.CantidadKg?.toString(),
        /* Estatus: transferencia.Estatus, */
        Chofer: transferencia.Chofer || null,
        Placas: transferencia.Placas || null,
        Observaciones: transferencia.Observaciones || null,
      };

      if (transferencia.TransferenciaID) {
        payload.TransferenciaID = transferencia.TransferenciaID;
        payload.Fecha = transferencia.Fecha;
      }

      // Guardar transferencia
      await fetchFromDynamicApi({
        metodo: "ALVEZH_Transferencia",
        tipo: "tabla",
        operacion,
        data: payload,
      });

      // Recargar transferencias
      const listaTransferencias = await fetchFromDynamicApi({
        metodo: "ALVEZH_Transferencia",
        tipo: "tabla",
        operacion: "consultar",
        data: {},
      });

      // Buscar la transferencia recién insertada
      const nuevaTransferencia = listaTransferencias.find((t: Transferencia) =>
        t.GranjaOrigenID === transferencia.GranjaOrigenID &&
        t.SiloOrigenID === transferencia.SiloOrigenID &&
        t.GranjaDestinoID === transferencia.GranjaDestinoID &&
        t.SiloDestinoID === transferencia.SiloDestinoID &&
        t.CantidadKg === transferencia.CantidadKg &&
        t.TipoAlimento === transferencia.TipoAlimento
      );

      if (nuevaTransferencia && transferencia.CantidadKg) {
        let restante = transferencia.CantidadKg;

        // 1️⃣ Traer lotes del silo de origen y tipo seleccionado
        const lotesOrigen: any[] = await fetchFromDynamicApi({
          metodo: "LotesAlimento",
          tipo: "tabla",
          operacion: "consultar",
          data: { SiloID: transferencia.SiloOrigenID, TipoAlimento: transferencia.TipoAlimento },
        });

        // 2️⃣ Filtrar solo lotes con CantidadDisponibleKg > 0 y ordenar por FIFO
        const lotesValidos = lotesOrigen
          .filter(l => l.CantidadDisponibleKg > 0 && l.SiloID === transferencia.SiloOrigenID && l.TipoAlimento === transferencia.TipoAlimento)
          .sort((a, b) => new Date(a.FechaEntrada).getTime() - new Date(b.FechaEntrada).getTime());


        const totalDisponible = lotesValidos.reduce((acc, l) => acc + l.CantidadDisponibleKg, 0);

        if (totalDisponible < transferencia.CantidadKg) {
          throw new Error("No hay suficiente alimento disponible en el silo de origen para completar la transferencia.");
        }

        // 3️⃣ Descontar FIFO lote por lote
        for (const lote of lotesValidos) {
          if (restante <= 0) break;
          const aDescontar = Math.min(restante, lote.CantidadDisponibleKg);

          await fetchFromDynamicApi({
            metodo: "LotesAlimento",
            tipo: "tabla",
            operacion: "actualizar",
            data: {
              LoteID: lote.LoteID,
              CantidadDisponibleKg: lote.CantidadDisponibleKg - aDescontar,
            },
          });

          restante -= aDescontar;
        }

        // 4️⃣ Insertar lote en silo destino
        await fetchFromDynamicApi({
          metodo: "LotesAlimento",
          tipo: "tabla",
          operacion: "insertar",
          data: {
            SiloID: transferencia.SiloDestinoID,
            TipoAlimento: transferencia.TipoAlimento,
            FechaEntrada: new Date(),
            CantidadInicialKg: transferencia.CantidadKg,
            CantidadDisponibleKg: transferencia.CantidadKg,
            Origen: "Transferencia",
            TransferenciaID: nuevaTransferencia.TransferenciaID,
            Observaciones: nuevaTransferencia.Observaciones ?? transferencia.Observaciones ?? "",
          },
        });
      }

      // Actualizar estado de transferencias
      setTransferencias(listaTransferencias);

    } catch (err: any) {
      throw new Error(err.message || "No se pudo guardar la transferencia");
    }
  };

  // Eliminar transferencia
  const deleteTransferencia = async (TransferenciaID: number) => {
    try {
      await fetchFromDynamicApi({
        metodo: "ALVEZH_Transferencia",
        tipo: "tabla",
        operacion: "eliminar",
        data: { TransferenciaID },
      });
      await loadTransferencias();
    } catch (err: any) {
      throw new Error(err.message || "No se pudo eliminar la transferencia");
    }
  };

  useEffect(() => {
    loadTransferencias();
  }, []);

  return {
    transferencias,
    loading,
    error,
    getLoteDefault,
    reload: loadTransferencias,
    saveTransferencia,
    deleteTransferencia,
    
  };
}
