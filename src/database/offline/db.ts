import * as SQLite from "expo-sqlite"
import { createTables } from "./schema"

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null

  async init(): Promise<void> {
    try {
      console.log("Iniciando inicialización de base de datos...")
      this.db = await SQLite.openDatabaseAsync("granja.db")
      console.log("Base de datos abierta:", this.db ? "OK" : "NULL")
      
      if (!this.db) {
        throw new Error("No se pudo abrir la base de datos. El objeto db es null.")
      }
      
      console.log("Ejecutando createTables...")
      try {
        await this.db.execAsync(createTables)
        console.log("createTables ejecutado correctamente")
      } catch (sqlError) {
        console.error("Error ejecutando createTables:", sqlError)
        // No relanzar el error, continuar con las migraciones
      }
      
      // Migración para agregar columna edad a la tabla existencia
      try {
        await this.db.execAsync("ALTER TABLE existencia ADD COLUMN edad INTEGER DEFAULT 0")
        console.log("Migración: Columna edad agregada a tabla existencia")
      } catch (migrationError) {
        // Si la columna ya existe, ignorar el error
        console.log("Columna edad ya existe en tabla existencia")
      }
      
      // Migraciones para agregar columna granja_id a todas las tablas
      const tablas = ['produccion', 'alimento', 'existencia', 'envase']
      for (const tabla of tablas) {
        try {
          await this.db.execAsync(`ALTER TABLE ${tabla} ADD COLUMN granja_id INTEGER DEFAULT 1`)
          console.log(`Migración: Columna granja_id agregada a tabla ${tabla}`)
        } catch (migrationError) {
          // Si la columna ya existe, ignorar el error
          console.log(`Columna granja_id ya existe en tabla ${tabla}`)
        }
      }
      
      console.log("Base de datos inicializada correctamente")
    } catch (error) {
      console.error("Error al inicializar la base de datos:", error)
      // No relanzar el error para evitar que la app crashee
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error("Base de datos no inicializada. Llama a init() primero.")
    }
    return this.db
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync()
      this.db = null
    }
  }

  async resetDatabase(): Promise<void> {
    console.log("Reiniciando base de datos...")
    try {
      // Cerrar la base de datos actual si está abierta
      if (this.db) {
        console.log("Cerrando base de datos actual...")
        await this.db.closeAsync()
        this.db = null
        console.log("Base de datos cerrada")
      }
      
      // Esperar un momento para asegurar que se cierre completamente
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Eliminar el archivo de base de datos
      console.log("Eliminando archivo de base de datos...")
      await SQLite.deleteDatabaseAsync("granja.db")
      console.log("Base de datos eliminada")
      
      // Reinicializar
      console.log("Reinicializando base de datos...")
      await this.init()
      console.log("Base de datos reiniciada correctamente")
    } catch (error) {
      console.error("Error al reiniciar la base de datos:", error)
      // Intentar reinicializar de todas formas
      try {
        console.log("Intentando reinicializar después del error...")
        await this.init()
        console.log("Base de datos reinicializada después del error")
      } catch (initError) {
        console.error("Error al reinicializar después del error:", initError)
      }
    }
  }

  async clearAllTables(): Promise<void> {
    console.log("Limpiando todas las tablas...")
    try {
      if (!this.db) {
        await this.init()
      }
      
      if (this.db) {
        // Limpiar todas las tablas
        await this.db.runAsync("DELETE FROM produccion")
        await this.db.runAsync("DELETE FROM alimento")
        await this.db.runAsync("DELETE FROM existencia")
        await this.db.runAsync("DELETE FROM envase")
        
        // Resetear los contadores de autoincrement
        await this.db.runAsync("DELETE FROM sqlite_sequence WHERE name IN ('produccion', 'alimento', 'existencia', 'envase')")
        
        console.log("Todas las tablas limpiadas correctamente")
      }
    } catch (error) {
      console.error("Error al limpiar tablas:", error)
    }
  }

  // Nueva función de diagnóstico
  async diagnoseDatabase(): Promise<void> {
    console.log("=== DIAGNÓSTICO DE BASE DE DATOS ===")
    
    try {
      if (!this.db) {
        console.log("❌ Base de datos no inicializada")
        await this.init()
        if (!this.db) {
          console.log("❌ No se pudo inicializar la base de datos")
          return
        }
      }
      
      console.log("✅ Base de datos inicializada")
      
      // Verificar tablas existentes
      const tables = await this.db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'")
      console.log("📋 Tablas existentes:", tables.map((t: any) => t.name))
      
      // Verificar tabla alimento específicamente
      const alimentoTable = await this.db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='alimento'")
      if (alimentoTable && alimentoTable.length > 0) {
        console.log("✅ Tabla 'alimento' existe")
        
        // Verificar estructura de la tabla
        const columns = await this.db.getAllAsync("PRAGMA table_info(alimento)")
        console.log("📋 Columnas de tabla alimento:", columns.map((c: any) => c.name))
        
        // Verificar datos en la tabla
        const count = await this.db.getFirstAsync("SELECT COUNT(*) as count FROM alimento")
        console.log("📊 Registros en tabla alimento:", (count as any)?.count || 0)
        
        // Mostrar algunos registros de ejemplo
        const sample = await this.db.getAllAsync("SELECT * FROM alimento LIMIT 3")
        console.log("📋 Registros de ejemplo:", sample)
        
      } else {
        console.log("❌ Tabla 'alimento' NO existe")
      }
      
      // Verificar permisos y conectividad
      try {
        await this.db.runAsync("SELECT 1")
        console.log("✅ Permisos de lectura/escritura OK")
      } catch (permError) {
        console.log("❌ Error de permisos:", permError)
      }
      
    } catch (error) {
      console.error("❌ Error en diagnóstico:", error)
    }
    
    console.log("=== FIN DIAGNÓSTICO ===")
  }
}

export const dbManager = new DatabaseManager()
