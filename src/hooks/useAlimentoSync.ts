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

        // 1. Insertar en ALVEZH_alimentos (registro de consumo total)
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

        // 2. Descontar el consumo por FIFO en múltiples lotes
        // 🔹 2. Descontar el consumo por FIFO en múltiples lotes del tipo de alimento
        let restante = consumo;

        // Solo tomamos lotes con cantidad disponible > 0
        const lotesValidos = lotes
          .filter(lote => {
            const silo = silos.find(s => s.SiloID === lote.SiloID);
            return (
              silo &&
              silo.GranjaID === granjaId &&
              lote.TipoAlimento === tipo &&
              lote.CantidadDisponibleKg > 0
            );
          })
          .sort((a, b) => new Date(a.FechaEntrada).getTime() - new Date(b.FechaEntrada).getTime());

        if (lotesValidos.length === 0) {
          errores.push(`No se encontró lote válido para Granja ${granjaId}, Tipo ${tipo}`);
          fallidos++;
          continue;
        }

        for (const lote of lotesValidos) {
          if (restante <= 0) break;

          let disponible = lote.CantidadDisponibleKg; // 🔹 usar variable local para evitar errores de doble descuento

          if (disponible >= restante) {
            const nuevaCantidad = disponible - restante;

            await fetchFromDynamicApi({
              metodo: 'LotesAlimento',
              tipo: 'tabla',
              operacion: 'actualizar',
              data: {
                LoteID: lote.LoteID,
                CantidadDisponibleKg: nuevaCantidad,
              },
            });

            lote.CantidadDisponibleKg = nuevaCantidad; // 🔹 actualizar en memoria
            restante = 0;
          } else {
            restante -= disponible;

            await fetchFromDynamicApi({
              metodo: 'LotesAlimento',
              tipo: 'tabla',
              operacion: 'actualizar',
              data: {
                LoteID: lote.LoteID,
                CantidadDisponibleKg: 0,
              },
            });

            lote.CantidadDisponibleKg = 0; // 🔹 actualizar en memoria
          }
        }

        // Si todavía queda consumo no cubierto del tipo actual
        if (restante > 0) {
          // 🔹 Tomar lotes alternativos en el mismo silo y granja con CantidadDisponibleKg > 0
          const lotesAlternativos = lotes
            .filter(lote => {
              const silo = silos.find(s => s.SiloID === lote.SiloID);
              return (
                silo &&
                silo.GranjaID === granjaId &&
                lote.CantidadDisponibleKg > 0 // solo disponibles
              );
            })
            .sort((a, b) => new Date(a.FechaEntrada).getTime() - new Date(b.FechaEntrada).getTime());

          for (const lote of lotesAlternativos) {
            if (restante <= 0) break;

            let disponible = lote.CantidadDisponibleKg;

            if (disponible >= restante) {
              const nuevaCantidad = disponible - restante;

              await fetchFromDynamicApi({
                metodo: 'LotesAlimento',
                tipo: 'tabla',
                operacion: 'actualizar',
                data: {
                  LoteID: lote.LoteID,
                  CantidadDisponibleKg: nuevaCantidad,
                },
              });

              lote.CantidadDisponibleKg = nuevaCantidad;
              restante = 0;
            } else {
              restante -= disponible;

              await fetchFromDynamicApi({
                metodo: 'LotesAlimento',
                tipo: 'tabla',
                operacion: 'actualizar',
                data: {
                  LoteID: lote.LoteID,
                  CantidadDisponibleKg: 0,
                },
              });

              lote.CantidadDisponibleKg = 0;
            }
          }

          // Solo si no hay más lotes con disponibilidad
          if (restante > 0) {
            console.warn(
              `⚠️ No había suficiente alimento en la granja ${granjaId} para cubrir ${consumo} Kg (faltaron ${restante} Kg)`
            );
          }
        }

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
