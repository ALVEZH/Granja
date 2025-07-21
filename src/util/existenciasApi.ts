// src/util/existenciasApi.ts
// Endpoint específico para ALVEZH_Existencia sin usar API dinámico

type ExistenciaData = {
  GranjaID: number;
  CasetaID: number;
  Fecha: string;
  ExistenciaInicial: number;
  Entrada: number;
  Mortalidad: number;
  Salida: number;
  Edad: number;
  ExistenciaFinal: number;
  CreadoPor?: string;
};

export const syncExistencia = async (existencia: ExistenciaData) => {
  const payload = {
    conexion: {
      user: "usrAPPpostura",
      password: "USR78_pp@qa",
      server: "94.130.131.16",
      database: "ALZEposturaD"
    },
    dbName: "ALZEposturaD",
    metodo: "ALVEZH_Existencia",
    tipo: "tabla",
    operacion: "insertar",
    data: existencia
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

export const existenciasApi = {
  // Endpoint específico para insertar existencias
  async insertarExistencia(data: ExistenciaData): Promise<any> {
    const payload = {
      conexion: {
        user: "usrAPPpostura",
        password: "USR78_pp@qa",
        server: "94.130.131.16",
        database: "ALZEposturaD"
      },
      operacion: "insertar_existencia",
      data: data
    };

    console.log('🌐 Enviando a endpoint específico de existencias:', payload);

    try {
      const response = await fetch('http://apibd.uaalze.com/existencias/insertar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📥 Respuesta endpoint existencias:', response.status, response.statusText);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Error endpoint existencias:', text);
        throw new Error(`Endpoint error ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log('✅ Resultado endpoint existencias:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error en endpoint existencias:', error);
      throw error;
    }
  },

  // Endpoint específico para consultar existencias
  async consultarExistencias(granjaId: number, fecha: string): Promise<any> {
    const payload = {
      conexion: {
        user: "usrAPPpostura",
        password: "USR78_pp@qa",
        server: "94.130.131.16",
        database: "ALZEposturaD"
      },
      operacion: "consultar_existencias",
      data: {
        GranjaID: granjaId,
        Fecha: fecha
      }
    };

    console.log('🌐 Consultando existencias:', payload);

    try {
      const response = await fetch('http://apibd.uaalze.com/existencias/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Consulta error ${response.status}: ${text}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error consultando existencias:', error);
      throw error;
    }
  },

  // Endpoint para verificar si la tabla existe
  async verificarTabla(): Promise<any> {
    const payload = {
      conexion: {
        user: "usrAPPpostura",
        password: "USR78_pp@qa",
        server: "94.130.131.16",
        database: "ALZEposturaD"
      },
      operacion: "verificar_tabla_existencias"
    };

    console.log('🔍 Verificando tabla ALVEZH_Existencia...');

    try {
      const response = await fetch('http://apibd.uaalze.com/existencias/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📥 Respuesta verificación:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Error verificación:', text);
        return { existe: false, error: text };
      }

      const result = await response.json();
      console.log('✅ Resultado verificación:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error en verificación:', error);
      return { existe: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}; 