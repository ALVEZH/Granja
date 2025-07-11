// App.js (modificado)
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/navigation';
import { dbManager } from './src/database/offline/db'; // Ajusta la ruta según tu estructura

export default function App() {
  useEffect(() => {
    // Inicializar la base de datos al arrancar la app
    const initDB = async () => {
      try {
        await dbManager.init();
        console.log('Base de datos inicializada');
      } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
      }
    };
    
    initDB();
  }, []);

  return <AppNavigator />;
}