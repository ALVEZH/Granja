import * as SQLite from "expo-sqlite"
import { createTables } from "./schema"

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync("granja.db")
      await this.db.execAsync(createTables)
      
      // Migración para agregar columna edad a la tabla existencia
      try {
        await this.db.execAsync("ALTER TABLE existencia ADD COLUMN edad INTEGER DEFAULT 0")
        console.log("Migración: Columna edad agregada a tabla existencia")
      } catch (migrationError) {
        // Si la columna ya existe, ignorar el error
        console.log("Columna edad ya existe en tabla existencia")
      }
      
      console.log("Base de datos inicializada correctamente")
    } catch (error) {
      console.error("Error al inicializar la base de datos:", error)
      throw error
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
}

export const dbManager = new DatabaseManager()
