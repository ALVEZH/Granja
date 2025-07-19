import { useState } from 'react';
import { fetchFromDynamicApi } from '../services/dinamicApi';
import { DatabaseQueries } from '../database/offline/queries';

export const useProduccionSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const syncProduccionData = async (granjaId: number, fecha: string) => {
    setIsSyncing(true);
    setSyncStatus('Iniciando sincronización...');

    try {
      // Obtener datos locales de producción para la granja y fecha específica
      const datosLocales = await DatabaseQueries.getProduccionByFecha(fecha, granjaId);
      
      if (datosLocales.length === 0) {
        setSyncStatus('No hay datos locales para sincronizar');
        return;
      }

      setSyncStatus(`Sincronizando ${datosLocales.length} registros...`);

      let exitosos = 0;
      let fallidos = 0;

      // Sincronizar cada registro
      for (const registro of datosLocales) {
        try {
          const caseta = parseInt(registro.caseta.replace('Caseta', ''));
          
          // Crear registros para cada tipo de producción según el reporte físico
          const tiposProduccion = [
            // BLANCO (White eggs)
            { calidad: 'BLANCO', tipo: 'CAJAS', cantidad: registro.blanco_cajas || 0 },
            { calidad: 'BLANCO', tipo: 'RESTOS', cantidad: registro.blanco_restos || 0 },
            
            // ROTO 1 (Broken 1)
            { calidad: 'ROTO 1', tipo: 'CAJAS', cantidad: registro.roto1_cajas || 0 },
            { calidad: 'ROTO 1', tipo: 'RESTOS', cantidad: registro.roto1_restos || 0 },
            
            // ROTO 2 (Broken 2)
            { calidad: 'ROTO 2', tipo: 'CAJAS', cantidad: registro.roto2_cajas || 0 },
            { calidad: 'ROTO 2', tipo: 'RESTOS', cantidad: registro.roto2_restos || 0 },
            
            // MANCHADO (Stained)
            { calidad: 'MANCHADO', tipo: 'CAJAS', cantidad: registro.manchado_cajas || 0 },
            { calidad: 'MANCHADO', tipo: 'RESTOS', cantidad: registro.manchado_restos || 0 },
            
            // FRAGIL 1 (Fragile 1)
            { calidad: 'FRAGIL 1', tipo: 'CAJAS', cantidad: registro.fragil1_cajas || 0 },
            { calidad: 'FRAGIL 1', tipo: 'RESTOS', cantidad: registro.fragil1_restos || 0 },
            
            // FRAGIL 2 (Fragile 2)
            { calidad: 'FRAGIL 2', tipo: 'CAJAS', cantidad: registro.fragil2_cajas || 0 },
            { calidad: 'FRAGIL 2', tipo: 'RESTOS', cantidad: registro.fragil2_restos || 0 },
            
            // YEMA (Yolk)
            { calidad: 'YEMA', tipo: 'CAJAS', cantidad: registro.yema_cajas || 0 },
            { calidad: 'YEMA', tipo: 'RESTOS', cantidad: registro.yema_restos || 0 },
            
            // B1
            { calidad: 'B1', tipo: 'CAJAS', cantidad: registro.b1_cajas || 0 },
            { calidad: 'B1', tipo: 'RESTOS', cantidad: registro.b1_restos || 0 },
            
            // EXTRA 240PZS (Extra 240 Pieces)
            { calidad: 'EXTRA 240PZS', tipo: 'CAJAS', cantidad: registro.extra240_cajas || 0 },
            { calidad: 'EXTRA 240PZS', tipo: 'RESTOS', cantidad: registro.extra240_restos || 0 }
          ];

          // Solo insertar registros con cantidad > 0
          for (const tipo of tiposProduccion) {
            if (tipo.cantidad > 0) {
              // Formatear la fecha correctamente para SQL Server
              const fechaFormateada = registro.fecha; // Mantener formato YYYY-MM-DD
              
              const datosParaServidor = {
                GranjaID: registro.granja_id,
                CasetaID: caseta,
                Calidad: tipo.calidad,
                Tipo: tipo.tipo,
                Cantidad: tipo.cantidad,
                Fecha: fechaFormateada
              };

              // Insertar en SQL Server
              console.log(`Enviando: ${datosParaServidor.Calidad} - ${datosParaServidor.Tipo}: ${datosParaServidor.Cantidad}`);
              
              await fetchFromDynamicApi({
                metodo: 'ALVEZH_Produccion',
                tipo: 'tabla',
                operacion: 'insertar',
                data: datosParaServidor
              });
            }
          }

          exitosos++;
          setSyncStatus(`Sincronizados ${exitosos}/${datosLocales.length} registros...`);
        } catch (error) {
          console.error('Error sincronizando registro:', error);
          fallidos++;
        }
      }

      setSyncStatus(`Sincronización completada. Exitosos: ${exitosos}, Fallidos: ${fallidos}`);
      
      if (exitosos > 0) {
        // Opcional: marcar como sincronizados en local
        // await DatabaseQueries.markProduccionAsSynced(fecha, granjaId);
      }

    } catch (error) {
      console.error('Error en sincronización:', error);
      setSyncStatus(`Error: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllProduccionData = async () => {
    setIsSyncing(true);
    setSyncStatus('Iniciando sincronización completa...');

    try {
      // Obtener todas las fechas disponibles
      const fechas = await DatabaseQueries.getFechasDisponibles();
      
      if (fechas.length === 0) {
        setSyncStatus('No hay datos locales para sincronizar');
        return;
      }

      let totalExitosos = 0;
      let totalFallidos = 0;

      for (const fecha of fechas) {
        setSyncStatus(`Sincronizando fecha: ${fecha}...`);
        
        // Obtener todas las granjas que tienen datos para esta fecha
        const datosFecha = await DatabaseQueries.getAllProduccion();
        const granjasUnicas = [...new Set(datosFecha.map(d => d.granja_id))];

        for (const granjaId of granjasUnicas) {
          try {
            await syncProduccionData(granjaId, fecha);
            totalExitosos++;
          } catch (error) {
            console.error(`Error sincronizando granja ${granjaId}, fecha ${fecha}:`, error);
            totalFallidos++;
          }
        }
      }

      setSyncStatus(`Sincronización completa. Total exitosos: ${totalExitosos}, Fallidos: ${totalFallidos}`);

    } catch (error) {
      console.error('Error en sincronización completa:', error);
      setSyncStatus(`Error: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncStatus,
    syncProduccionData,
    syncAllProduccionData
  };
}; 