type EnvaseData = {
  GranjaID: number;
  Fecha: string;
  TipoEnvase: string;
  ExistenciaInicial: number;
  Recibido: number;
  Consumo: number;
  ExistenciaFinal: number;
  CreadoPor?: string;
};

export const syncEnvase = async (envase: EnvaseData) => {
  const payload = {
    conexion: {
      user: "usrAPPpostura",
      password: "USR78_pp@qa",
      server: "94.130.131.16",
      database: "ALZEposturaD"
    },
    dbName: "ALZEposturaD",
    metodo: "ALVEZH_Envase",
    tipo: "tabla",
    operacion: "insertar",
    data: envase
  };

  const response = await fetch('http://apibd.uaalze.com/dynamic/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const result = await response.json();
  return result;
}; 