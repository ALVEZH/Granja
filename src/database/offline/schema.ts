// Esquemas de las tablas
export const createTables = `
  -- Tabla de producción
  CREATE TABLE IF NOT EXISTS produccion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseta TEXT NOT NULL,
    fecha TEXT NOT NULL,
    blanco_cajas INTEGER DEFAULT 0,
    blanco_restos INTEGER DEFAULT 0,
    roto1_cajas INTEGER DEFAULT 0,
    roto1_restos INTEGER DEFAULT 0,
    roto2_cajas INTEGER DEFAULT 0,
    roto2_restos INTEGER DEFAULT 0,
    manchado_cajas INTEGER DEFAULT 0,
    manchado_restos INTEGER DEFAULT 0,
    fragil1_cajas INTEGER DEFAULT 0,
    fragil1_restos INTEGER DEFAULT 0,
    fragil2_cajas INTEGER DEFAULT 0,
    fragil2_restos INTEGER DEFAULT 0,
    yema_cajas INTEGER DEFAULT 0,
    yema_restos INTEGER DEFAULT 0,
    b1_cajas INTEGER DEFAULT 0,
    b1_restos INTEGER DEFAULT 0,
    extra240_cajas INTEGER DEFAULT 0,
    extra240_restos INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(caseta, fecha)
  );

  -- Tabla de alimento
  CREATE TABLE IF NOT EXISTS alimento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseta TEXT NOT NULL,
    fecha TEXT NOT NULL,
    existencia_inicial REAL DEFAULT 0,
    entrada REAL DEFAULT 0,
    consumo REAL DEFAULT 0,
    tipo TEXT DEFAULT '',
    edad TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(caseta, fecha)
  );

  -- Tabla de existencia
  CREATE TABLE IF NOT EXISTS existencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseta TEXT NOT NULL,
    fecha TEXT NOT NULL,
    inicial INTEGER DEFAULT 0,
    entrada INTEGER DEFAULT 0,
    mortalidad INTEGER DEFAULT 0,
    salida INTEGER DEFAULT 0,
    final INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(caseta, fecha)
  );

  -- Tabla de envase
  CREATE TABLE IF NOT EXISTS envase (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseta TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT DEFAULT '',
    inicial REAL DEFAULT 0,
    recibido REAL DEFAULT 0,
    consumo REAL DEFAULT 0,
    final REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(caseta, fecha)
  );
`
