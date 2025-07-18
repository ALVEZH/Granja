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
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM produccion WHERE fecha = ? AND granja_id = ? ORDER BY caseta"
    const result = await db.getAllAsync(query, [fecha, granja_id])
    return result as ProduccionData[]
  }

  static async getAllProduccion(): Promise<ProduccionData[]> {
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM produccion ORDER BY fecha DESC, caseta"
    const result = await db.getAllAsync(query)
    return result as ProduccionData[]
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
    const query = `
      INSERT OR REPLACE INTO alimento (
        caseta, fecha, granja_id, existencia_inicial, entrada, consumo, tipo, edad
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    try {
      await db.runAsync(query, [
        data.caseta,
        data.fecha,
        data.granja_id,
        data.existencia_inicial,
        data.entrada,
        data.consumo,
        data.tipo,
        data.edad,
      ])
    } catch (error) {
      console.error("Error al guardar alimento:", error);
    }
  }

  static async getAlimentoByFecha(fecha: string, granja_id: number): Promise<AlimentoData[]> {
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM alimento WHERE fecha = ? AND granja_id = ? ORDER BY caseta"
    const result = await db.getAllAsync(query, [fecha, granja_id])
    return result as AlimentoData[]
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
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM existencia WHERE fecha = ? AND granja_id = ? ORDER BY caseta"
    const result = await db.getAllAsync(query, [fecha, granja_id])
    return result as ExistenciaData[]
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
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM envase WHERE fecha = ? AND granja_id = ? ORDER BY caseta"
    const result = await db.getAllAsync(query, [fecha, granja_id])
    return result as EnvaseData[]
  }

  // UTILIDADES
  static async clearAllData(): Promise<void> {
    const db = dbManager.getDatabase()
    await db.runAsync("DELETE FROM produccion")
    await db.runAsync("DELETE FROM alimento")
    await db.runAsync("DELETE FROM existencia")
    await db.runAsync("DELETE FROM envase")
  }

  static async getFechasDisponibles(): Promise<string[]> {
    const db = dbManager.getDatabase()
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
  }
}
