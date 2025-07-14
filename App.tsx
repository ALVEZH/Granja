// App.js (modificado)
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/navigation';
import { dbManager } from './src/database/offline/db'; // Ajusta la ruta según tu estructura
import { SeccionContext } from './src/views/EnvaseScreen';

export default function App() {
  const [seccionSeleccionada, setSeccionSeleccionada] = React.useState<string | null>(null);
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

  return (
    <SeccionContext.Provider value={{ seccionSeleccionada, setSeccionSeleccionada }}>
      <AppNavigator />
    </SeccionContext.Provider>
  );
}