import { useState } from 'react';
import { Alert } from 'react-native';

export default function useCapturaViewModel() {
  const [produccion, setProduccion] = useState('');
  const [alimento, setAlimento] = useState('');
  const [aves, setAves] = useState('');
  const [envases, setEnvases] = useState('');

  const handleSave = () => {
    if (!produccion || !alimento || !aves || !envases) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    // Aquí puedes agregar lógica para guardar datos en SQLite o API
    Alert.alert('Éxito', 'Datos guardados correctamente');
  };

  return {
    produccion,
    alimento,
    aves,
    envases,
    setProduccion,
    setAlimento,
    setAves,
    setEnvases,
    handleSave,
  };
}
