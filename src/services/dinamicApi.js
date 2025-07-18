// src/api/dynamicApi.js

export const fetchFromDynamicApi = async ({
  metodo,
  tipo = 'tabla',
  operacion = 'consultar',
  data = null    // ← añadimos este parámetro
}) => {
  // Montamos el body siempre con conexion, dbName, metodo, tipo y operacion...
  const payload = {
    conexion: {
      user: "usuariobd",
      password: "Alv3z.DBusr2001",
      server: "94.130.131.16",
      database: "ALZEPROD"
    },
    dbName: "ALZEPROD",
    metodo,
    tipo,
    operacion
  };

  // …y si nos pasaron un objeto o un array en `data`, lo inyectamos:
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

