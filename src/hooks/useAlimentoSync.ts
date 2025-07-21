import { useState } from 'react';
import { fetchFromDynamicApi } from '../services/dinamicApi';
import { DatabaseQueries } from '../database/offline/queries';
import { Alert } from 'react-native';

export const useAlimentoSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const syncAlimentoData = async (granjaId: number, fecha: string) => {
    setIsSyncing(true);
    setSyncStatus('🔄 Iniciando sincronización de alimentos...');

    let exitosos = 0;
    let fallidos = 0;
    let errores: string[] = [];
    let intentados = 0;

    try {
      // Obtener datos locales de alimentos para la granja y fecha específica
      const datosLocales = await DatabaseQueries.getAlimentoByFecha(fecha, granjaId);
      
      if (datosLocales.length === 0) {
        setSyncStatus('❌ No hay datos locales para sincronizar');
        Alert.alert('Sincronización de Alimentos', 'No hay datos locales para sincronizar.');
        setIsSyncing(false);
        return;
      }

      setSyncStatus(`📊 Sincronizando ${datosLocales.length} registros...`);

      // Sincronizar cada registro
      for (const registro of datosLocales) {
        try {
          intentados++;
          const caseta = parseInt(registro.caseta.replace('Caseta', ''));
          if (isNaN(caseta)) {
            errores.push(`Caseta inválida: ${registro.caseta}`);
            fallidos++;
            continue;
          }
          const fechaFormateada = registro.fecha.includes('T') ? registro.fecha.split('T')[0] : registro.fecha;
          
          // Usar ALVEZH_ALIMENTOS_ con tu API local
          const datosParaServidor = {
            GranjaID: Number(registro.granja_id),
            CasetaID: caseta,
            Fecha: fechaFormateada,
            ExistenciaInicial: parseFloat(String(registro.existencia_inicial || 0)),
            Entrada: parseFloat(String(registro.entrada || 0)),
            Consumo: parseFloat(String(registro.consumo || 0)),
            Tipo: String(registro.tipo || 'Alimento').trim() || 'Alimento',
            CreadoPor: 'APP'
          };

          // Solo insertar si hay datos válidos
          if (datosParaServidor.Tipo && datosParaServidor.Tipo.trim() !== '' && 
              (datosParaServidor.ExistenciaInicial > 0 || 
               datosParaServidor.Entrada > 0 || 
               datosParaServidor.Consumo > 0)) {
            
            console.log(`🔄 Enviando: Caseta ${caseta} - ${datosParaServidor.Tipo}`);
            console.log('📤 Datos:', datosParaServidor);
            try {
              const apiResult = await fetchFromDynamicApi({
                metodo: 'ALVEZH_alimentos', // Cambiado a la nueva tabla
                tipo: 'tabla',
                operacion: 'insertar',
                data: datosParaServidor,
                usarAdmin: false // Usar usrAPPpostura
              });
              console.log('✅ Respuesta API:', apiResult);
              exitosos++;
            } catch (apiError: any) {
              console.error('❌ Error API:', apiError);
              errores.push(`Caseta ${caseta} - ${datosParaServidor.Tipo}: ${apiError.message || apiError}`);
              fallidos++;
            }
          } else {
            errores.push(`Registro omitido (sin datos válidos): Caseta ${caseta} - ${datosParaServidor.Tipo}`);
            fallidos++;
          }
          setSyncStatus(`📊 Progreso: ${exitosos + fallidos}/${datosLocales.length} registros`);
        } catch (error: any) {
          console.error('❌ Error sincronizando registro:', error);
          errores.push(`Error inesperado: ${error.message || error}`);
          fallidos++;
        }
      }

      let resumen = `Intentados: ${intentados}\nExitosos: ${exitosos}\nFallidos: ${fallidos}`;
      if (errores.length > 0) {
        resumen += `\n\nErrores:\n${errores.slice(0, 5).join('\n')}`;
        if (errores.length > 5) resumen += `\n...y más (${errores.length - 5} errores)`;
      }

      if (fallidos === 0 && exitosos > 0) {
        setSyncStatus(`✅ Sincronización completada: ${exitosos} registros subidos exitosamente`);
        Alert.alert('Sincronización de Alimentos', `¡Éxito!\n${resumen}`);
      } else if (exitosos > 0 && fallidos > 0) {
        setSyncStatus(`⚠️ Sincronización parcial: ${exitosos} exitosos, ${fallidos} fallidos`);
        Alert.alert('Sincronización de Alimentos', `Parcialmente exitoso:\n${resumen}`);
      } else if (fallidos > 0 && exitosos === 0) {
        setSyncStatus(`❌ Sincronización fallida: ${fallidos} registros fallidos`);
        Alert.alert('Sincronización de Alimentos', `Fallido:\n${resumen}`);
      }

    } catch (error: any) {
      console.error('❌ Error en sincronización:', error);
      setSyncStatus(`❌ Error: ${error}`);
      Alert.alert('Sincronización de Alimentos', `Error inesperado:\n${error.message || error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllAlimentoData = async () => {
    setIsSyncing(true);
    setSyncStatus('🔄 Iniciando sincronización completa de alimentos...');

    try {
      // Obtener todas las fechas disponibles
      const fechas = await DatabaseQueries.getFechasDisponibles();
      
      if (fechas.length === 0) {
        setSyncStatus('❌ No hay datos locales para sincronizar');
        Alert.alert('Sincronización de Alimentos', 'No hay datos locales para sincronizar.');
        setIsSyncing(false);
        return;
      }

      let totalExitosos = 0;
      let totalFallidos = 0;
      let totalIntentados = 0;
      let errores: string[] = [];

      for (const fecha of fechas) {
        setSyncStatus(`📅 Sincronizando fecha: ${fecha}...`);
        // Obtener todas las granjas que tienen datos de alimentos para esta fecha
        const datosFecha = await DatabaseQueries.getAlimentoByFecha(fecha, 0);
        const granjasUnicas = [...new Set(datosFecha.map(d => Number(d.granja_id)))];

        for (const granjaId of granjasUnicas) {
          try {
            await syncAlimentoData(granjaId, fecha);
            totalExitosos++;
            totalIntentados++;
          } catch (error: any) {
            console.error(`❌ Error sincronizando granja ${granjaId}, fecha ${fecha}:`, error);
            errores.push(`Granja ${granjaId}, fecha ${fecha}: ${error.message || error}`);
            totalFallidos++;
            totalIntentados++;
          }
        }
      }

      let resumen = `Fechas procesadas: ${fechas.length}\nIntentados: ${totalIntentados}\nExitosos: ${totalExitosos}\nFallidos: ${totalFallidos}`;
      if (errores.length > 0) {
        resumen += `\n\nErrores:\n${errores.slice(0, 5).join('\n')}`;
        if (errores.length > 5) resumen += `\n...y más (${errores.length - 5} errores)`;
      }

      if (totalFallidos === 0) {
        setSyncStatus(`✅ Sincronización completa exitosa: ${totalExitosos} registros procesados`);
        Alert.alert('Sincronización de Alimentos', `¡Éxito!\n${resumen}`);
      } else if (totalExitosos > 0) {
        setSyncStatus(`⚠️ Sincronización parcial: ${totalExitosos} exitosos, ${totalFallidos} fallidos`);
        Alert.alert('Sincronización de Alimentos', `Parcialmente exitoso:\n${resumen}`);
      } else {
        setSyncStatus(`❌ Sincronización fallida: ${totalFallidos} registros fallidos`);
        Alert.alert('Sincronización de Alimentos', `Fallido:\n${resumen}`);
      }

    } catch (error: any) {
      console.error('❌ Error en sincronización completa:', error);
      setSyncStatus(`❌ Error: ${error}`);
      Alert.alert('Sincronización de Alimentos', `Error inesperado:\n${error.message || error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const checkSyncStatus = async (granjaId: number, fecha: string) => {
    setSyncStatus('🔍 Verificando estado de sincronización...');
    try {
      // Verificar datos locales
      const datosLocales = await DatabaseQueries.getAlimentoByFecha(fecha, granjaId);
      if (datosLocales.length > 0) {
        setSyncStatus(`📊 ${datosLocales.length} registros locales listos para sincronizar`);
        console.log('📋 Datos locales:', datosLocales);
      } else {
        setSyncStatus('❌ No hay datos locales para sincronizar');
      }
    } catch (error: any) {
      console.error('❌ Error verificando datos:', error);
      setSyncStatus(`❌ Error: ${error}`);
    }
  };

  return {
    isSyncing,
    syncStatus,
    syncAlimentoData,
    syncAllAlimentoData,
    checkSyncStatus
  };
}; 