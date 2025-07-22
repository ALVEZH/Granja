import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { DatabaseQueries } from '../database/offline/queries';
import * as Print from 'expo-print';
import { useSeccion } from './EnvaseScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useCasetas } from '../hooks/useCasetas';
import { useProduccionSync } from '../hooks/useProduccionSync';
import { useAlimentoSync } from '../hooks/useAlimentoSync';
import { syncExistencia } from '../util/existenciasApi';
import { syncEnvase } from '../util/envaseApi';
import Modal from 'react-native-modal';
import { ScrollView as RNScrollView } from 'react-native';

const columnasProduccion = [
  { label: 'BLANCO', key: 'blanco' },
  { label: 'ROTO 1', key: 'roto1' },
  { label: 'ROTO 2', key: 'roto2' },
  { label: 'MANCHADO', key: 'manchado' },
  { label: 'FRAGIL 1', key: 'fragil1' },
  { label: 'FRAGIL 2', key: 'fragil2' },
  { label: 'YEMA', key: 'yema' },
  { label: 'B1', key: 'b1' },
  { label: 'EXTRA 240PZS', key: 'extra240' }
];
const envases = [
  'CAJA TIPO A', 'SEPARADOR TIPO A', 'CAJA TIPO B', 'SEPARADOR TIPO B',
  'CONO', 'CONO 240 PZS', 'CONO ESTRELLA', 'CINTA', 'CINTA BLANCA'
];

const COL_WIDTH = 120; // Aumentar el ancho de las celdas para inputs
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf1f9' },
  headerSafeArea: {
    backgroundColor: '#eaf1f9',
    paddingTop: 32,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 2,
    flexWrap: 'wrap',
    backgroundColor: '#e0e7ef',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderColor: '#b0b0b0',
  },
  backButton: {
    padding: 6,
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2a3a4b',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 1,
    marginHorizontal: 4,
  },
  headerFecha: {
    fontSize: 15,
    color: '#517aa2',
    textAlign: 'center',
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 18, marginBottom: 6, color: '#517aa2', textAlign: 'left', marginLeft: 12 },
  table: {
    borderWidth: 1,
    borderColor: '#b0b0b0',
    borderRadius: 8,
    margin: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 13,
    paddingVertical: 8,
    paddingHorizontal: 0, // Sin padding extra
    width: COL_WIDTH,
    textAlign: 'center', // Centrado para todas las celdas
    color: '#222',
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
    backgroundColor: '#e0e7ef',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  dataRowAlt: {
    backgroundColor: '#eaf1f9',
  },
  casetaCell: {
    fontWeight: 'bold',
    fontSize: 13,
    width: COL_WIDTH,
    textAlign: 'center', // Centrado para alineación perfecta
    color: '#333',
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
    paddingVertical: 6,
    paddingHorizontal: 0, // Sin padding extra
  },
  inputCell: {
    fontSize: 16, // Aumentar tamaño de fuente
    color: '#222',
    width: COL_WIDTH,
    minWidth: 80,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
  },
  btnExportar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnExportarText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  resumenIcon: { width: 28, height: 28 },
  inputFirma: { borderWidth: 1, borderColor: '#b0b0b0', borderRadius: 6, padding: 8, marginBottom: 6, backgroundColor: '#fff', fontSize: 13 },
  casetaCellHeader: {
    textAlign: 'left',
    paddingHorizontal: 12,
    width: COL_WIDTH,
    fontWeight: 'bold',
    fontSize: 13,
    color: '#222',
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
    backgroundColor: '#e0e7ef',
  },
  cell: {
    width: COL_WIDTH,
    minWidth: 80,
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 4, // Un poco de padding horizontal
  },
  cellHeader: {
    width: COL_WIDTH,
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
    backgroundColor: '#e0e7ef',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cellText: {
    fontSize: 13,
    color: '#222',
    textAlign: 'center',
  },
  cellHeaderText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#222',
    textAlign: 'center',
  },
  firmaBtn: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  firmaBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  firmaMiniatura: {
    width: 120,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  firmaCard: {
    width: 220,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginRight: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  firmaCardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
    color: '#333',
  },
  firmaCardNombre: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
    minHeight: 20,
    maxHeight: 60,
  },
});

export default function ResumenSeccion() {
  // const route = useRoute();
  // const navigation = useNavigation();
  const { seccionSeleccionada } = useSeccion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [produccion, setProduccion] = useState<any[]>([]);
  const [alimento, setAlimento] = useState<any[]>([]);
  const [existencia, setExistencia] = useState<any[]>([]);
  const [envase, setEnvase] = useState<any[]>([]);
  // Estados para nombres y firmas
  const [nombreEncargado, setNombreEncargado] = useState('');
  const [nombreSupervisor, setNombreSupervisor] = useState('');
  const [nombreChofer, setNombreChofer] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Nuevo: estados para modales de nombre y observaciones
  const [modalNombre, setModalNombre] = useState<null | 'encargado' | 'supervisor' | 'chofer'>(null);
  const [modalObservaciones, setModalObservaciones] = useState(false);

  // Handlers para abrir/cerrar modales de nombre y observaciones
  const openNombreModal = (tipo: 'encargado' | 'supervisor' | 'chofer') => setModalNombre(tipo);
  const closeNombreModal = () => setModalNombre(null);
  const openObservacionesModal = () => setModalObservaciones(true);
  const closeObservacionesModal = () => setModalObservaciones(false);

  // Obtener las casetas de la sección seleccionada (usando useCasetas si es necesario)
  const granjaId = seccionSeleccionada?.GranjaID ?? null;
  const { casetas } = useCasetas(granjaId);
  const casetasFiltradas = casetas?.filter(c => c.GranjaID === granjaId) ?? [];

  // Hook para sincronización
  const { isSyncing, syncStatus, syncProduccionData } = useProduccionSync();
  const { isSyncing: isSyncingAlimento, syncStatus: syncStatusAlimento, syncAlimentoData, syncAllAlimentoData, checkSyncStatus } = useAlimentoSync();

  useEffect(() => {
    if (!granjaId) return;
    DatabaseQueries.getProduccionByFecha(fecha, granjaId).then(setProduccion);
    DatabaseQueries.getAlimentoByFecha(fecha, granjaId).then(setAlimento);
    DatabaseQueries.getExistenciaByFecha(fecha, granjaId).then(setExistencia);
    DatabaseQueries.getEnvaseByFecha(fecha, granjaId).then(setEnvase);
  }, [fecha, granjaId]);

  // Totales para cada tabla
  // Obtener solo los nombres de las casetas válidas de la sección seleccionada
  const casetasValidas = casetasFiltradas.map(c => c.Nombre);
  // Cálculo de totales solo con casetas válidas
  const totalesProduccion = useMemo(() => {
    const tot: any = {};
    columnasProduccion.forEach(col => {
      tot[col.key] = { cajas: 0, restos: 0 };
    });
    casetasValidas.forEach(caseta => {
      const row = produccion.find((r: any) => r.caseta === caseta);
      if (row) {
        columnasProduccion.forEach(col => {
          tot[col.key].cajas += Number(row[`${col.key}_cajas`] || 0);
          tot[col.key].restos += Number(row[`${col.key}_restos`] || 0);
        });
      }
    });
    return tot;
  }, [produccion, casetasValidas]);

  // Para Alimento y Existencia, usar casetasValidas y filtrar los datos igual que en Producción
  const totalesAlimento = useMemo(() => {
    let existenciaInicial = 0, entrada = 0, consumo = 0;
    (alimento ?? []).forEach((row: any) => {
      if (row && casetasValidas.includes(row.caseta)) {
        existenciaInicial += Number(row.existencia_inicial || 0);
        entrada += Number(row.entrada || 0);
        consumo += Number(row.consumo || 0);
      }
    });
    return { existenciaInicial, entrada, consumo };
  }, [alimento, casetasValidas]) || { existenciaInicial: 0, entrada: 0, consumo: 0 };

  const totalesExistencia = useMemo(() => {
    let inicial = 0, entrada = 0, mortalidad = 0, salida = 0, final = 0;
    casetasValidas.forEach(caseta => {
      const row = existencia.find((r: any) => r.caseta === caseta);
      if (row) {
        inicial += Number(row.inicial || 0);
        entrada += Number(row.entrada || 0);
        mortalidad += Number(row.mortalidad || 0);
        salida += Number(row.salida || 0);
        final += Number(row.final || 0);
      }
    });
    return { inicial, entrada, mortalidad, salida, final };
  }, [existencia, casetasValidas]);

  const totalesEnvase = useMemo(() => {
    let inicial = 0, recibido = 0, consumo = 0, final = 0;
    envase.forEach((row: any) => {
      inicial += row.inicial || 0;
      recibido += row.recibido || 0;
      consumo += row.consumo || 0;
      final += row.final || 0;
    });
    return { inicial, recibido, consumo, final };
  }, [envase]);

  // Exportar a PDF
  const exportarPDF = async () => {
    try {
      // Sincronizar todo antes de exportar
      if (!granjaId) {
        Alert.alert('Error', 'No hay sección seleccionada');
        return;
      }
      // 1. Sincronizar Producción
      try {
        await syncProduccionData(granjaId, fecha);
      } catch (error) {
        Alert.alert('Error', 'Error al sincronizar Producción. No se exportó el PDF.');
        return;
      }
      // 2. Sincronizar Alimentos
      try {
        await syncAlimentoData(granjaId, fecha);
      } catch (error) {
        Alert.alert('Error', 'Error al sincronizar Alimentos. No se exportó el PDF.');
        return;
      }
      // 3. Sincronizar Existencia
      try {
        let exitosos = 0, fallidos = 0;
        for (const row of existencia) {
          if (
            row.caseta &&
            (row.inicial > 0 || row.entrada > 0 || row.mortalidad > 0 || row.salida > 0 || row.final > 0)
          ) {
            const casetaObj = casetas.find(c => c.Nombre === row.caseta);
            const casetaId = casetaObj ? casetaObj.CasetaID : null;
            if (!casetaId) {
              fallidos++;
              continue;
            }
            const existenciaData = {
              GranjaID: granjaId,
              CasetaID: casetaId,
              Fecha: row.fecha,
              ExistenciaInicial: Number(row.inicial) || 0,
              Entrada: Number(row.entrada) || 0,
              Mortalidad: Number(row.mortalidad) || 0,
              Salida: Number(row.salida) || 0,
              Edad: Number(row.edad) || 0,
              ExistenciaFinal: Number(row.final) || 0,
              CreadoPor: 'usuarioApp'
            };
            const result = await syncExistencia(existenciaData);
            if (result.ok) exitosos++;
            else fallidos++;
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Error al sincronizar Existencia. No se exportó el PDF.');
        return;
      }
      // 4. Sincronizar Envase
      try {
        let exitosos = 0, fallidos = 0;
        for (const row of envase) {
          if (row.tipo) {
            const envaseData = {
              GranjaID: granjaId,
              Fecha: row.fecha,
              TipoEnvase: row.tipo,
              ExistenciaInicial: Number(row.inicial) || 0,
              Recibido: Number(row.recibido) || 0,
              Consumo: Number(row.consumo) || 0,
              ExistenciaFinal: Number(row.final) || 0,
              CreadoPor: 'usuarioApp'
            };
            const result = await syncEnvase(envaseData);
            if (result.ok) exitosos++;
            else fallidos++;
          }
        }
        if (fallidos > 0) {
          Alert.alert('Error', `Error al sincronizar Envase (${fallidos} fallidos). No se exportó el PDF.`);
          return;
        }
      } catch (error) {
        Alert.alert('Error', 'Error al sincronizar Envase. No se exportó el PDF.');
        return;
      }
      // Mostrar modal de exportación correcta
      // setModalExportacion(true); // Eliminar esta línea
      setTimeout(async () => {
        // setModalExportacion(false); // Eliminar esta línea
        // Si todo fue exitoso, exportar PDF
        let html = `<html><head><style>
          @page { size: A4 landscape; margin: 18px; }
          body { font-family: Arial, sans-serif; font-size: 11px; }
          .titulo { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 2px; letter-spacing: 1px; }
          .subtitulo { text-align: center; font-size: 14px; margin-bottom: 8px; }
          .encabezado { display: flex; flex-direction: row; justify-content: space-between; margin-bottom: 2px; font-size: 12px; }
          .encabezado span { font-weight: bold; }
          .tabla-prod { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
          .tabla-prod th, .tabla-prod td { border: 1px solid #333; padding: 2px 3px; text-align: center; font-size: 10px; }
          .tabla-prod th { background: #e0e7ef; font-size: 10px; }
          .tabla-bloque { font-weight: bold; font-size: 12px; margin: 6px 0 2px 0; text-align: left; }
          .tablas-inferiores { display: flex; flex-direction: row; gap: 6px; margin-top: 2px; }
          .tabla-mini { border-collapse: collapse; width: 100%; font-size: 9.5px; }
          .tabla-mini th, .tabla-mini td { border: 1px solid #333; padding: 2px 2px; text-align: center; }
          .tabla-mini th { background: #e0e7ef; font-size: 9.5px; }
          .obs { margin: 10px 0 0 0; font-size: 10px; border: 1px solid #333; min-height: 22px; padding: 2px 6px; }
          .firmas { margin-top: 12px; display: flex; flex-direction: row; justify-content: space-between; }
          .firma-block { flex: 1; text-align: center; font-size: 10px; }
          .firma-label { border-top: none; margin-top: 8px; padding-top: 2px; font-size: 9px; }
          .firma-line { border-top: 1px solid #333; width: 70%; margin: 18px auto 2px auto; height: 0; }
        </style></head><body>`;
        html += `<div class='titulo'>UNION AGROPECUARIA ALZE SA DE CV.</div>`;
        html += `<div class='subtitulo'>REPORTE DE PRODUCCIÓN DIARIA EN GRANJAS</div>`;
        html += `<div class='encabezado'><span>SECCIÓN: ${seccionSeleccionada?.Nombre || ''}</span><span>FECHA: ${fecha}</span></div>`;
        // PRODUCCIÓN
        html += `<div class='tabla-bloque'>PRODUCCIÓN</div>`;
        html += `<table class='tabla-prod'><tr><th rowspan='2'>CASETA</th>`;
        columnasProduccion.forEach(col => {
          html += `<th colspan='2'>${col.label}</th>`;
        });
        html += `</tr><tr>`;
        columnasProduccion.forEach(() => {
          html += `<th>Cajas</th><th>Restos</th>`;
        });
        html += `</tr>`;
        casetasFiltradas.forEach(caseta => {
          const row = produccion.find((r: any) => r.caseta === caseta.Nombre) || {};
          html += `<tr><td>${caseta.Nombre}</td>`;
          columnasProduccion.forEach(col => {
            html += `<td>${row[`${col.key}_cajas`] || ''}</td><td>${row[`${col.key}_restos`] || ''}</td>`;
          });
          html += `</tr>`;
        });
        // Totales Producción
        html += `<tr><td><b>TOTAL</b></td>`;
        columnasProduccion.forEach(col => {
          html += `<td><b>${totalesProduccion[col.key].cajas}</b></td><td><b>${totalesProduccion[col.key].restos}</b></td>`;
        });
        html += `</tr></table>`;
        // Tablas inferiores alineadas horizontalmente
        html += `<div class='tablas-inferiores'>`;
        // ALIMENTO
        html += `<div style='flex:1;'><div class='tabla-bloque'>ALIMENTO</div>`;
        html += `<table class='tabla-mini'><tr><th>CASETA</th><th>EXIST. INICIAL</th><th>ENTRADA</th><th>CONSUMO</th><th>TIPO</th></tr>`;
        casetasValidas.forEach(caseta => {
          const row = alimento.find((r: any) => r.caseta === caseta) || {};
          html += `<tr><td>${caseta}</td><td>${row.existencia_inicial || ''}</td><td>${row.entrada || ''}</td><td>${row.consumo || ''}</td><td>${row.tipo || ''}</td></tr>`;
        });
        html += `<tr><td><b>TOTAL</b></td><td><b>${totalesAlimento?.existenciaInicial ?? 0}</b></td><td><b>${totalesAlimento?.entrada ?? 0}</b></td><td><b>${totalesAlimento?.consumo ?? 0}</b></td><td></td></tr></table></div>`;
        // EXISTENCIA
        html += `<div style='flex:1;'><div class='tabla-bloque'>EXISTENCIA</div>`;
        html += `<table class='tabla-mini'><tr><th>CASETA</th><th>EXIST. INICIAL</th><th>ENTRADA</th><th>MORTALIDAD</th><th>SALIDA</th><th>EDAD</th><th>EXIST. FINAL</th></tr>`;
        casetasValidas.forEach(caseta => {
          const row = existencia.find((r: any) => r.caseta === caseta) || {};
          html += `<tr><td>${caseta}</td><td>${row.inicial || ''}</td><td>${row.entrada || ''}</td><td>${row.mortalidad || ''}</td><td>${row.salida || ''}</td><td>${row.edad || ''}</td><td>${row.final || ''}</td></tr>`;
        });
        html += `<tr><td><b>TOTAL</b></td><td><b>${totalesExistencia.inicial}</b></td><td><b>${totalesExistencia.entrada}</b></td><td><b>${totalesExistencia.mortalidad}</b></td><td><b>${totalesExistencia.salida}</b></td><td></td><td><b>${totalesExistencia.final}</b></td></tr></table></div>`;
        // ENVASE
        html += `<div style='flex:1;'><div class='tabla-bloque'>ENVASE</div>`;
        html += `<table class='tabla-mini'><tr><th>TIPO</th><th>EXIST. INICIAL</th><th>RECIBIDO</th><th>CONSUMO</th><th>EXIST. FINAL</th></tr>`;
        envases.forEach(envaseTipo => {
          const row = envase.find((r: any) => r.tipo === envaseTipo) || {};
          html += `<tr><td>${envaseTipo}</td><td>${row.inicial || ''}</td><td>${row.recibido || ''}</td><td>${row.consumo || ''}</td><td>${row.final || ''}</td></tr>`;
        });
        html += `<tr><td><b>TOTAL</b></td><td><b>${totalesEnvase.inicial}</b></td><td><b>${totalesEnvase.recibido}</b></td><td><b>${totalesEnvase.consumo}</b></td><td><b>${totalesEnvase.final}</b></td></tr></table></div>`;
        html += `</div>`;
        // OBSERVACIONES
        html += `<div class='obs'>OBS.</div>`;
        // FIRMAS SOLO LÍNEAS Y ETIQUETAS, CADA UNA INDEPENDIENTE
        html += `<div class='firmas'>
          <div class='firma-block'><div class='firma-line'></div><div class='firma-label'>FIRMA Y NOMBRE ENCARGADO</div></div>
          <div class='firma-block'><div class='firma-line'></div><div class='firma-label'>FIRMA Y NOMBRE SUPERVISOR</div></div>
          <div class='firma-block'><div class='firma-line'></div><div class='firma-label'>FIRMA Y NOMBRE DE CHOFER</div></div>
        </div>`;
        html += `</body></html>`;
        await Print.printAsync({ html });
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar el PDF.');
    }
  };

  // Estado para mostrar el modal de eliminación
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);

  // Función para eliminar datos de una tabla específica
  const eliminarDatosTabla = async (tabla: 'produccion' | 'alimento' | 'existencia' | 'envase' | 'todas') => {
    try {
      if (tabla === 'todas') {
        await DatabaseQueries.clearAllData();
        DatabaseQueries.getProduccionByFecha(fecha, granjaId).then(setProduccion);
        DatabaseQueries.getAlimentoByFecha(fecha, granjaId).then(setAlimento);
        DatabaseQueries.getExistenciaByFecha(fecha, granjaId).then(setExistencia);
        DatabaseQueries.getEnvaseByFecha(fecha, granjaId).then(setEnvase);
        Alert.alert('Datos eliminados', 'Todos los datos han sido eliminados.');
      } else if (tabla === 'produccion') {
        await DatabaseQueries.deleteProduccionByFecha(fecha, granjaId);
        DatabaseQueries.getProduccionByFecha(fecha, granjaId).then(setProduccion);
        Alert.alert('Datos eliminados', 'Datos de Producción eliminados.');
      } else if (tabla === 'alimento') {
        await DatabaseQueries.deleteAlimentoByFecha(fecha, granjaId);
        DatabaseQueries.getAlimentoByFecha(fecha, granjaId).then(setAlimento);
        Alert.alert('Datos eliminados', 'Datos de Alimento eliminados.');
      } else if (tabla === 'existencia') {
        await DatabaseQueries.deleteExistenciaByFecha(fecha, granjaId);
        DatabaseQueries.getExistenciaByFecha(fecha, granjaId).then(setExistencia);
        Alert.alert('Datos eliminados', 'Datos de Existencia eliminados.');
      } else if (tabla === 'envase') {
        await DatabaseQueries.deleteEnvaseByFecha(fecha, granjaId);
        DatabaseQueries.getEnvaseByFecha(fecha, granjaId).then(setEnvase);
        Alert.alert('Datos eliminados', 'Datos de Envase eliminados.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron eliminar los datos.');
    } finally {
      setModalEliminarVisible(false);
    }
  };

  const handleEliminarDatos = async () => {
    try {
      await DatabaseQueries.clearAllData();
      // Recarga los datos
      DatabaseQueries.getProduccionByFecha(fecha, granjaId).then(setProduccion);
      DatabaseQueries.getAlimentoByFecha(fecha, granjaId).then(setAlimento);
      DatabaseQueries.getExistenciaByFecha(fecha, granjaId).then(setExistencia);
      DatabaseQueries.getEnvaseByFecha(fecha, granjaId).then(setEnvase);
      // No mostrar ninguna alerta ni modal
    } catch (error) {
      Alert.alert('Error', 'No se pudieron eliminar los datos.');
    }
  };

  const handleSincronizarProduccion = async () => {
    if (!granjaId) {
      Alert.alert('Error', 'No hay sección seleccionada');
      return;
    }

    Alert.alert(
      'Sincronizar Producción',
      `¿Deseas sincronizar los datos de producción de la sección "${seccionSeleccionada?.Nombre}" para la fecha ${fecha}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            try {
              await syncProduccionData(granjaId, fecha);
              Alert.alert('Éxito', syncStatus || 'Sincronización completada');
            } catch (error) {
              Alert.alert('Error', `Error en sincronización: ${error}`);
            }
          }
        }
      ]
    );
  };

  const handleSincronizarAlimento = async () => {
    if (!granjaId) {
      Alert.alert('Error', 'No hay sección seleccionada');
      return;
    }

    Alert.alert(
      'Sincronizar Alimentos',
      `¿Deseas sincronizar los datos de alimentos de la sección "${seccionSeleccionada?.Nombre}" para la fecha ${fecha}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            try {
              await syncAlimentoData(granjaId, fecha);
              Alert.alert('Éxito', 'Exportación correcta');
            } catch (error) {
              Alert.alert('Error', `Error en sincronización: ${error}`);
            }
          }
        }
      ]
    );
  };

  const handleSincronizarExistencia = async () => {
    if (!granjaId) {
      Alert.alert('Error', 'No hay sección seleccionada');
      return;
    }
    Alert.alert(
      'Sincronizar Existencias',
      `¿Deseas sincronizar los datos de existencias de la sección "${seccionSeleccionada?.Nombre}" para la fecha ${fecha}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            try {
              let exitosos = 0, fallidos = 0;
              for (const row of existencia) {
                // Solo sincroniza si hay datos válidos
                if (
                  row.caseta &&
                  (row.inicial > 0 || row.entrada > 0 || row.mortalidad > 0 || row.salida > 0 || row.final > 0)
                ) {
                  // Mapear nombre de caseta a su ID real
                  const casetaObj = casetas.find(c => c.Nombre === row.caseta);
                  const casetaId = casetaObj ? casetaObj.CasetaID : null;
                  if (!casetaId) {
                    console.log('❌ No se encontró el ID para la caseta:', row.caseta);
                    fallidos++;
                    continue;
                  }
                  const existenciaData = {
                    GranjaID: granjaId,
                    CasetaID: casetaId,
                    Fecha: row.fecha,
                    ExistenciaInicial: Number(row.inicial) || 0,
                    Entrada: Number(row.entrada) || 0,
                    Mortalidad: Number(row.mortalidad) || 0,
                    Salida: Number(row.salida) || 0,
                    Edad: Number(row.edad) || 0,
                    ExistenciaFinal: Number(row.final) || 0,
                    CreadoPor: 'usuarioApp' // O el nombre real del usuario si lo tienes
                  };
                  console.log('Enviando existencia:', existenciaData);
                  try {
                    const result = await syncExistencia(existenciaData);
                    if (result.ok) exitosos++;
                    else fallidos++;
                  } catch (error) {
                    console.log('❌ Error al sincronizar existencia:', error);
                    fallidos++;
                  }
                }
              }
              if (fallidos === 0) {
                Alert.alert('Éxito', `Sincronización completada: ${exitosos} registros subidos exitosamente`);
              } else if (exitosos > 0) {
                Alert.alert('Parcial', `Sincronización parcial: ${exitosos} exitosos, ${fallidos} fallidos`);
              } else {
                Alert.alert('Error', `Sincronización fallida: ${fallidos} registros fallidos`);
              }
            } catch (error) {
              Alert.alert('Error', `Error en sincronización: ${error}`);
            }
          }
        }
      ]
    );
  };

  const handleSincronizarEnvase = async () => {
    if (!granjaId) {
      Alert.alert('Error', 'No hay sección seleccionada');
      return;
    }
    Alert.alert(
      'Sincronizar Envases',
      `¿Deseas sincronizar los datos de envases de la sección "${seccionSeleccionada?.Nombre}" para la fecha ${fecha}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            try {
              let exitosos = 0, fallidos = 0;
              for (const row of envase) {
                if (row.tipo) {
                  const envaseData = {
                    GranjaID: granjaId,
                    Fecha: row.fecha,
                    TipoEnvase: row.tipo,
                    ExistenciaInicial: Number(row.inicial) || 0,
                    Recibido: Number(row.recibido) || 0,
                    Consumo: Number(row.consumo) || 0,
                    ExistenciaFinal: Number(row.final) || 0,
                    CreadoPor: 'usuarioApp'
                  };
                  try {
                    const result = await syncEnvase(envaseData);
                    if (result.ok) exitosos++;
                    else fallidos++;
                  } catch (error) {
                    console.log('❌ Error al sincronizar envase:', error);
                    fallidos++;
                  }
                }
              }
              if (fallidos === 0) {
                Alert.alert('Éxito', `Sincronización completada: ${exitosos} registros subidos exitosamente`);
              } else if (exitosos > 0) {
                Alert.alert('Parcial', `Sincronización parcial: ${exitosos} exitosos, ${fallidos} fallidos`);
              } else {
                Alert.alert('Error', `Sincronización fallida: ${fallidos} registros fallidos`);
              }
            } catch (error) {
              Alert.alert('Error', `Error en sincronización: ${error}`);
            }
          }
        }
      ]
    );
  };

  // Estado para mostrar el modal de exportación
  const [modalExportacion, setModalExportacion] = useState(false);

  // Eliminar toda referencia a modalEliminado y el Modal correspondiente
  // Eliminar los modales de edición de nombre y observaciones
  // Modal personalizado para exportación
  const [modalEliminado, setModalEliminado] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.replace('Menu')}
          >
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">Resumen de la sección {seccionSeleccionada?.Nombre}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerFecha}>{fecha}</Text>
      </SafeAreaView>
      <ScrollView>
        {/* Producción */}
        <Text style={styles.sectionTitle}>Producción</Text>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={{ flexDirection: 'row' }}>
              {[{ label: 'CASETA' }, ...columnasProduccion.map(col => ({ label: col.label + ' Cajas' })), ...columnasProduccion.map(col => ({ label: col.label + ' Restos' }))].map((col, idx, arr) => (
                <View
                  key={col.label}
                  style={[
                    styles.cellHeader,
                    idx === arr.length - 1 && { borderRightWidth: 0 }
                  ]}
                >
                  <Text style={styles.cellHeaderText}>{col.label}</Text>
                </View>
              ))}
            </View>
            {casetasValidas.map((caseta, idx) => {
              const row = produccion.find((r: any) => r.caseta === caseta) || {};
              const cells = [
                <View key="caseta" style={styles.cell}><Text style={styles.cellText}>{caseta}</Text></View>,
                ...columnasProduccion.map(col => (
                  <View key={col.label} style={styles.cell}><Text style={styles.cellText}>{row[`${col.key}_cajas`] ?? ' '}</Text></View>
                )),
                ...columnasProduccion.map(col => (
                  <View key={col.label + 'r'} style={styles.cell}><Text style={styles.cellText}>{row[`${col.key}_restos`] ?? ' '}</Text></View>
                ))
              ];
              return (
                <View key={caseta} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt, { flexDirection: 'row' }]}> 
                  {cells.map((cell, i) =>
                    React.cloneElement(cell, {
                      style: [cell.props.style, i === cells.length - 1 && { borderRightWidth: 0 }]
                    })
                  )}
                </View>
              );
            })}
            {/* Totales */}
            <View style={[styles.dataRow, { flexDirection: 'row' }]}> 
              {[
                <View key="total" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>TOTAL</Text></View>,
                ...columnasProduccion.map(col => (
                  <View key={col.label} style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesProduccion[col.key].cajas}</Text></View>
                )),
                ...columnasProduccion.map(col => (
                  <View key={col.label + 'r'} style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesProduccion[col.key].restos}</Text></View>
                ))
              ].map((cell, i, arr) =>
                React.cloneElement(cell, {
                  style: [cell.props.style, i === arr.length - 1 && { borderRightWidth: 0 }]
                })
              )}
            </View>
          </View>
        </ScrollView>
        {/* Alimento */}
        <Text style={styles.sectionTitle}>Alimento</Text>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={{ flexDirection: 'row' }}>
              {[{ label: 'CASETA' }, { label: 'EXISTENCIA INICIAL' }, { label: 'ENTRADA' }, { label: 'CONSUMO' }, { label: 'TIPO' }].map((col, idx, arr) => (
                <View
                  key={col.label}
                  style={[
                    styles.cellHeader,
                    idx === arr.length - 1 && { borderRightWidth: 0 }
                  ]}
                >
                  <Text style={styles.cellHeaderText}>{col.label}</Text>
                </View>
              ))}
            </View>
            {casetasValidas.map((caseta, idx) => {
              const row = alimento.find((r: any) => r.caseta === caseta) || {};
              const cells = [
                <View key="caseta" style={styles.cell}><Text style={styles.cellText}>{caseta}</Text></View>,
                <View key="existencia_inicial" style={styles.cell}><Text style={styles.cellText}>{row.existencia_inicial || ''}</Text></View>,
                <View key="entrada" style={styles.cell}><Text style={styles.cellText}>{row.entrada || ''}</Text></View>,
                <View key="consumo" style={styles.cell}><Text style={styles.cellText}>{row.consumo || ''}</Text></View>,
                <View key="tipo" style={styles.cell}><Text style={styles.cellText}>{row.tipo || ''}</Text></View>,
              ];
              return (
                <View key={caseta} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt, { flexDirection: 'row' }]}> 
                  {cells.map((cell, i) =>
                    React.cloneElement(cell, {
                      style: [cell.props.style, i === cells.length - 1 && { borderRightWidth: 0 }]
                    })
                  )}
                </View>
              );
            })}
            <View style={[styles.dataRow, { flexDirection: 'row' }]}> 
              {[
                <View key="total" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>TOTAL</Text></View>,
                <View key="existencia_inicial" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{(totalesAlimento && typeof totalesAlimento.existenciaInicial === 'number') ? totalesAlimento.existenciaInicial : 0}</Text></View>,
                <View key="entrada" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{(totalesAlimento && typeof totalesAlimento.entrada === 'number') ? totalesAlimento.entrada : 0}</Text></View>,
                <View key="consumo" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{(totalesAlimento && typeof totalesAlimento.consumo === 'number') ? totalesAlimento.consumo : 0}</Text></View>,
                <View key="tipo" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}></Text></View>,
              ].map((cell, i, arr) =>
                React.cloneElement(cell, {
                  style: [cell.props.style, i === arr.length - 1 && { borderRightWidth: 0 }]
                })
              )}
            </View>
          </View>
        </ScrollView>
        {/* Existencia */}
        <Text style={styles.sectionTitle}>Existencia</Text>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={{ flexDirection: 'row' }}>
              {[{ label: 'CASETA' }, { label: 'EXIST. INICIAL' }, { label: 'ENTRADA' }, { label: 'MORTALIDAD' }, { label: 'SALIDA' }, { label: 'EDAD' }, { label: 'EXIST. FINAL' }].map((col, idx, arr) => (
                <View
                  key={col.label}
                  style={[
                    styles.cellHeader,
                    idx === arr.length - 1 && { borderRightWidth: 0 }
                  ]}
                >
                  <Text style={styles.cellHeaderText}>{col.label}</Text>
                </View>
              ))}
            </View>
            {casetasValidas.map((caseta, idx) => {
              const row = existencia.find((r: any) => r.caseta === caseta) || {};
              const cells = [
                <View key="caseta" style={styles.cell}><Text style={styles.cellText}>{caseta}</Text></View>,
                <View key="inicial" style={styles.cell}><Text style={styles.cellText}>{row.inicial || ''}</Text></View>,
                <View key="entrada" style={styles.cell}><Text style={styles.cellText}>{row.entrada || ''}</Text></View>,
                <View key="mortalidad" style={styles.cell}><Text style={styles.cellText}>{row.mortalidad || ''}</Text></View>,
                <View key="salida" style={styles.cell}><Text style={styles.cellText}>{row.salida || ''}</Text></View>,
                <View key="edad" style={styles.cell}><Text style={styles.cellText}>{row.edad || ''}</Text></View>,
                <View key="final" style={styles.cell}><Text style={styles.cellText}>{row.final || ''}</Text></View>,
              ];
              return (
                <View key={caseta} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt, { flexDirection: 'row' }]}> 
                  {cells.map((cell, i) =>
                    React.cloneElement(cell, {
                      style: [cell.props.style, i === cells.length - 1 && { borderRightWidth: 0 }]
                    })
                  )}
                </View>
              );
            })}
            <View style={[styles.dataRow, { flexDirection: 'row' }]}> 
              {[
                <View key="total" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>TOTAL</Text></View>,
                <View key="inicial" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesExistencia.inicial}</Text></View>,
                <View key="entrada" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesExistencia.entrada}</Text></View>,
                <View key="mortalidad" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesExistencia.mortalidad}</Text></View>,
                <View key="salida" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesExistencia.salida}</Text></View>,
                <View key="edad" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}></Text></View>,
                <View key="final" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesExistencia.final}</Text></View>,
              ].map((cell, i, arr) =>
                React.cloneElement(cell, {
                  style: [cell.props.style, i === arr.length - 1 && { borderRightWidth: 0 }]
                })
              )}
            </View>
          </View>
        </ScrollView>
        {/* Envase */}
        <Text style={styles.sectionTitle}>Envase</Text>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={{ flexDirection: 'row' }}>
              {[{ label: 'TIPO' }, { label: 'EXIST. INICIAL' }, { label: 'RECIBIDO' }, { label: 'CONSUMO' }, { label: 'EXIST. FINAL' }].map((col, idx, arr) => (
                <View
                  key={col.label}
                  style={[
                    styles.cellHeader,
                    idx === arr.length - 1 && { borderRightWidth: 0 }
                  ]}
                >
                  <Text style={styles.cellHeaderText}>{col.label}</Text>
                </View>
              ))}
            </View>
            {envases.map((envaseTipo, idx) => {
              const row = envase.find((r: any) => r.tipo === envaseTipo) || {};
              const cells = [
                <View key="tipo" style={styles.cell}><Text style={styles.cellText}>{envaseTipo}</Text></View>,
                <View key="inicial" style={styles.cell}><Text style={styles.cellText}>{row.inicial || ''}</Text></View>,
                <View key="recibido" style={styles.cell}><Text style={styles.cellText}>{row.recibido || ''}</Text></View>,
                <View key="consumo" style={styles.cell}><Text style={styles.cellText}>{row.consumo || ''}</Text></View>,
                <View key="final" style={styles.cell}><Text style={styles.cellText}>{row.final || ''}</Text></View>,
              ];
              return (
                <View key={envaseTipo} style={[styles.dataRow, { flexDirection: 'row', backgroundColor: '#fff' }]}> 
                  {cells.map((cell, i) =>
                    React.cloneElement(cell, {
                      style: [cell.props.style, i === cells.length - 1 && { borderRightWidth: 0 }]
                    })
                  )}
                </View>
              );
            })}
            <View style={[styles.dataRow, { flexDirection: 'row', backgroundColor: '#fff' }]}> 
              {[
                <View key="total" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>TOTAL</Text></View>,
                <View key="inicial" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesEnvase.inicial}</Text></View>,
                <View key="recibido" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesEnvase.recibido}</Text></View>,
                <View key="consumo" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesEnvase.consumo}</Text></View>,
                <View key="final" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesEnvase.final}</Text></View>,
              ].map((cell, i, arr) =>
                React.cloneElement(cell, {
                  style: [cell.props.style, i === arr.length - 1 && { borderRightWidth: 0 }]
                })
              )}
            </View>
          </View>
        </ScrollView>
        {/* Botón exportar */}
        <TouchableOpacity style={styles.btnExportar} onPress={exportarPDF}>
          <Image source={require('../../assets/Iconos/PDF.png')} style={styles.resumenIcon} resizeMode="contain" />
          <Text style={styles.btnExportarText}>Exportar a PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnExportar, { backgroundColor: '#dc3545', marginTop: 0 }]}
          onPress={() => setModalEliminarVisible(true)}
        >
          <Ionicons name="trash" size={24} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.btnExportarText}>Eliminar datos</Text>
        </TouchableOpacity>
        <Modal isVisible={modalEliminarVisible} onBackdropPress={() => setModalEliminarVisible(false)}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>¿Qué datos deseas eliminar?</Text>
            <TouchableOpacity style={{ marginVertical: 8 }} onPress={() => eliminarDatosTabla('produccion')}>
              <Text style={{ fontSize: 16, color: '#dc3545', textAlign: 'center' }}>Producción</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginVertical: 8 }} onPress={() => eliminarDatosTabla('alimento')}>
              <Text style={{ fontSize: 16, color: '#dc3545', textAlign: 'center' }}>Alimento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginVertical: 8 }} onPress={() => eliminarDatosTabla('existencia')}>
              <Text style={{ fontSize: 16, color: '#dc3545', textAlign: 'center' }}>Existencia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginVertical: 8 }} onPress={() => eliminarDatosTabla('envase')}>
              <Text style={{ fontSize: 16, color: '#dc3545', textAlign: 'center' }}>Envase</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginVertical: 8 }} onPress={() => eliminarDatosTabla('todas')}>
              <Text style={{ fontSize: 16, color: '#fff', backgroundColor: '#dc3545', borderRadius: 6, padding: 8, textAlign: 'center' }}>Todas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setModalEliminarVisible(false)}>
              <Text style={{ fontSize: 15, color: '#007bff', textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        
        {syncStatus ? (
          <View style={{ padding: 10, margin: 16, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
            <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center' }}>{syncStatus}</Text>
          </View>
        ) : null}
        
        {syncStatusAlimento ? (
          <View style={{ padding: 10, margin: 16, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
            <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center' }}>{syncStatusAlimento}</Text>
          </View>
        ) : null}
        {/* Eliminar la sección de botones y modales de nombres y observaciones */}
      </ScrollView>
      {/* Eliminar el RNScrollView con los botones de encargado, supervisor, chofer y observaciones */}
      {/* Eliminar los modales de edición de nombre y observaciones */}
      {/* Modal personalizado para exportación */}
      <Modal isVisible={modalExportacion}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', minWidth: 260 }}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#1db954" style={{ marginBottom: 12 }} />
          <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 10, color: '#2a3a4b', textAlign: 'center' }}>Exportación correcta</Text>
        </View>
      </Modal>
      {/* Eliminar la sección de botones y modales de nombres y observaciones */}
    </SafeAreaView>
  );
}