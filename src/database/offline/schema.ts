import db from './db';

export const createTables = () => {
  db.transaction(tx => {
    // Producción
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS produccion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        caseta TEXT,
        tipo TEXT,
        cajas INTEGER,
        restos INTEGER
      );
    `);

    // Alimento
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS alimento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        caseta TEXT,
        existenciaInicial INTEGER,
        entrada INTEGER,
        consumo INTEGER,
        tipo TEXT,
        edad TEXT
      );
    `);

    // Existencia
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS existencia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        caseta TEXT,
        inicial INTEGER,
        entrada INTEGER,
        mortalidad INTEGER,
        salida INTEGER,
        final INTEGER
      );
    `);

    // Envase
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS envase (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        caseta TEXT,
        tipo TEXT,
        inicial REAL,
        recibido REAL,
        consumo REAL,
        final REAL
      );
    `);
  });
};
