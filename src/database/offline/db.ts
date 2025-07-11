import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('granja.db');

export default db;
