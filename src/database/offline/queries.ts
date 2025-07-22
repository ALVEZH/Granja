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
        data.blanco_cajas,
        data.blanco_restos,
        data.roto1_cajas,
        data.roto1_restos,
        data.roto2_cajas,
        data.roto2_restos,
        data.manchado_cajas,
        data.manchado_restos,
        data.fragil1_cajas,
        data.fragil1_restos,
        data.fragil2_cajas,
        data.fragil2_restos,
        data.yema_cajas,
        data.yema_restos,
        data.b1_cajas,
        data.b1_restos,
        data.extra240_cajas,
        data.extra240_restos,
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
    
    // Validar datos de entrada
    if (!data) {
      console.error("insertAlimento: datos nulos o indefinidos");
      return;
    }
    
    if (!data.caseta || typeof data.caseta !== 'string') {
      console.error("insertAlimento: caseta inválida:", data.caseta);
      return;
    }
    
    if (!data.fecha || typeof data.fecha !== 'string') {
      console.error("insertAlimento: fecha inválida:", data.fecha);
      return;
    }
    
    if (data.granja_id === null || data.granja_id === undefined || isNaN(data.granja_id)) {
      console.error("insertAlimento: granja_id inválido:", data.granja_id);
      return;
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
      
      // Preparar valores con validación
      const valores = [
        data.caseta || '',
        data.fecha || '',
        data.granja_id || 0,
        data.existencia_inicial || 0,
        data.entrada || 0,
        data.consumo || 0,
        data.tipo || '',
        data.edad || '',
      ];
      
      console.log("insertAlimento: Insertando datos:", {
        caseta: data.caseta,
        fecha: data.fecha,
        granja_id: data.granja_id,
        existencia_inicial: data.existencia_inicial,
        entrada: data.entrada,
        consumo: data.consumo,
        tipo: data.tipo,
        edad: data.edad
      });
      
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
        data.inicial,
        data.entrada,
        data.mortalidad,
        data.salida,
        data.edad,
        data.final,
      ])
    } catch (error) {
      console.error("Error al guardar existencia:", error);
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
        data.inicial,
        data.recibido,
        data.consumo,
        data.final,
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
