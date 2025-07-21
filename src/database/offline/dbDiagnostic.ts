// Archivo de diagnóstico para la base de datos SQLite
// Para identificar y resolver problemas de base de datos

import { dbManager } from "./db"
import { DatabaseQueries } from "./queries"

export class DatabaseDiagnostic {
  
  // Diagnóstico completo de la base de datos
  static async fullDiagnostic(): Promise<void> {
    console.log("🔍 INICIANDO DIAGNÓSTICO COMPLETO DE BASE DE DATOS")
    
    try {
      // 1. Verificar inicialización
      console.log("1️⃣ Verificando inicialización...")
      await this.checkInitialization()
      
      // 2. Verificar tablas
      console.log("2️⃣ Verificando tablas...")
      await this.checkTables()
      
      // 3. Verificar tabla alimento específicamente
      console.log("3️⃣ Verificando tabla alimento...")
      await this.checkAlimentoTable()
      
      // 4. Verificar datos
      console.log("4️⃣ Verificando datos...")
      await this.checkData()
      
      // 5. Verificar consultas
      console.log("5️⃣ Verificando consultas...")
      await this.checkQueries()
      
      console.log("✅ DIAGNÓSTICO COMPLETADO")
      
    } catch (error) {
      console.error("❌ Error en diagnóstico completo:", error)
    }
  }
  
  // Verificar inicialización
  static async checkInitialization(): Promise<void> {
    try {
      await dbManager.init()
      console.log("✅ Base de datos inicializada correctamente")
    } catch (error) {
      console.error("❌ Error en inicialización:", error)
      throw error
    }
  }
  
  // Verificar tablas
  static async checkTables(): Promise<void> {
    try {
      const db = dbManager.getDatabase()
      const tables = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'")
      console.log("📋 Tablas encontradas:", tables.map((t: any) => t.name))
      
      const expectedTables = ['produccion', 'alimento', 'existencia', 'envase']
      for (const expectedTable of expectedTables) {
        const exists = tables.some((t: any) => t.name === expectedTable)
        console.log(`${exists ? '✅' : '❌'} Tabla ${expectedTable}: ${exists ? 'EXISTE' : 'NO EXISTE'}`)
      }
      
    } catch (error) {
      console.error("❌ Error verificando tablas:", error)
      throw error
    }
  }
  
  // Verificar tabla alimento específicamente
  static async checkAlimentoTable(): Promise<void> {
    try {
      const db = dbManager.getDatabase()
      
      // Verificar si la tabla existe
      const tableExists = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='alimento'")
      if (!tableExists || tableExists.length === 0) {
        console.log("❌ Tabla 'alimento' no existe")
        console.log("🔧 Creando tabla alimento...")
        await this.createAlimentoTable()
        return
      }
      
      console.log("✅ Tabla 'alimento' existe")
      
      // Verificar estructura
      const columns = await db.getAllAsync("PRAGMA table_info(alimento)")
      console.log("📋 Columnas de tabla alimento:", columns.map((c: any) => c.name))
      
      // Verificar datos
      const count = await db.getFirstAsync("SELECT COUNT(*) as count FROM alimento")
      console.log("📊 Total de registros en alimento:", (count as any)?.count || 0)
      
    } catch (error) {
      console.error("❌ Error verificando tabla alimento:", error)
      throw error
    }
  }
  
  // Crear tabla alimento si no existe
  static async createAlimentoTable(): Promise<void> {
    try {
      const db = dbManager.getDatabase()
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS alimento (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          caseta TEXT NOT NULL,
          fecha TEXT NOT NULL,
          granja_id INTEGER NOT NULL,
          existencia_inicial REAL DEFAULT 0,
          entrada REAL DEFAULT 0,
          consumo REAL DEFAULT 0,
          tipo TEXT DEFAULT '',
          edad TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(caseta, fecha, granja_id)
        )
      `
      
      await db.execAsync(createTableSQL)
      console.log("✅ Tabla 'alimento' creada correctamente")
      
    } catch (error) {
      console.error("❌ Error creando tabla alimento:", error)
      throw error
    }
  }
  
  // Verificar datos
  static async checkData(): Promise<void> {
    try {
      const db = dbManager.getDatabase()
      
      // Verificar datos recientes
      const recentData = await db.getAllAsync("SELECT * FROM alimento ORDER BY created_at DESC LIMIT 5")
      console.log("📋 Datos recientes:", recentData)
      
      // Verificar datos por fecha específica
      const testData = await db.getAllAsync("SELECT * FROM alimento WHERE fecha = '2025-07-19'")
      console.log("📋 Datos de fecha 2025-07-19:", testData)
      
    } catch (error) {
      console.error("❌ Error verificando datos:", error)
    }
  }
  
  // Verificar consultas
  static async checkQueries(): Promise<void> {
    try {
      console.log("🔍 Probando consulta getAlimentoByFecha...")
      
      // Probar con parámetros válidos
      const result = await DatabaseQueries.getAlimentoByFecha('2025-07-19', 5)
      console.log("✅ Consulta exitosa, registros encontrados:", result.length)
      
      if (result.length > 0) {
        console.log("📋 Primer registro:", result[0])
      }
      
         } catch (error) {
       console.error("❌ Error en consulta getAlimentoByFecha:", error)
       console.error("Detalles del error:", {
         message: error instanceof Error ? error.message : String(error),
         stack: error instanceof Error ? error.stack : 'No stack available'
       })
     }
  }
  
  // Reparar base de datos
  static async repairDatabase(): Promise<void> {
    console.log("🔧 INICIANDO REPARACIÓN DE BASE DE DATOS")
    
    try {
      // 1. Reiniciar base de datos
      console.log("1️⃣ Reiniciando base de datos...")
      await dbManager.resetDatabase()
      
      // 2. Verificar después de reinicio
      console.log("2️⃣ Verificando después de reinicio...")
      await this.fullDiagnostic()
      
      console.log("✅ REPARACIÓN COMPLETADA")
      
    } catch (error) {
      console.error("❌ Error en reparación:", error)
    }
  }
  
  // Insertar datos de prueba
  static async insertTestData(): Promise<void> {
    console.log("🧪 INSERTANDO DATOS DE PRUEBA")
    
    try {
      const testData = {
        caseta: 'Caseta2',
        fecha: '2025-07-19',
        granja_id: 5,
        existencia_inicial: 28,
        entrada: 34,
        consumo: 5,
        tipo: 'Gallina',
        edad: ''
      }
      
      await DatabaseQueries.insertAlimento(testData)
      console.log("✅ Datos de prueba insertados correctamente")
      
      // Verificar que se insertaron
      const result = await DatabaseQueries.getAlimentoByFecha('2025-07-19', 5)
      console.log("📋 Datos después de inserción:", result)
      
    } catch (error) {
      console.error("❌ Error insertando datos de prueba:", error)
    }
  }
}

// Función de utilidad para ejecutar diagnóstico desde la consola
export const runDatabaseDiagnostic = async () => {
  console.log("🚀 EJECUTANDO DIAGNÓSTICO DE BASE DE DATOS")
  await DatabaseDiagnostic.fullDiagnostic()
} 