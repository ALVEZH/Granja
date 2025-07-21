// src/util/alimentosApi.ts
// Endpoint específico para ALVEZH_ALIMENTOS_ sin usar API dinámico

type AlimentoData = {
  GranjaID: number;
  CasetaID: number;
  Fecha: string;
  ExistenciaInicial: number;
  Entrada: number;
  Consumo: number;
  Tipo: string;
};

export const alimentosApi = {
  // Endpoint específico para insertar alimentos
  async insertarAlimento(data: AlimentoData): Promise<any> {
    const payload = {
      conexion: {
        user: "usrAPPpostura",
        password: "USR78_pp@qa",
        server: "94.130.131.16",
        database: "ALZEposturaD"
      },
      operacion: "insertar_alimento",
      data: data
    };

    console.log('🌐 Enviando a endpoint específico de alimentos:', payload);

    try {
      const response = await fetch('http://apibd.uaalze.com/alimentos/insertar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📥 Respuesta endpoint alimentos:', response.status, response.statusText);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Error endpoint alimentos:', text);
        throw new Error(`Endpoint error ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log('✅ Resultado endpoint alimentos:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error en endpoint alimentos:', error);
      throw error;
    }
  },

  // Endpoint específico para consultar alimentos
  async consultarAlimentos(granjaId: number, fecha: string): Promise<any> {
    const payload = {
      conexion: {
        user: "usrAPPpostura",
        password: "USR78_pp@qa",
        server: "94.130.131.16",
        database: "ALZEposturaD"
      },
      operacion: "consultar_alimentos",
      data: {
        GranjaID: granjaId,
        Fecha: fecha
      }
    };

    console.log('🌐 Consultando alimentos:', payload);

    try {
      const response = await fetch('http://apibd.uaalze.com/alimentos/consultar', {
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
      console.error('❌ Error consultando alimentos:', error);
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
      operacion: "verificar_tabla_alimentos"
    };

    console.log('🔍 Verificando tabla ALVEZH_ALIMENTOS_...');

    try {
      const response = await fetch('http://apibd.uaalze.com/alimentos/verificar', {
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