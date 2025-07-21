import { useState } from 'react';
import { fetchFromDynamicApi } from '../services/dinamicApi';
import { DatabaseQueries } from '../database/offline/queries';

export const useAlimentoSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const syncAlimentoData = async (granjaId: number, fecha: string) => {
    setIsSyncing(true);
    setSyncStatus('🔄 Iniciando sincronización de alimentos...');

    try {
      // Obtener datos locales de alimentos para la granja y fecha específica
      const datosLocales = await DatabaseQueries.getAlimentoByFecha(fecha, granjaId);
      
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
          
          // Usar ALVEZH_ALIMENTOS_ con tu API local
          const datosParaServidor = {
            GranjaID: Number(registro.granja_id),
            CasetaID: caseta,
            Fecha: fechaFormateada,
            ExistenciaInicial: parseFloat(String(registro.existencia_inicial || 0)),
            Entrada: parseFloat(String(registro.entrada || 0)),
            Consumo: parseFloat(String(registro.consumo || 0)),
            Tipo: String(registro.tipo || 'Alimento').trim() || 'Alimento'
          };

          // Solo insertar si hay datos válidos
          if (datosParaServidor.Tipo && datosParaServidor.Tipo.trim() !== '' && 
              (datosParaServidor.ExistenciaInicial > 0 || 
               datosParaServidor.Entrada > 0 || 
               datosParaServidor.Consumo > 0)) {
            
            console.log(`🔄 Enviando: Caseta ${caseta} - ${datosParaServidor.Tipo}`);
            console.log('📤 Datos:', datosParaServidor);
            
            await fetchFromDynamicApi({
              metodo: 'ALVEZH_ALIMENTOS_',
              tipo: 'tabla',
              operacion: 'insertar',
              data: datosParaServidor,
              usarAdmin: false // Usar usrAPPpostura
            });

            console.log(`✅ Registro sincronizado: Caseta ${caseta} - ${datosParaServidor.Tipo}`);
            exitosos++;
          } else {
            console.log(`⚠️ Registro omitido (sin datos válidos): Caseta ${caseta} - ${datosParaServidor.Tipo}`);
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

  const syncAllAlimentoData = async () => {
    setIsSyncing(true);
    setSyncStatus('🔄 Iniciando sincronización completa de alimentos...');

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
        
        // Obtener todas las granjas que tienen datos de alimentos para esta fecha
        const datosFecha = await DatabaseQueries.getAlimentoByFecha(fecha, 0);
        const granjasUnicas = [...new Set(datosFecha.map(d => Number(d.granja_id)))];

        for (const granjaId of granjasUnicas) {
          try {
            await syncAlimentoData(granjaId, fecha);
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
      const datosLocales = await DatabaseQueries.getAlimentoByFecha(fecha, granjaId);
      
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
    syncAlimentoData,
    syncAllAlimentoData,
    checkSyncStatus
  };
}; 