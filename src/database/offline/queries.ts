import { dbManager } from "./db"
import type { ProduccionData, AlimentoData, ExistenciaData, EnvaseData } from "./types"

export class DatabaseQueries {
  // PRODUCCIÓN
  static async insertProduccion(data: ProduccionData): Promise<void> {
    const db = dbManager.getDatabase()
    const query = `
      INSERT OR REPLACE INTO produccion (
        caseta, fecha, blanco_cajas, blanco_restos, roto1_cajas, roto1_restos,
        roto2_cajas, roto2_restos, manchado_cajas, manchado_restos,
        fragil1_cajas, fragil1_restos, fragil2_cajas, fragil2_restos,
        yema_cajas, yema_restos, b1_cajas, b1_restos, extra240_cajas, extra240_restos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await db.runAsync(query, [
      data.caseta,
      data.fecha,
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
  }

  static async getProduccionByFecha(fecha: string): Promise<ProduccionData[]> {
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM produccion WHERE fecha = ? ORDER BY caseta"
    const result = await db.getAllAsync(query, [fecha])
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
    const db = dbManager.getDatabase()
    const query = `
      INSERT OR REPLACE INTO alimento (
        caseta, fecha, existencia_inicial, entrada, consumo, tipo, edad
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    await db.runAsync(query, [
      data.caseta,
      data.fecha,
      data.existencia_inicial,
      data.entrada,
      data.consumo,
      data.tipo,
      data.edad,
    ])
  }

  static async getAlimentoByFecha(fecha: string): Promise<AlimentoData[]> {
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM alimento WHERE fecha = ? ORDER BY caseta"
    const result = await db.getAllAsync(query, [fecha])
    return result as AlimentoData[]
  }

  // EXISTENCIA
  static async insertExistencia(data: ExistenciaData): Promise<void> {
    const db = dbManager.getDatabase()
    const query = `
      INSERT OR REPLACE INTO existencia (
        caseta, fecha, inicial, entrada, mortalidad, salida, final
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    await db.runAsync(query, [
      data.caseta,
      data.fecha,
      data.inicial,
      data.entrada,
      data.mortalidad,
      data.salida,
      data.final,
    ])
  }

  static async getExistenciaByFecha(fecha: string): Promise<ExistenciaData[]> {
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM existencia WHERE fecha = ? ORDER BY caseta"
    const result = await db.getAllAsync(query, [fecha])
    return result as ExistenciaData[]
  }

  // ENVASE
  static async insertEnvase(data: EnvaseData): Promise<void> {
    const db = dbManager.getDatabase()
    const query = `
      INSERT OR REPLACE INTO envase (
        caseta, fecha, tipo, inicial, recibido, consumo, final
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    await db.runAsync(query, [
      data.caseta,
      data.fecha,
      data.tipo,
      data.inicial,
      data.recibido,
      data.consumo,
      data.final,
    ])
  }

  static async getEnvaseByFecha(fecha: string): Promise<EnvaseData[]> {
    const db = dbManager.getDatabase()
    const query = "SELECT * FROM envase WHERE fecha = ? ORDER BY caseta"
    const result = await db.getAllAsync(query, [fecha])
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
