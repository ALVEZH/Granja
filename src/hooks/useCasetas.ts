import { useEffect, useState } from 'react';
import { fetchFromDynamicApi } from '../services/dinamicApi';

export interface Caseta {
  CasetaID: number;
  Nombre: string;
  GranjaID: number;
  // Agrega aquí otros campos si los hay
}

export function useCasetas(granjaId: number | null) {
  const [casetas, setCasetas] = useState<Caseta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (granjaId == null) return;
    setLoading(true);
    fetchFromDynamicApi({
      metodo: 'ALVEZH_Casetas',
      tipo: 'tabla',
      operacion: 'consultar',
      data: { where: { GranjaID: granjaId } },
    })
      .then((data) => setCasetas(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [granjaId]);

  return { casetas, loading, error };
} 