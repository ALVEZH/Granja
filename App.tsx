// App.js (modificado)
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/navigation';
import { dbManager } from './src/database/offline/db'; // Ajusta la ruta según tu estructura
import { runDatabaseDiagnostic } from './src/database/offline/dbDiagnostic';
import { SeccionContext } from './src/views/EnvaseScreen';
import { View, Text } from 'react-native'; // Added View and Text import

export default function App() {
  const [seccionSeleccionada, setSeccionSeleccionada] = React.useState<string | null>(null);
  const [dbReady, setDbReady] = React.useState(false);
  const [dbError, setDbError] = React.useState<string | null>(null);

  useEffect(() => {
    // Inicializar la base de datos en segundo plano
    const resetAndDiagnoseDB = async () => {
      try {
        await dbManager.resetDatabase();
        await dbManager.diagnoseDatabase();
        setDbError(null);/* 
        console.log('Base de datos reiniciada y diagnosticada'); */
      } catch (error) {
        setDbError('Error al reiniciar o diagnosticar la base de datos.');
        console.error('Error al reiniciar o diagnosticar la base de datos:', error);
      }
    };
    resetAndDiagnoseDB();
  }, []);

  if (dbError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: 'red', fontSize: 18, margin: 20 }}>{dbError}</Text>
      </View>
    );
  }

  // Mostrar la app inmediatamente, sin esperar a la base de datos
  return (
    <SeccionContext.Provider value={{ seccionSeleccionada, setSeccionSeleccionada }}>
      <AppNavigator />
    </SeccionContext.Provider>
  );
}