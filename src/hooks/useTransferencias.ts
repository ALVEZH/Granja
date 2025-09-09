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
  Estatus: string;
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

  // Agregar o actualizar transferencia
  // Insertar o actualizar la transferencia
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
      Estatus: transferencia.Estatus,
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

// Recargar transferencias y guardar en una variable local
const listaTransferencias = await fetchFromDynamicApi({
  metodo: "ALVEZH_Transferencia",
  tipo: "tabla",
  operacion: "consultar",
  data: {},
});

// Buscar la transferencia recién insertada
// Aquí asumimos que es la que tiene los mismos campos únicos que enviaste
const nuevaTransferencia = listaTransferencias.find((t: Transferencia) =>
  t.GranjaOrigenID === transferencia.GranjaOrigenID &&
  t.SiloOrigenID === transferencia.SiloOrigenID &&
  t.GranjaDestinoID === transferencia.GranjaDestinoID &&
  t.SiloDestinoID === transferencia.SiloDestinoID &&
  t.CantidadKg === transferencia.CantidadKg &&
  t.TipoAlimento === transferencia.TipoAlimento
);

if (nuevaTransferencia) {
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

// Finalmente actualizar el estado de transferencias
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
    reload: loadTransferencias,
    saveTransferencia,
    deleteTransferencia,
  };
}
