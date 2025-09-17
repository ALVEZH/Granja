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
  usarAdmin?: boolean;  // true para usar usrBDpostura, false para usrAPPpostura
};

export const fetchFromDynamicApi = async ({
  metodo,
  tipo = 'tabla',
  operacion = 'consultar',
  data = null,
  usarAdmin = false
}: FetchParams): Promise<any> => {
  // Usar las credenciales correctas según las credenciales proporcionadas
  const credenciales = usarAdmin ? {
    user: "usrBDpostura",
    password: "USR45_bd@qa",
    server: "94.130.131.16",
    database: "ALZEposturaD"
  } : {
    user: "usrAPPpostura",
    password: "USR78_pp@qa",
    server: "94.130.131.16",
    database: "ALZEposturaD"
  };

  const payload: any = {
    conexion: credenciales,
    dbName: "ALZEposturaD",
    metodo,
    tipo,
    operacion
  };

  if (data !== null) {
    payload.data = data;
  }

  console.log('🌐 Enviando a API:', {
    url: 'http://192.168.5.103:3000/dynamic/execute',
    payload: payload
  });

  const response = await fetch('http://192.168.5.103:3000/dynamic/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  /* console.log('📥 Respuesta API:', response.status, response.statusText); */

  if (!response.ok) {
    const text = await response.text();
    console.error('❌ Error API:', text);
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const result = await response.json();
  /* console.log('✅ Resultado API:', result); */
  
  return result.resultado || result;
};
