import { useState } from 'react';
import { fetchFromDynamicApi } from '../services/dinamicApi';
import { DatabaseQueries } from '../database/offline/queries';
import { Alert } from 'react-native';
import { useLotes } from './useLotes';
import { useSilos } from './useSilos';

export const useAlimentoSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const { lotes, reload: reloadLotes } = useLotes();
  const { silos } = useSilos();

  const syncAlimentoData = async (granjaId: number, fecha: string, mostrarAlerta = true) => {
    setIsSyncing(true);
    setSyncStatus('🔄 Iniciando sincronización de alimentos...');

    let exitosos = 0;
    let fallidos = 0;
    let errores: string[] = [];
    let intentados = 0;

    try {
      const datosLocales = await DatabaseQueries.getAlimentoByFecha(fecha, granjaId);

      if (datosLocales.length === 0) {
        setSyncStatus('❌ No hay datos locales para sincronizar');
        setIsSyncing(false);
        return;
      }

      setSyncStatus(`📊 Sincronizando ${datosLocales.length} registros...`);

      for (const registro of datosLocales) {
        try {
          intentados++;
          const caseta = parseInt(registro.caseta.replace('Caseta', ''));
          const consumo = parseFloat(String(registro.consumo || 0));
          const tipo = String(registro.tipo || 'Alimento').trim();
          const fechaFormateada = registro.fecha.includes('T') ? registro.fecha.split('T')[0] : registro.fecha;

          if (isNaN(caseta) || consumo <= 0 || !tipo) {
            errores.push(`Registro inválido: Caseta ${registro.caseta}`);
            fallidos++;
            continue;
          }

          // Buscar lotes válidos para este alimento y granja
          const lotesValidos = lotes.filter(lote => {
            const silo = silos.find(s => s.SiloID === lote.SiloID);
            return (
              silo &&
              silo.GranjaID === granjaId &&
              lote.TipoAlimento === tipo &&
              lote.CantidadDisponibleKg > 0
            );
          });

          // FIFO: el más antiguo
          const lote = lotesValidos.sort(
            (a, b) => new Date(a.FechaEntrada).getTime() - new Date(b.FechaEntrada).getTime()
          )[0];

          if (!lote) {
            errores.push(`No se encontró lote válido para Granja ${granjaId}, Tipo ${tipo}`);
            fallidos++;
            continue;
          }

          // 1. Insertar en ALVEZH_alimentos
          await fetchFromDynamicApi({
            metodo: 'ALVEZH_alimentos',
            tipo: 'tabla',
            operacion: 'insertar',
            data: {
              GranjaID: granjaId,
              CasetaID: caseta,
              Fecha: fechaFormateada,
              ExistenciaInicial: parseFloat(String(registro.existencia_inicial || 0)),
              Entrada: parseFloat(String(registro.entrada || 0)),
              Consumo: consumo,
              Tipo: tipo,
              CreadoPor: 'APP'
            },
          });

          // 2. Actualizar disponibilidad del lote
          const nuevaCantidad = Math.max(0, lote.CantidadDisponibleKg - consumo);
          await fetchFromDynamicApi({
            metodo: 'LotesAlimento',
            tipo: 'tabla',
            operacion: 'actualizar',
            data: {
              LoteID: lote.LoteID,           // <- aquí
              CantidadDisponibleKg: lote.CantidadDisponibleKg - consumo
            },
          });
          await reloadLotes();
          exitosos++;

        } catch (error: any) {
          console.error('❌ Error sincronizando registro:', error);
          errores.push(error.message || String(error));
          fallidos++;
        }
        setSyncStatus(`📊 Progreso: ${exitosos + fallidos}/${datosLocales.length} registros`);
      }

      // Resumen
      let resumen = `Intentados: ${intentados}\nExitosos: ${exitosos}\nFallidos: ${fallidos}`;
      if (errores.length > 0) resumen += `\n\nErrores:\n${errores.slice(0, 5).join('\n')}`;

      if (mostrarAlerta) {
        Alert.alert('Sincronización de Alimentos', resumen);
      }

    } catch (error: any) {
      console.error('❌ Error en sincronización:', error);
      setSyncStatus(`❌ Error: ${error.message || error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return { isSyncing, syncStatus, syncAlimentoData };
};
