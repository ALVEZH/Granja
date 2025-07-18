// src/api/dynamicApi.ts

type ConexionParams = {
  user: string;
  password: string;
  server: string;
  database: string;
};

type FetchParams = {
  metodo: string;
  tipo?: string;        // 'tabla', 'vista', 'procedimiento', etc.
  operacion?: string;   // 'consultar', 'insertar', etc.
  data?: any;           // Puede ser objeto o array, según el uso
};

export const fetchFromDynamicApi = async ({
  metodo,
  tipo = 'tabla',
  operacion = 'consultar',
  data = null
}: FetchParams): Promise<any> => {
  const payload: any = {
    conexion: {
      user: "usrAPPpostura",
      password: "USR78_pp@qa",
      server: "94.130.131.16",
      database: "ALZEposturaD"
    },
    dbName: "ALZEposturaD",
    metodo,
    tipo,
    operacion
  };

  if (data !== null) {
    payload.data = data;
  }

  const response = await fetch('http://apibd.uaalze.com/dynamic/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const { resultado } = await response.json();
  return resultado;
};
