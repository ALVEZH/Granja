// src/hooks/useLotes.ts
import { useState, useEffect } from "react";
import { fetchFromDynamicApi } from "../services/dinamicApi";

export interface Lote {
  LoteID: number;
  SiloID: number;
  TipoAlimento: string;
  FechaEntrada: string;
  CantidadInicialKg: number;
  CantidadDisponibleKg: number;
  Origen: string;
  TransferenciaID?: number;
  Observaciones?: string;
}

export function useLotes() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLotes = async () => {
    try {
      setLoading(true);
      const data = await fetchFromDynamicApi({
        metodo: "LotesAlimento",
        tipo: "tabla",
        operacion: "consultar",
        data: {},
      });
      setLotes(data);
    } catch (err: any) {
      setError(err.message || "Error cargando lotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLotes();
  }, []);

  return { lotes, loading, error, reload: loadLotes };
}
