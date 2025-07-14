import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { DatabaseQueries } from '../database/offline/queries';
import * as Print from 'expo-print';
import { useSeccion } from './EnvaseScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);
const columnasProduccion = [
  'BLANCO', 'ROTO 1', 'ROTO 2', 'MANCHADO', 'FRAGIL 1', 'FRAGIL 2', 'YEMA', 'B1', 'EXTRA 240PZS'
];
const envases = [
  'CAJA TIPO A', 'SEPARADOR TIPO A', 'CAJA TIPO B', 'SEPARADOR TIPO B',
  'CONO', 'CONO 240 PZS', 'CONO ESTRELLA', 'CINTA', 'CINTA BLANCA'
];

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
  const [firmaEncargado, setFirmaEncargado] = useState('');
  const [nombreSupervisor, setNombreSupervisor] = useState('');
  const [firmaSupervisor, setFirmaSupervisor] = useState('');
  const [nombreChofer, setNombreChofer] = useState('');
  const [firmaChofer, setFirmaChofer] = useState('');

  useEffect(() => {
    DatabaseQueries.getProduccionByFecha(fecha).then(setProduccion);
    DatabaseQueries.getAlimentoByFecha(fecha).then(setAlimento);
    DatabaseQueries.getExistenciaByFecha(fecha).then(setExistencia);
    DatabaseQueries.getEnvaseByFecha(fecha).then(setEnvase);
  }, [fecha]);

  // Totales para cada tabla
  const totalesProduccion = useMemo(() => {
    const tot: any = {};
    columnasProduccion.forEach(col => {
      tot[col] = { cajas: 0, restos: 0 };
    });
    produccion.forEach((row: any) => {
      columnasProduccion.forEach(col => {
        tot[col].cajas += row[`${col.toLowerCase()}_cajas`] || 0;
        tot[col].restos += row[`${col.toLowerCase()}_restos`] || 0;
      });
    });
    return tot;
  }, [produccion]);

  const totalesAlimento = useMemo(() => {
    let existenciaInicial = 0, entrada = 0, consumo = 0;
    alimento.forEach((row: any) => {
      existenciaInicial += row.existencia_inicial || 0;
      entrada += row.entrada || 0;
      consumo += row.consumo || 0;
    });
    return { existenciaInicial, entrada, consumo };
  }, [alimento]);

  const totalesExistencia = useMemo(() => {
    let inicial = 0, entrada = 0, mortalidad = 0, salida = 0, final = 0;
    existencia.forEach((row: any) => {
      inicial += row.inicial || 0;
      entrada += row.entrada || 0;
      mortalidad += row.mortalidad || 0;
      salida += row.salida || 0;
      final += row.final || 0;
    });
    return { inicial, entrada, mortalidad, salida, final };
  }, [existencia]);

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
      html += `<div class='encabezado'><span>SECCIÓN: ${seccionSeleccionada || ''}</span><span>FECHA: ${fecha}</span></div>`;
      // PRODUCCIÓN
      html += `<div class='tabla-bloque'>PRODUCCIÓN</div>`;
      html += `<table class='tabla-prod'><tr><th rowspan='2'>CASETA</th>`;
      columnasProduccion.forEach(col => {
        html += `<th colspan='2'>${col}</th>`;
      });
      html += `</tr><tr>`;
      columnasProduccion.forEach(() => {
        html += `<th>Cajas</th><th>Restos</th>`;
      });
      html += `</tr>`;
      casetas.forEach(caseta => {
        const row = produccion.find((r: any) => r.caseta === caseta) || {};
        html += `<tr><td>${caseta}</td>`;
        columnasProduccion.forEach(col => {
          html += `<td>${row[`${col.toLowerCase()}_cajas`] || ''}</td><td>${row[`${col.toLowerCase()}_restos`] || ''}</td>`;
        });
        html += `</tr>`;
      });
      // Totales Producción
      html += `<tr><td><b>TOTAL</b></td>`;
      columnasProduccion.forEach(col => {
        html += `<td><b>${totalesProduccion[col].cajas}</b></td><td><b>${totalesProduccion[col].restos}</b></td>`;
      });
      html += `</tr></table>`;
      // Tablas inferiores alineadas horizontalmente
      html += `<div class='tablas-inferiores'>`;
      // ALIMENTO
      html += `<div style='flex:1;'><div class='tabla-bloque'>ALIMENTO</div>`;
      html += `<table class='tabla-mini'><tr><th>CASETA</th><th>EXIST. INICIAL</th><th>ENTRADA</th><th>CONSUMO</th><th>TIPO</th></tr>`;
      casetas.forEach(caseta => {
        const row = alimento.find((r: any) => r.caseta === caseta) || {};
        html += `<tr><td>${caseta}</td><td>${row.existencia_inicial || ''}</td><td>${row.entrada || ''}</td><td>${row.consumo || ''}</td><td>${row.tipo || ''}</td></tr>`;
      });
      html += `<tr><td><b>TOTAL</b></td><td><b>${totalesAlimento.existenciaInicial}</b></td><td><b>${totalesAlimento.entrada}</b></td><td><b>${totalesAlimento.consumo}</b></td><td></td></tr></table></div>`;
      // EXISTENCIA
      html += `<div style='flex:1;'><div class='tabla-bloque'>EXISTENCIA</div>`;
      html += `<table class='tabla-mini'><tr><th>CASETA</th><th>EXIST. INICIAL</th><th>ENTRADA</th><th>MORTALIDAD</th><th>SALIDA</th><th>EDAD</th><th>EXIST. FINAL</th></tr>`;
      casetas.forEach(caseta => {
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
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar el PDF.');
    }
  };

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
          <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">Resumen de la sección {seccionSeleccionada}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerFecha}>{fecha}</Text>
      </SafeAreaView>
      <ScrollView>
        {/* Producción */}
        <Text style={styles.sectionTitle}>Producción</Text>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>CASETA</Text>
              {columnasProduccion.map(col => (
                <Text key={col} style={styles.headerCell}>{col} Cajas</Text>
              ))}
              {columnasProduccion.map(col => (
                <Text key={col + 'r'} style={styles.headerCell}>{col} Restos</Text>
              ))}
            </View>
            {casetas.map((caseta, idx) => {
              const row = produccion.find((r: any) => r.caseta === caseta) || {};
              return (
                <View key={caseta} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt]}>
                  <Text style={styles.casetaCell}>{caseta}</Text>
                  {columnasProduccion.map(col => (
                    <Text key={col} style={styles.inputCell}>{row[`${col.toLowerCase()}_cajas`] ?? ' '}</Text>
                  ))}
                  {columnasProduccion.map(col => (
                    <Text key={col + 'r'} style={styles.inputCell}>{row[`${col.toLowerCase()}_restos`] ?? ' '}</Text>
                  ))}
                </View>
              );
            })}
            {/* Totales */}
            <View style={[styles.dataRow, { backgroundColor: '#e0e7ef' }]}> 
              <Text style={[styles.casetaCell, { fontWeight: 'bold' }]}>TOTAL</Text>
              {columnasProduccion.map(col => (
                <Text key={col} style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesProduccion[col].cajas}</Text>
              ))}
              {columnasProduccion.map(col => (
                <Text key={col + 'r'} style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesProduccion[col].restos}</Text>
              ))}
            </View>
          </View>
        </ScrollView>
        {/* Alimento */}
        <Text style={styles.sectionTitle}>Alimento</Text>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>CASETA</Text>
              <Text style={styles.headerCell}>EXISTENCIA INICIAL</Text>
              <Text style={styles.headerCell}>ENTRADA</Text>
              <Text style={styles.headerCell}>CONSUMO</Text>
              <Text style={styles.headerCell}>TIPO</Text>
            </View>
            {casetas.map((caseta, idx) => {
              const row = alimento.find((r: any) => r.caseta === caseta) || {};
              return (
                <View key={caseta} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt]}>
                  <Text style={styles.casetaCell}>{caseta}</Text>
                  <Text style={styles.inputCell}>{row.existencia_inicial || ''}</Text>
                  <Text style={styles.inputCell}>{row.entrada || ''}</Text>
                  <Text style={styles.inputCell}>{row.consumo || ''}</Text>
                  <Text style={styles.inputCell}>{row.tipo || ''}</Text>
                </View>
              );
            })}
            <View style={[styles.dataRow, { backgroundColor: '#e0e7ef' }]}> 
              <Text style={[styles.casetaCell, { fontWeight: 'bold' }]}>TOTAL</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesAlimento.existenciaInicial}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesAlimento.entrada}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesAlimento.consumo}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}></Text>
            </View>
          </View>
        </ScrollView>
        {/* Existencia */}
        <Text style={styles.sectionTitle}>Existencia</Text>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>CASETA</Text>
              <Text style={styles.headerCell}>EXIST. INICIAL</Text>
              <Text style={styles.headerCell}>ENTRADA</Text>
              <Text style={styles.headerCell}>MORTALIDAD</Text>
              <Text style={styles.headerCell}>SALIDA</Text>
              <Text style={styles.headerCell}>EDAD</Text>
              <Text style={styles.headerCell}>EXIST. FINAL</Text>
            </View>
            {casetas.map((caseta, idx) => {
              const row = existencia.find((r: any) => r.caseta === caseta) || {};
              return (
                <View key={caseta} style={[styles.dataRow, idx % 2 === 1 && styles.dataRowAlt]}>
                  <Text style={styles.casetaCell}>{caseta}</Text>
                  <Text style={styles.inputCell}>{row.inicial || ''}</Text>
                  <Text style={styles.inputCell}>{row.entrada || ''}</Text>
                  <Text style={styles.inputCell}>{row.mortalidad || ''}</Text>
                  <Text style={styles.inputCell}>{row.salida || ''}</Text>
                  <Text style={styles.inputCell}>{row.edad || ''}</Text>
                  <Text style={styles.inputCell}>{row.final || ''}</Text>
                </View>
              );
            })}
            <View style={[styles.dataRow, { backgroundColor: '#e0e7ef' }]}> 
              <Text style={[styles.casetaCell, { fontWeight: 'bold' }]}>TOTAL</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesExistencia.inicial}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesExistencia.entrada}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesExistencia.mortalidad}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesExistencia.salida}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}></Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesExistencia.final}</Text>
            </View>
          </View>
        </ScrollView>
        {/* Envase */}
        <Text style={styles.sectionTitle}>Envase</Text>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>TIPO</Text>
              <Text style={styles.headerCell}>EXIST. INICIAL</Text>
              <Text style={styles.headerCell}>RECIBIDO</Text>
              <Text style={styles.headerCell}>CONSUMO</Text>
              <Text style={styles.headerCell}>EXIST. FINAL</Text>
            </View>
            {envases.map(envaseTipo => {
              const row = envase.find((r: any) => r.tipo === envaseTipo) || {};
              return (
                <View key={envaseTipo} style={styles.dataRow}>
                  <Text style={styles.casetaCell}>{envaseTipo}</Text>
                  <Text style={styles.inputCell}>{row.inicial || ''}</Text>
                  <Text style={styles.inputCell}>{row.recibido || ''}</Text>
                  <Text style={styles.inputCell}>{row.consumo || ''}</Text>
                  <Text style={styles.inputCell}>{row.final || ''}</Text>
                </View>
              );
            })}
            <View style={[styles.dataRow, { backgroundColor: '#e0e7ef' }]}> 
              <Text style={[styles.casetaCell, { fontWeight: 'bold' }]}>TOTAL</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesEnvase.inicial}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesEnvase.recibido}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesEnvase.consumo}</Text>
              <Text style={[styles.inputCell, { fontWeight: 'bold', backgroundColor: '#e0e7ef' }]}>{totalesEnvase.final}</Text>
            </View>
          </View>
        </ScrollView>
        {/* Botón exportar */}
        <TouchableOpacity style={styles.btnExportar} onPress={exportarPDF}>
          <Image source={require('../../assets/Iconos/PDF.png')} style={styles.resumenIcon} resizeMode="contain" />
          <Text style={styles.btnExportarText}>Exportar a PDF</Text>
        </TouchableOpacity>
        {/* Inputs de firmas y nombres eliminados */}
      </ScrollView>
    </SafeAreaView>
  );
}

// Cambia los estilos de las tablas y celdas para mejor alineación y legibilidad
const COL_WIDTH = 90;
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
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ef',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderColor: '#b0b0b0',
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 13,
    paddingVertical: 8,
    paddingHorizontal: 6,
    width: COL_WIDTH,
    textAlign: 'center',
    color: '#222',
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
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
    textAlign: 'center',
    color: '#333',
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  inputCell: {
    fontSize: 13,
    color: '#222',
    width: COL_WIDTH,
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
});