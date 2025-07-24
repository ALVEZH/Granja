import { dbManager } from "./db"
import type { ProduccionData, AlimentoData, ExistenciaData, EnvaseData } from "./types"

export class DatabaseQueries {
  // PRODUCCIÓN
  static async insertProduccion(data: ProduccionData): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para insertProduccion:", e);
      return;
    }
    // Buscar si ya existe un registro para la caseta, fecha y granja
    const selectQuery = `SELECT * FROM produccion WHERE caseta = ? AND fecha = ? AND granja_id = ?`;
    const existing = await db.getFirstAsync(selectQuery, [data.caseta, data.fecha, data.granja_id]);
    let newData = { ...data };
    if (existing) {
      // Sumar los valores nuevos a los existentes
      newData = {
        ...data,
        blanco_cajas: (existing.blanco_cajas || 0) + (data.blanco_cajas || 0),
        blanco_restos: (existing.blanco_restos || 0) + (data.blanco_restos || 0),
        roto1_cajas: (existing.roto1_cajas || 0) + (data.roto1_cajas || 0),
        roto1_restos: (existing.roto1_restos || 0) + (data.roto1_restos || 0),
        roto2_cajas: (existing.roto2_cajas || 0) + (data.roto2_cajas || 0),
        roto2_restos: (existing.roto2_restos || 0) + (data.roto2_restos || 0),
        manchado_cajas: (existing.manchado_cajas || 0) + (data.manchado_cajas || 0),
        manchado_restos: (existing.manchado_restos || 0) + (data.manchado_restos || 0),
        fragil1_cajas: (existing.fragil1_cajas || 0) + (data.fragil1_cajas || 0),
        fragil1_restos: (existing.fragil1_restos || 0) + (data.fragil1_restos || 0),
        fragil2_cajas: (existing.fragil2_cajas || 0) + (data.fragil2_cajas || 0),
        fragil2_restos: (existing.fragil2_restos || 0) + (data.fragil2_restos || 0),
        yema_cajas: (existing.yema_cajas || 0) + (data.yema_cajas || 0),
        yema_restos: (existing.yema_restos || 0) + (data.yema_restos || 0),
        b1_cajas: (existing.b1_cajas || 0) + (data.b1_cajas || 0),
        b1_restos: (existing.b1_restos || 0) + (data.b1_restos || 0),
        extra240_cajas: (existing.extra240_cajas || 0) + (data.extra240_cajas || 0),
        extra240_restos: (existing.extra240_restos || 0) + (data.extra240_restos || 0),
      };
    }
    const query = `
      INSERT OR REPLACE INTO produccion (
        caseta, fecha, granja_id, blanco_cajas, blanco_restos, roto1_cajas, roto1_restos,
        roto2_cajas, roto2_restos, manchado_cajas, manchado_restos,
        fragil1_cajas, fragil1_restos, fragil2_cajas, fragil2_restos,
        yema_cajas, yema_restos, b1_cajas, b1_restos, extra240_cajas, extra240_restos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    try {
      await db.runAsync(query, [
        data.caseta,
        data.fecha,
        data.granja_id,
        newData.blanco_cajas,
        newData.blanco_restos,
        newData.roto1_cajas,
        newData.roto1_restos,
        newData.roto2_cajas,
        newData.roto2_restos,
        newData.manchado_cajas,
        newData.manchado_restos,
        newData.fragil1_cajas,
        newData.fragil1_restos,
        newData.fragil2_cajas,
        newData.fragil2_restos,
        newData.yema_cajas,
        newData.yema_restos,
        newData.b1_cajas,
        newData.b1_restos,
        newData.extra240_cajas,
        newData.extra240_restos,
      ])
    } catch (error) {
      console.error("Error al guardar producción:", error);
    }
  }

  static async getProduccionByFecha(fecha: string, granja_id: number): Promise<ProduccionData[]> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para getProduccionByFecha:", e);
      return [];
    }
    try {
      const query = "SELECT * FROM produccion WHERE fecha = ? AND granja_id = ? ORDER BY caseta"
      const result = await db.getAllAsync(query, [fecha, granja_id])
      return result as ProduccionData[]
    } catch (error) {
      console.error("Error al obtener producción por fecha:", error);
      return [];
    }
  }

  static async getAllProduccion(): Promise<ProduccionData[]> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para getAllProduccion:", e);
      return [];
    }
    try {
      const query = "SELECT * FROM produccion ORDER BY fecha DESC, caseta"
      const result = await db.getAllAsync(query)
      return result as ProduccionData[]
    } catch (error) {
      console.error("Error al obtener toda la producción:", error);
      return [];
    }
  }

  static async deleteProduccionByFecha(fecha: string, granja_id: number): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para deleteProduccionByFecha:", e);
      return;
    }
    try {
      const query = "DELETE FROM produccion WHERE fecha = ? AND granja_id = ?"
      await db.runAsync(query, [fecha, granja_id])
    } catch (error) {
      console.error("Error al eliminar producción por fecha:", error);
    }
  }

  // ALIMENTO
  static async insertAlimento(data: AlimentoData): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para insertAlimento:", e);
      return;
    }
    // Buscar si ya existe un registro para la caseta, fecha y granja
    const selectQuery = `SELECT * FROM alimento WHERE caseta = ? AND fecha = ? AND granja_id = ?`;
    const existing = await db.getFirstAsync(selectQuery, [data.caseta, data.fecha, data.granja_id]);
    let newData = { ...data };
    if (existing) {
      // Sumar los valores nuevos a los existentes
      newData = {
        ...data,
        existencia_inicial: (existing.existencia_inicial || 0) + (data.existencia_inicial || 0),
        entrada: (existing.entrada || 0) + (data.entrada || 0),
        consumo: (existing.consumo || 0) + (data.consumo || 0),
      };
    }
    try {
      // Verificar que la tabla existe
      const tableCheck = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='alimento'");
      if (!tableCheck || tableCheck.length === 0) {
        console.error("insertAlimento: La tabla 'alimento' no existe");
        return;
      }
      const query = `
        INSERT OR REPLACE INTO alimento (
          caseta, fecha, granja_id, existencia_inicial, entrada, consumo, tipo, edad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const valores = [
        data.caseta || '',
        data.fecha || '',
        data.granja_id || 0,
        newData.existencia_inicial || 0,
        newData.entrada || 0,
        newData.consumo || 0,
        data.tipo || '',
        data.edad || '',
      ];
      await db.runAsync(query, valores);
      console.log("insertAlimento: Datos insertados correctamente");
    } catch (error) {
      console.error("Error al guardar alimento:", error);
      console.error("Datos que causaron el error:", data);
    }
  }

  static async getAlimentoByFecha(fecha: string, granja_id: number): Promise<AlimentoData[]> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para getAlimentoByFecha:", e);
      return [];
    }
    
    // Validar parámetros
    if (!fecha || typeof fecha !== 'string') {
      console.error("getAlimentoByFecha: fecha inválida:", fecha);
      return [];
    }
    
    if (granja_id === null || granja_id === undefined || isNaN(granja_id)) {
      console.error("getAlimentoByFecha: granja_id inválido:", granja_id);
      return [];
    }
    
    try {
      // Verificar que la tabla existe
      const tableCheck = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='alimento'");
      if (!tableCheck || tableCheck.length === 0) {
        console.error("getAlimentoByFecha: La tabla 'alimento' no existe");
        return [];
      }
      
      // Consulta con validación adicional
      const query = "SELECT * FROM alimento WHERE fecha = ? AND granja_id = ? ORDER BY caseta";
      console.log("getAlimentoByFecha: Ejecutando query con fecha:", fecha, "granja_id:", granja_id);
      
      const result = await db.getAllAsync(query, [fecha, granja_id]);
      
      // Validar resultado
      if (!result || !Array.isArray(result)) {
        console.log("getAlimentoByFecha: Resultado inválido, retornando array vacío");
        return [];
      }
      
      console.log("getAlimentoByFecha: Encontrados", result.length, "registros");
      return result as AlimentoData[];
      
    } catch (error) {
      console.error("Error al obtener alimento por fecha:", error);
      console.error("Parámetros - fecha:", fecha, "granja_id:", granja_id);
      return [];
    }
  }

  static async deleteAlimentoByFecha(fecha: string, granja_id: number): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para deleteAlimentoByFecha:", e);
      return;
    }
    try {
      const query = "DELETE FROM alimento WHERE fecha = ? AND granja_id = ?"
      await db.runAsync(query, [fecha, granja_id])
    } catch (error) {
      console.error("Error al eliminar alimento por fecha:", error);
    }
  }

  // EXISTENCIA
  static async insertExistencia(data: ExistenciaData): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para insertExistencia:", e);
      return;
    }
    // Buscar si ya existe un registro para la caseta, fecha y granja
    const selectQuery = `SELECT * FROM existencia WHERE caseta = ? AND fecha = ? AND granja_id = ?`;
    const existing = await db.getFirstAsync(selectQuery, [data.caseta, data.fecha, data.granja_id]);
    let newData = { ...data };
    if (existing) {
      newData = {
        ...data,
        inicial: (existing.inicial || 0) + (data.inicial || 0),
        entrada: (existing.entrada || 0) + (data.entrada || 0),
        mortalidad: (existing.mortalidad || 0) + (data.mortalidad || 0),
        salida: (existing.salida || 0) + (data.salida || 0),
        edad: (existing.edad || 0) + (data.edad || 0),
        // Calcula el final acumulado
        final: ((existing.inicial || 0) + (data.inicial || 0)) + ((existing.entrada || 0) + (data.entrada || 0)) - ((existing.mortalidad || 0) + (data.mortalidad || 0)) - ((existing.salida || 0) + (data.salida || 0)),
      };
    } else {
      // Calcula el final para el primer registro
      newData.final = (data.inicial || 0) + (data.entrada || 0) - (data.mortalidad || 0) - (data.salida || 0);
    }
    const query = `
      INSERT OR REPLACE INTO existencia (
        caseta, fecha, granja_id, inicial, entrada, mortalidad, salida, edad, final
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    try {
      await db.runAsync(query, [
        data.caseta,
        data.fecha,
        data.granja_id,
        newData.inicial,
        newData.entrada,
        newData.mortalidad,
        newData.salida,
        newData.edad,
        newData.final,
      ])
    } catch (error) {
      console.error("Error al guardar existencia:", error);
      throw error;
    }
  }

  static async getExistenciaByFecha(fecha: string, granja_id: number): Promise<ExistenciaData[]> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para getExistenciaByFecha:", e);
      return [];
    }
    try {
      const query = "SELECT * FROM existencia WHERE fecha = ? AND granja_id = ? ORDER BY caseta"
      const result = await db.getAllAsync(query, [fecha, granja_id])
      return result as ExistenciaData[]
    } catch (error) {
      console.error("Error al obtener existencia por fecha:", error);
      return [];
    }
  }

  static async deleteExistenciaByFecha(fecha: string, granja_id: number): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para deleteExistenciaByFecha:", e);
      return;
    }
    try {
      const query = "DELETE FROM existencia WHERE fecha = ? AND granja_id = ?";
      await db.runAsync(query, [fecha, granja_id]);
    } catch (error) {
      console.error("Error al eliminar existencia por fecha:", error);
    }
  }

  // ENVASE
  static async insertEnvase(data: EnvaseData): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para insertEnvase:", e);
      return;
    }
    // Buscar si ya existe un registro para el envase, fecha y granja
    const selectQuery = `SELECT * FROM envase WHERE caseta = ? AND fecha = ? AND granja_id = ? AND tipo = ?`;
    const existing = await db.getFirstAsync(selectQuery, [data.caseta, data.fecha, data.granja_id, data.tipo]);
    let newData = { ...data };
    if (existing) {
      newData = {
        ...data,
        inicial: (existing.inicial || 0) + (data.inicial || 0),
        recibido: (existing.recibido || 0) + (data.recibido || 0),
        consumo: (existing.consumo || 0) + (data.consumo || 0),
        // Calcula el final acumulado
        final: ((existing.inicial || 0) + (data.inicial || 0)) + ((existing.recibido || 0) + (data.recibido || 0)) - ((existing.consumo || 0) + (data.consumo || 0)),
      };
    } else {
      // Calcula el final para el primer registro
      newData.final = (data.inicial || 0) + (data.recibido || 0) - (data.consumo || 0);
    }
    const query = `
      INSERT OR REPLACE INTO envase (
        caseta, fecha, granja_id, tipo, inicial, recibido, consumo, final
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    try {
      await db.runAsync(query, [
        data.caseta,
        data.fecha,
        data.granja_id,
        data.tipo,
        newData.inicial,
        newData.recibido,
        newData.consumo,
        newData.final,
      ])
    } catch (error) {
      console.error("Error al guardar envase:", error);
    }
  }

  static async getEnvaseByFecha(fecha: string, granja_id: number): Promise<EnvaseData[]> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para getEnvaseByFecha:", e);
      return [];
    }
    try {
      const query = "SELECT * FROM envase WHERE fecha = ? AND granja_id = ? ORDER BY caseta"
      const result = await db.getAllAsync(query, [fecha, granja_id])
      return result as EnvaseData[]
    } catch (error) {
      console.error("Error al obtener envase por fecha:", error);
      return [];
    }
  }

  static async deleteEnvaseByFecha(fecha: string, granja_id: number): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para deleteEnvaseByFecha:", e);
      return;
    }
    try {
      const query = "DELETE FROM envase WHERE fecha = ? AND granja_id = ?";
      await db.runAsync(query, [fecha, granja_id]);
    } catch (error) {
      console.error("Error al eliminar envase por fecha:", error);
    }
  }

  // UTILIDADES
  static async clearAllData(): Promise<void> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para clearAllData:", e);
      return;
    }
    try {
      await db.runAsync("DELETE FROM produccion")
      await db.runAsync("DELETE FROM alimento")
      await db.runAsync("DELETE FROM existencia")
      await db.runAsync("DELETE FROM envase")
    } catch (error) {
      console.error("Error al limpiar datos:", error);
    }
  }

  static async getFechasDisponibles(): Promise<string[]> {
    let db: any;
    try {
      db = dbManager.getDatabase();
    } catch (e) {
      console.error("No se pudo obtener la base de datos para getFechasDisponibles:", e);
      return [];
    }
    try {
      const query = `
        SELECT DISTINCT fecha FROM (
          SELECT fecha FROM produccion
          UNION
          SELECT fecha FROM alimento
          UNION
          SELECT fecha FROM existencia
          UNION
          SELECT fecha FROM envase
        ) ORDER BY fecha DESC
      `
      const result = await db.getAllAsync(query)
      return result.map((row: any) => row.fecha)
    } catch (error) {
      console.error("Error al obtener fechas disponibles:", error);
      return [];
    }
  }
}
