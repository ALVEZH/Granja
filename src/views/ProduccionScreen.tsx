"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Image, Platform, UIManager, LayoutAnimation, KeyboardAvoidingView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSeccion } from './EnvaseScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCasetas } from '../hooks/useCasetas';
import { useGranjas } from '../hooks/useGranjas';

const tiposHuevo = [
  'BLANCO', 'ROTO 1', 'ROTO 2', 'MANCHADO', 'FRAGIL 1', 'FRAGIL 2', 'YEMA', 'B1', 'EXTRA 240PZS'
];

// Habilita LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Definir el tipo para los datos de cada caseta en producción
interface CasetaProduccion {
  [tipo: string]: { cajas: string; restos: string };
}

export default function ProduccionScreen() {
  // const route = useRoute();
  // const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { seccionSeleccionada } = useSeccion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const granjaId = seccionSeleccionada?.GranjaID ?? null;
  const granjaNombre = seccionSeleccionada?.Nombre ?? '';
  const { granjas } = useGranjas();
  const granja = granjas.find(g => g.Nombre === granjaNombre);
  const { casetas, loading: loadingCasetas, error: errorCasetas } = useCasetas(granjaId);

  // Filtrar solo las casetas de la granja seleccionada (por si la API no lo hace)
  const casetasFiltradas = casetas?.filter(c => c.GranjaID === granjaId) ?? [];

  // Elimina el estado de fecha y usa siempre la fecha actual en el render
  // const [fecha, setFecha] = useState(() => {
  //   const today = new Date();
  //   return today.toISOString().split('T')[0];
  // });
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Estructura: { [caseta]: { [tipo]: { cajas: string, restos: string } } }
  const [tabla, setTabla] = useState<Record<string, CasetaProduccion>>({});

  // Cargar datos existentes cuando cambian las casetas o la fecha
  useEffect(() => {
    if (!casetasFiltradas || !granjaId) return;
    
    const cargarDatosExistentes = async () => {
      try {
        const datosExistentes = await DatabaseQueries.getProduccionByFecha(fechaHoy, granjaId);
        
        setTabla(prev => {
          const obj: Record<string, CasetaProduccion> = {};
          
          // Inicializar todas las casetas con datos vacíos
          casetasFiltradas.forEach(caseta => {
            obj[caseta.Nombre] = {};
            tiposHuevo.forEach(tipo => {
              obj[caseta.Nombre][tipo] = { cajas: '', restos: '' };
            });
          });
          
          // Cargar datos existentes
          datosExistentes.forEach(registro => {
            if (obj[registro.caseta]) {
              obj[registro.caseta]['BLANCO'] = { 
                cajas: registro.blanco_cajas?.toString() || '', 
                restos: registro.blanco_restos?.toString() || '' 
              };
              obj[registro.caseta]['ROTO 1'] = { 
                cajas: registro.roto1_cajas?.toString() || '', 
                restos: registro.roto1_restos?.toString() || '' 
              };
              obj[registro.caseta]['ROTO 2'] = { 
                cajas: registro.roto2_cajas?.toString() || '', 
                restos: registro.roto2_restos?.toString() || '' 
              };
              obj[registro.caseta]['MANCHADO'] = { 
                cajas: registro.manchado_cajas?.toString() || '', 
                restos: registro.manchado_restos?.toString() || '' 
              };
              obj[registro.caseta]['FRAGIL 1'] = { 
                cajas: registro.fragil1_cajas?.toString() || '', 
                restos: registro.fragil1_restos?.toString() || '' 
              };
              obj[registro.caseta]['FRAGIL 2'] = { 
                cajas: registro.fragil2_cajas?.toString() || '', 
                restos: registro.fragil2_restos?.toString() || '' 
              };
              obj[registro.caseta]['YEMA'] = { 
                cajas: registro.yema_cajas?.toString() || '', 
                restos: registro.yema_restos?.toString() || '' 
              };
              obj[registro.caseta]['B1'] = { 
                cajas: registro.b1_cajas?.toString() || '', 
                restos: registro.b1_restos?.toString() || '' 
              };
              obj[registro.caseta]['EXTRA 240PZS'] = { 
                cajas: registro.extra240_cajas?.toString() || '', 
                restos: registro.extra240_restos?.toString() || '' 
              };
            }
          });
          
          return obj;
        });
      } catch (error) {
        console.error('Error cargando datos existentes:', error);
      }
    };
    
    cargarDatosExistentes();
  }, [casetasFiltradas.length, granjaId, fechaHoy]);

  // Calcular totales por tipo
  const totales = useMemo(() => {
    const t: any = {};
    tiposHuevo.forEach(tipo => {
      let cajas = 0, restos = 0;
      casetasFiltradas.forEach(caseta => {
        cajas += Number(tabla[caseta.Nombre]?.[tipo]?.cajas) || 0;
        restos += Number(tabla[caseta.Nombre]?.[tipo]?.restos) || 0;
      });
      t[tipo] = { cajas, restos };
    });
    return t;
  }, [tabla, casetasFiltradas]); // Asegurar que se recalcula si cambian las casetas

  // Manejar cambios en la tabla
  const handleChange = (caseta: string, tipo: string, campo: 'cajas' | 'restos', valor: string) => {
    setTabla((prev: typeof tabla) => ({
      ...prev,
      [caseta]: {
        ...prev[caseta],
        [tipo]: {
          ...prev[caseta][tipo],
          [campo]: valor.replace(/[^0-9]/g, '')
        }
      }
    }));
  };

  // Estado para controlar qué casetas están abiertas
  const [casetasAbiertas, setCasetasAbiertas] = useState<{ [caseta: string]: boolean }>({});

  // Inicializar casetas abiertas cuando cambian las casetas filtradas
  useEffect(() => {
    if (!casetasFiltradas) return;
    setCasetasAbiertas(prev => {
      const obj: { [caseta: string]: boolean } = { ...prev };
      let changed = false;
      casetasFiltradas.forEach(c => {
        if (!(c.Nombre in obj)) {
          obj[c.Nombre] = false;
          changed = true;
        }
      });
      return changed ? obj : prev;
    });
  }, [casetasFiltradas.length]);

  const toggleCaseta = (caseta: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCasetasAbiertas(prev => ({ ...prev, [caseta]: !prev[caseta] }));
  };

  // Estado para saber si los datos ya se guardaron
  const [guardado, setGuardado] = useState(false);

  // Bloquear navegación por el botón de la flecha si no se ha guardado
  useFocusEffect(
    React.useCallback(() => {
      const onBeforeRemove = (e: any) => {
        if (guardado) return;
        e.preventDefault();
        Alert.alert(
          '¡Atención!',
          'Debes guardar los datos antes de salir de la pantalla de producción.',
          [
            { text: 'OK', style: 'cancel' }
          ]
        );
      };
      navigation.addListener('beforeRemove', onBeforeRemove);
      return () => navigation.removeListener('beforeRemove', onBeforeRemove);
    }, [guardado, navigation])
  );

  // 2. Función para verificar si una caseta está completa
  const isCasetaCompleta = (casetaNombre: string) => {
    const datosCaseta = tabla[casetaNombre] || {};
    // Una caseta está completa si TODOS los tipos tienen cajas y restos NO vacíos y NO son cero
    return tiposHuevo.every(tipo => {
      const datosTipo = datosCaseta[tipo] || { cajas: '', restos: '' };
      return (
        datosTipo.cajas !== '' && datosTipo.cajas !== '0' &&
        datosTipo.restos !== '' && datosTipo.restos !== '0'
      );
    });
  };

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    if (!seccionSeleccionada) {
      Alert.alert('Error', 'No se ha seleccionado una sección.');
      return;
    }
    // Verificar si hay casetas incompletas
    const casetasIncompletas = casetasFiltradas.filter(c => !isCasetaCompleta(c.Nombre));
    if (casetasIncompletas.length > 0) {
      Alert.alert(
        'Faltan casetas por rellenar',
        'Hay casetas que no están completamente llenas. ¿Seguro que quieres continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            style: 'destructive',
            onPress: () => guardarProduccion(true)
          }
        ]
      );
      return;
    }
    await guardarProduccion(false);
  };

  // Función auxiliar para guardar los datos
  // Solo permite guardar una vez por click
  const [guardando, setGuardando] = useState(false);
  const guardarProduccion = async (forzar: boolean) => {
    if (guardando) return;
    setGuardando(true);
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const caseta of casetasFiltradas || []) {
        const data: any = {
          caseta: caseta.Nombre, // <-- solo el nombre
          fecha: fechaHoy,
          granja_id: granjaId,
          blanco_cajas: Number(tabla[caseta.Nombre]?.['BLANCO']?.cajas) || 0,
          blanco_restos: Number(tabla[caseta.Nombre]?.['BLANCO']?.restos) || 0,
          roto1_cajas: Number(tabla[caseta.Nombre]?.['ROTO 1']?.cajas) || 0,
          roto1_restos: Number(tabla[caseta.Nombre]?.['ROTO 1']?.restos) || 0,
          roto2_cajas: Number(tabla[caseta.Nombre]?.['ROTO 2']?.cajas) || 0,
          roto2_restos: Number(tabla[caseta.Nombre]?.['ROTO 2']?.restos) || 0,
          manchado_cajas: Number(tabla[caseta.Nombre]?.['MANCHADO']?.cajas) || 0,
          manchado_restos: Number(tabla[caseta.Nombre]?.['MANCHADO']?.restos) || 0,
          fragil1_cajas: Number(tabla[caseta.Nombre]?.['FRAGIL 1']?.cajas) || 0,
          fragil1_restos: Number(tabla[caseta.Nombre]?.['FRAGIL 1']?.restos) || 0,
          fragil2_cajas: Number(tabla[caseta.Nombre]?.['FRAGIL 2']?.cajas) || 0,
          fragil2_restos: Number(tabla[caseta.Nombre]?.['FRAGIL 2']?.restos) || 0,
          yema_cajas: Number(tabla[caseta.Nombre]?.['YEMA']?.cajas) || 0,
          yema_restos: Number(tabla[caseta.Nombre]?.['YEMA']?.restos) || 0,
          b1_cajas: Number(tabla[caseta.Nombre]?.['B1']?.cajas) || 0,
          b1_restos: Number(tabla[caseta.Nombre]?.['B1']?.restos) || 0,
          extra240_cajas: Number(tabla[caseta.Nombre]?.['EXTRA 240PZS']?.cajas) || 0,
          extra240_restos: Number(tabla[caseta.Nombre]?.['EXTRA 240PZS']?.restos) || 0,
        };
        console.log('Guardando producción:', data);
        await DatabaseQueries.insertProduccion(data);
      }
      setGuardado(true);
      Alert.alert('Éxito', 'Datos de producción guardados correctamente.');
      navigation.replace('Menu');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar datos de la fecha actual
  const handleEliminarDatos = async () => {
    if (!seccionSeleccionada) {
      Alert.alert('Error', 'No se ha seleccionado una sección.');
      return;
    }

    Alert.alert(
      'Eliminar datos',
      `¿Estás seguro de que quieres eliminar todos los datos de producción de la sección "${seccionSeleccionada?.Nombre}" para la fecha ${fechaHoy}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar datos de producción de la fecha actual
              await DatabaseQueries.deleteProduccionByFecha(fechaHoy, granjaId);
              
              // Limpiar la tabla en pantalla
              setTabla(prev => {
                const obj: Record<string, CasetaProduccion> = {};
                casetasFiltradas.forEach(caseta => {
                  obj[caseta.Nombre] = {};
                  tiposHuevo.forEach(tipo => {
                    obj[caseta.Nombre][tipo] = { cajas: '', restos: '' };
                  });
                });
                return obj;
              });
              
              Alert.alert('Éxito', 'Datos eliminados correctamente.');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar los datos.');
            }
          }
        }
      ]
    );
  };

  // 1. Mantener los datos en memoria mientras navegas entre vistas
  // (No se hace nada, ya que el estado se mantiene mientras la app no se recargue o cierre)
  // Si quieres persistencia incluso al cerrar la app, se puede agregar AsyncStorage.

  // Solo poner en verde las casetas completas (ya está en el render)

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.replace('Menu')}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRODUCCIÓN</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/Iconos/produccion.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>{seccionSeleccionada?.Nombre} - {fechaHoy}</Text>
          </View>
          {loadingCasetas && <Text>Cargando casetas...</Text>}
          {errorCasetas && <Text style={{ color: 'red' }}>{errorCasetas}</Text>}
          {casetasFiltradas.map((caseta, idx) => {
            const datosCaseta = tabla[caseta.Nombre] || {};
            const completa = isCasetaCompleta(caseta.Nombre);
            return (
              <View
                key={caseta.Nombre}
                style={[
                  styles.casetaBlock,
                  idx % 2 === 0 ? styles.casetaBlockEven : styles.casetaBlockOdd,
                  completa && { backgroundColor: '#b6f5c3', borderColor: '#1db954', borderWidth: 2, shadowColor: '#1db954', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
                ]}
              >
                <TouchableOpacity onPress={() => toggleCaseta(caseta.Nombre)} style={styles.casetaHeader} activeOpacity={0.7}>
                  <Text style={styles.casetaTitle}>{caseta.Nombre}</Text>
                  <Text style={styles.caret}>{casetasAbiertas[caseta.Nombre] ? '\u25b2' : '\u25bc'}</Text>
                </TouchableOpacity>
                {casetasAbiertas[caseta.Nombre] && (
                  <ScrollView horizontal contentContainerStyle={styles.casetaContent} showsHorizontalScrollIndicator={false}>
                    <View>
                      {tiposHuevo.map(tipo => {
                        const datosTipo = (datosCaseta && datosCaseta[tipo]) ? datosCaseta[tipo] : { cajas: '', restos: '' };
                        return (
                          <View key={tipo} style={styles.tipoRow}>
                            <Text style={styles.tipoLabel}>{tipo}</Text>
                            <View style={styles.inputGroup}>
                              <View style={styles.inputPair}>
                                <Text style={styles.inputLabel}>Cajas</Text>
                                <TextInput
                                  style={styles.inputCell}
                                  value={datosTipo.cajas}
                                  onChangeText={v => handleChange(caseta.Nombre, tipo, 'cajas', v)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                />
                              </View>
                              <View style={styles.inputPair}>
                                <Text style={styles.inputLabel}>Restos</Text>
                                <TextInput
                                  style={styles.inputCell}
                                  value={datosTipo.restos}
                                  onChangeText={v => handleChange(caseta.Nombre, tipo, 'restos', v)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>
            );
          })}
          {/* Totales generales */}
          <View style={styles.totalesBlock}>
            <Text style={styles.totalesTitle}>Totales por tipo</Text>
            {tiposHuevo.map(tipo => (
              <View key={tipo} style={styles.totalesRow}>
                <Text style={styles.tipoLabel}>{tipo}</Text>
                <Text style={styles.totalesCell}>Cajas: {totales[tipo].cajas}</Text>
                <Text style={styles.totalesCell}>Restos: {totales[tipo].restos}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar}>
            <Text style={styles.btnGuardarText}>Guardar y continuar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf1f9' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  backButton: {
    padding: 6,
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2a3a4b',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 1,
  },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  scrollContent: { paddingBottom: 30 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  headerImage: { width: 48, height: 48, marginRight: 10 },
  headerTextAbsoluteWrapper: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  subtitle: { fontSize: 15, color: '#333', marginBottom: 10, textAlign: 'center' },
  casetaBlock: { borderRadius: 10, margin: 10, padding: 0, elevation: 2, overflow: 'hidden' },
  casetaBlockEven: { backgroundColor: '#f4f8fd' },
  casetaBlockOdd: { backgroundColor: '#e0e7ef' },
  casetaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#c7d7ee' },
  casetaTitle: { fontSize: 16, fontWeight: 'bold', color: '#2a3a4b' },
  caret: { fontSize: 18, color: '#2a3a4b', marginLeft: 8 },
  casetaContent: { padding: 10 },
  tipoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tipoLabel: { width: 100, fontWeight: '600', color: '#3b3b3b', fontSize: 13 },
  inputGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  inputPair: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 20, // Espacio suficiente entre los inputs
  },
  inputLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  inputCell: {
    borderWidth: 1.5,
    borderColor: '#b0b8c1',
    borderRadius: 8,
    width: 90, // suficiente para 6 dígitos
    height: 40,
    margin: 4,
    paddingHorizontal: 12,
    textAlign: 'center',
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  totalesBlock: { margin: 16, padding: 10, backgroundColor: '#dbeafe', borderRadius: 8 },
  totalesTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: '#2a3a4b' },
  totalesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  totalesCell: { marginLeft: 10, fontSize: 13, color: '#333' },
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
