import { useEffect, useState } from 'react';
import { fetchFromDynamicApi } from '../services/dinamicApi';

export interface Granja {
  GranjaID: number;
  Nombre: string;
  Ubicacion_latitud: string;
  Ubicacion_longitud: string;
  CreadoPor: number;
  FechaCreacion: string | null;
}

export function useGranjas() {
  const [granjas, setGranjas] = useState<Granja[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchFromDynamicApi({
      metodo: 'ALVEZH_Granjas',
      tipo: 'tabla',
      operacion: 'consultar',
    })
      .then((data) => setGranjas(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { granjas, loading, error };
} 