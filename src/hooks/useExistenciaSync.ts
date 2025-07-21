import { useState } from 'react';
import { fetchFromDynamicApi } from '../services/dinamicApi';
import { DatabaseQueries } from '../database/offline/queries';

export const useExistenciaSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const syncExistenciaData = async (granjaId: number, fecha: string) => {
    setIsSyncing(true);
    setSyncStatus('🔄 Iniciando sincronización de existencias...');

    try {
      // Obtener datos locales de existencias para la granja y fecha específica
      const datosLocales = await DatabaseQueries.getExistenciaByFecha(fecha, granjaId);
      
      if (datosLocales.length === 0) {
        setSyncStatus('❌ No hay datos locales para sincronizar');
        return;
      }

      setSyncStatus(`📊 Sincronizando ${datosLocales.length} registros...`);

      let exitosos = 0;
      let fallidos = 0;

      // Sincronizar cada registro
      for (const registro of datosLocales) {
        try {
          const caseta = parseInt(registro.caseta.replace('Caseta', ''));
          const fechaFormateada = registro.fecha.includes('T') ? registro.fecha.split('T')[0] : registro.fecha;
          
          // Usar ALVEZH_Existencia con tu API local
          const datosParaServidor = {
            GranjaID: Number(registro.granja_id),
            CasetaID: caseta,
            Fecha: fechaFormateada,
            Inicial: parseFloat(String(registro.inicial || 0)),
            Entrada: parseFloat(String(registro.entrada || 0)),
            Mortalidad: parseFloat(String(registro.mortalidad || 0)),
            Salida: parseFloat(String(registro.salida || 0)),
            Edad: parseFloat(String(registro.edad || 0)),
            Final: parseFloat(String(registro.final || 0))
          };

          // Solo insertar si hay datos válidos
          if (datosParaServidor.Inicial > 0 || 
              datosParaServidor.Entrada > 0 || 
              datosParaServidor.Mortalidad > 0 ||
              datosParaServidor.Salida > 0 ||
              datosParaServidor.Final > 0) {
            
            console.log(`🔄 Enviando: Caseta ${caseta} - Existencia`);
            console.log('📤 Datos:', datosParaServidor);
            
            await fetchFromDynamicApi({
              metodo: 'ALVEZH_Existencia',
              tipo: 'tabla',
              operacion: 'insertar',
              data: datosParaServidor,
              usarAdmin: false // Usar usrAPPpostura
            });

            console.log(`✅ Registro sincronizado: Caseta ${caseta} - Existencia`);
            exitosos++;
          } else {
            console.log(`⚠️ Registro omitido (sin datos válidos): Caseta ${caseta} - Existencia`);
          }
          
          setSyncStatus(`📊 Progreso: ${exitosos + fallidos}/${datosLocales.length} registros`);
        } catch (error) {
          console.error('❌ Error sincronizando registro:', error);
          fallidos++;
        }
      }

      if (fallidos === 0) {
        setSyncStatus(`✅ Sincronización completada: ${exitosos} registros subidos exitosamente`);
      } else if (exitosos > 0) {
        setSyncStatus(`⚠️ Sincronización parcial: ${exitosos} exitosos, ${fallidos} fallidos`);
      } else {
        setSyncStatus(`❌ Sincronización fallida: ${fallidos} registros fallidos`);
      }

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      setSyncStatus(`❌ Error: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllExistenciaData = async () => {
    setIsSyncing(true);
    setSyncStatus('🔄 Iniciando sincronización completa de existencias...');

    try {
      // Obtener todas las fechas disponibles
      const fechas = await DatabaseQueries.getFechasDisponibles();
      
      if (fechas.length === 0) {
        setSyncStatus('❌ No hay datos locales para sincronizar');
        return;
      }

      let totalExitosos = 0;
      let totalFallidos = 0;

      for (const fecha of fechas) {
        setSyncStatus(`📅 Sincronizando fecha: ${fecha}...`);
        
        // Obtener todas las granjas que tienen datos de existencias para esta fecha
        const datosFecha = await DatabaseQueries.getExistenciaByFecha(fecha, 0);
        const granjasUnicas = [...new Set(datosFecha.map(d => Number(d.granja_id)))];

        for (const granjaId of granjasUnicas) {
          try {
            await syncExistenciaData(granjaId, fecha);
            totalExitosos++;
          } catch (error) {
            console.error(`❌ Error sincronizando granja ${granjaId}, fecha ${fecha}:`, error);
            totalFallidos++;
          }
        }
      }

      if (totalFallidos === 0) {
        setSyncStatus(`✅ Sincronización completa exitosa: ${totalExitosos} registros procesados`);
      } else {
        setSyncStatus(`⚠️ Sincronización parcial: ${totalExitosos} exitosos, ${totalFallidos} fallidos`);
      }

    } catch (error) {
      console.error('❌ Error en sincronización completa:', error);
      setSyncStatus(`❌ Error: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const checkSyncStatus = async (granjaId: number, fecha: string) => {
    setSyncStatus('🔍 Verificando estado de sincronización...');
    
    try {
      // Verificar datos locales
      const datosLocales = await DatabaseQueries.getExistenciaByFecha(fecha, granjaId);
      
      if (datosLocales.length > 0) {
        setSyncStatus(`📊 ${datosLocales.length} registros locales listos para sincronizar`);
        console.log('📋 Datos locales:', datosLocales);
      } else {
        setSyncStatus('❌ No hay datos locales para sincronizar');
      }
    } catch (error) {
      console.error('❌ Error verificando datos:', error);
      setSyncStatus(`❌ Error: ${error}`);
    }
  };

  return {
    isSyncing,
    syncStatus,
    syncExistenciaData,
    syncAllExistenciaData,
    checkSyncStatus
  };
}; 