import * as SQLite from 'expo-sqlite';

declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    transaction(
      callback: (tx: SQLite.SQLTransaction) => void,
      error?: (error: any) => void,
      success?: () => void
    ): void;
    // Otros métodos si los usas...
  }

  export interface SQLTransaction {
    executeSql(
      sqlStatement: string,
      args?: (string | number)[],
      success?: (tx: SQLTransaction, resultSet: SQLResultSet) => void,
      error?: (tx: SQLTransaction, error: any) => boolean
    ): void;
  }

  export interface SQLResultSet {
    insertId: number;
    rowsAffected: number;
    rows: {
      length: number;
      item(index: number): any;
      _array: any[];
    };
  }
}
