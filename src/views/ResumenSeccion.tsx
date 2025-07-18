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

  // Obtener las casetas de la sección seleccionada (usando useCasetas si es necesario)
  const granjaId = seccionSeleccionada?.GranjaID ?? null;
  const { casetas } = useCasetas(granjaId);
  const casetasFiltradas = casetas?.filter(c => c.GranjaID === granjaId) ?? [];

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
    casetasValidas.forEach(caseta => {
      const row = alimento.find((r: any) => r.caseta === caseta);
      if (row) {
        existenciaInicial += Number(row.existencia_inicial || 0);
        entrada += Number(row.entrada || 0);
        consumo += Number(row.consumo || 0);
      }
    });
    return { existenciaInicial, entrada, consumo };
  }, [alimento, casetasValidas]);

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
      html += `<tr><td><b>TOTAL</b></td><td><b>${totalesAlimento.existenciaInicial}</b></td><td><b>${totalesAlimento.entrada}</b></td><td><b>${totalesAlimento.consumo}</b></td><td></td></tr></table></div>`;
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
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar el PDF.');
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
      Alert.alert('Datos eliminados', 'Todos los datos han sido eliminados.');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron eliminar los datos.');
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
                <View key="existencia_inicial" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesAlimento.existenciaInicial}</Text></View>,
                <View key="entrada" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesAlimento.entrada}</Text></View>,
                <View key="consumo" style={styles.cell}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{totalesAlimento.consumo}</Text></View>,
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
        <TouchableOpacity style={[styles.btnExportar, { backgroundColor: '#d9534f', marginTop: 0 }]} onPress={handleEliminarDatos}>
          <Ionicons name="trash" size={24} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.btnExportarText}>Eliminar datos</Text>
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
    fontSize: 13,
    color: '#222',
    width: COL_WIDTH,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 0,
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
    borderRightWidth: 1,
    borderColor: '#b0b0b0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
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
});