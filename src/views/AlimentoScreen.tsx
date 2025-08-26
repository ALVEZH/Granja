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
import Modal from 'react-native-modal';


// Habilita LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Definir el tipo para los datos de cada caseta en alimentos
interface CasetaAlimento {
  existenciaInicial: string;
  entrada: string;
  consumo: string;
  tipo: string;
}

export default function AlimentoScreen() {
  const { seccionSeleccionada } = useSeccion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const granjaId = seccionSeleccionada?.GranjaID ?? null;
  const granjaNombre = seccionSeleccionada?.Nombre ?? '';
  const { granjas } = useGranjas();
  const granja = granjas.find(g => g.Nombre === granjaNombre);
  const { casetas, loading: loadingCasetas, error: errorCasetas } = useCasetas(granjaId);

  // Filtrar solo las casetas de la granja seleccionada
  const casetasFiltradas = casetas?.filter(c => c.GranjaID === granjaId) ?? [];

  const fechaHoy = new Date().toISOString().split('T')[0];

  // Estructura: { [caseta]: { existenciaInicial, entrada, consumo, tipo } }
  const [tabla, setTabla] = useState<Record<string, CasetaAlimento>>({});

  // Estado para saber si los datos ya se guardaron
  const [guardado, setGuardado] = useState(false);
  // Estado para evitar doble guardado
  const [guardando, setGuardando] = useState(false);

  // 1. Agrega estado para mostrar el modal
  const [modalSinGuardar, setModalSinGuardar] = useState(false);
  const [onConfirmSalir, setOnConfirmSalir] = useState<null | (() => void)>(null);

  // SIEMPRE inicializar los inputs vacíos al entrar
  useEffect(() => {
    if (!casetasFiltradas || !granjaId) return;
    setGuardado(false);
    setTabla(() => {
      const obj: Record<string, CasetaAlimento> = {};
      casetasFiltradas.forEach(caseta => {
        obj[caseta.Nombre] = {
          existenciaInicial: '',
          entrada: '',
          consumo: '',
          tipo: ''
        };
      });
      return obj;
    });
  }, [casetasFiltradas.length, granjaId, fechaHoy]);

  // Acumulado real de la base de datos para totales y validación
  const [alimentoAcumulado, setAlimentoAcumulado] = useState<any[]>([]);
  useEffect(() => {
    if (!granjaId) return;
    DatabaseQueries.getAlimentoByFecha(fechaHoy, granjaId).then(setAlimentoAcumulado);
  }, [granjaId, fechaHoy, guardado]);

  // Totales en tiempo real: suma del acumulado en base de datos + lo que está en los inputs
  const totales = useMemo(() => {
    let existenciaInicial = 0, entrada = 0, consumo = 0;
    casetasFiltradas.forEach(caseta => {
      const row = alimentoAcumulado.find((a: any) => a.caseta === caseta.Nombre) || {};
      const baseExistencia = Number(row.existencia_inicial) || 0;
      const baseEntrada = Number(row.entrada) || 0;
      const baseConsumo = Number(row.consumo) || 0;
      const inputExistencia = Number(tabla[caseta.Nombre]?.existenciaInicial) || 0;
      const inputEntrada = Number(tabla[caseta.Nombre]?.entrada) || 0;
      const inputConsumo = Number(tabla[caseta.Nombre]?.consumo) || 0;
      existenciaInicial += baseExistencia + inputExistencia;
      entrada += baseEntrada + inputEntrada;
      consumo += baseConsumo + inputConsumo;
    });
    return { existenciaInicial, entrada, consumo };
  }, [alimentoAcumulado, casetasFiltradas, tabla]);

  // Validación: alerta si ya hay datos guardados en cualquier caseta y se intenta registrar más
  const [alertaCasetas, setAlertaCasetas] = useState<Record<string, boolean>>({});
  const handleChange = (caseta: string, campo: 'existenciaInicial' | 'entrada' | 'consumo' | 'tipo', valor: string) => {
    setTabla((prev: typeof tabla) => ({
      ...prev,
      [caseta]: {
        ...prev[caseta],
        [campo]: campo === 'tipo' ? valor : valor.replace(/[^0-9.]/g, '')
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

  // Función para saber si hay algún dato ingresado en cualquier input
  const hayDatosIngresados = () => {
    return casetasFiltradas.some(caseta => {
      const datos = tabla[caseta.Nombre] || { existenciaInicial: '', entrada: '', consumo: '', tipo: '' };
      return (
        (datos.existenciaInicial !== '' && datos.existenciaInicial !== '0') ||
        (datos.entrada !== '' && datos.entrada !== '0') ||
        (datos.consumo !== '' && datos.consumo !== '0') ||
        (datos.tipo && datos.tipo.trim() !== '')
      );
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBeforeRemove = (e: any) => {
        if (guardado) return;
        if (hayDatosIngresados()) {
          e.preventDefault();
          setOnConfirmSalir(() => () => {
            setModalSinGuardar(false);
            navigation.dispatch(e.data.action);
          });
          setModalSinGuardar(true);
        }
        // Si no hay datos, permite salir normalmente
      };
      navigation.addListener('beforeRemove', onBeforeRemove);
      return () => navigation.removeListener('beforeRemove', onBeforeRemove);
    }, [navigation, tabla, casetasFiltradas, guardado])
  );

  // Función para verificar si una caseta está completa
  const isCasetaCompleta = (casetaNombre: string) => {
    const datosCaseta = tabla[casetaNombre] || {};
    // Una caseta está "completa" si al menos un campo tiene datos distintos de vacío o cero
    return (
      (datosCaseta.existenciaInicial !== '' && datosCaseta.existenciaInicial !== '0') ||
      (datosCaseta.entrada !== '' && datosCaseta.entrada !== '0') ||
      (datosCaseta.consumo !== '' && datosCaseta.consumo !== '0') ||
      (datosCaseta.tipo && datosCaseta.tipo.trim() !== '')
    );
  };

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    if (!seccionSeleccionada) {
      Alert.alert('Error', 'No se ha seleccionado una sección.');
      return;
    }
    const exito = await guardarAlimentos(false);
    if (exito) {
      setTabla(() => {
        const obj: Record<string, CasetaAlimento> = {};
        casetasFiltradas.forEach(caseta => {
          obj[caseta.Nombre] = {
            existenciaInicial: '',
            entrada: '',
            consumo: '',
            tipo: ''
          };
        });
        return obj;
      });
      setGuardado(true);
      // Recargar el acumulado después de guardar para que los totales reflejen la suma
      if (granjaId) {
        DatabaseQueries.getAlimentoByFecha(fechaHoy, granjaId).then(setAlimentoAcumulado);
      }
      Alert.alert('Éxito', 'Datos de alimentos guardados correctamente.');
    }
    // NO navegar aquí
  };

  const handleContinuar = () => {
    if (hayDatosIngresados()) {
      setOnConfirmSalir(null);
      setModalSinGuardar(true);
      return;
    }
    navigation.replace('Menu');
  };

  // Función auxiliar para guardar los datos
  const guardarAlimentos = async (forzar: boolean) => {
    if (guardando) return false;
    setGuardando(true);
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const caseta of casetasFiltradas || []) {
        const datosCaseta = tabla[caseta.Nombre];
        if (datosCaseta && (datosCaseta.existenciaInicial || datosCaseta.entrada || datosCaseta.consumo || datosCaseta.tipo)) {
          const data: any = {
            caseta: caseta.Nombre,
            tipo: datosCaseta.tipo || 'Alimento',
            existencia_inicial: Number(datosCaseta.existenciaInicial) || 0,
            entrada: Number(datosCaseta.entrada) || 0,
            consumo: Number(datosCaseta.consumo) || 0,
            fecha: fechaHoy,
            granja_id: granjaId,
            calidad: 'Alimento'
          };
          console.log('Guardando alimento:', data);
          await DatabaseQueries.insertAlimento(data);
        }
      }
      return true;
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos.');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar la flecha de regresar para mostrar alerta si hay datos sin guardar
  const handleBack = () => {
    if (hayDatosIngresados()) {
      setOnConfirmSalir(() => () => {
        setModalSinGuardar(false);
        navigation.replace('Menu');
      });
      setModalSinGuardar(true);
    } else {
      navigation.replace('Menu');
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ALIMENTOS</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/Iconos/alimento.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>{seccionSeleccionada?.Nombre} - {fechaHoy}</Text>
          </View>
          {loadingCasetas && <Text>Cargando casetas...</Text>}
          {errorCasetas && <Text style={{ color: 'red' }}>{errorCasetas}</Text>}
          {casetasFiltradas.map((caseta, idx) => {
            const datosCaseta = tabla[caseta.Nombre] || { existenciaInicial: '', entrada: '', consumo: '', tipo: '' };
            const completa = isCasetaCompleta(caseta.Nombre);
            return (
              <View
                key={caseta.Nombre}
                style={[
                  styles.casetaBlock,
                  idx % 2 === 0 ? styles.casetaBlockEven : styles.casetaBlockOdd,
                  completa
                    ? { backgroundColor: '#b6f5c3', borderColor: '#1db954', borderWidth: 2, shadowColor: '#1db954', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }
                    : styles.casetaBlockRoja,
                ]}
              >
                <TouchableOpacity onPress={() => toggleCaseta(caseta.Nombre)} style={styles.casetaHeader} activeOpacity={0.7}>
                  <Text style={styles.casetaTitle}>{caseta.Nombre}</Text>
                  <Text style={styles.caret}>{casetasAbiertas[caseta.Nombre] ? '\u25b2' : '\u25bc'}</Text>
                </TouchableOpacity>
                {casetasAbiertas[caseta.Nombre] && (
                  <View style={styles.casetaContent}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Existencia Inicial</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datosCaseta.existenciaInicial}
                        onChangeText={v => handleChange(caseta.Nombre, 'existenciaInicial', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Entrada</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datosCaseta.entrada}
                        onChangeText={v => handleChange(caseta.Nombre, 'entrada', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Consumo</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datosCaseta.consumo}
                        onChangeText={v => handleChange(caseta.Nombre, 'consumo', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Tipo</Text>
                      <TextInput
                        style={styles.inputCellTipo}
                        value={datosCaseta.tipo}
                        onChangeText={v => handleChange(caseta.Nombre, 'tipo', v)}
                        placeholder="Tipo"
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
          {/* Totales generales */}
          <View style={styles.totalesBlock}>
            <Text style={styles.totalesTitle}>Totales</Text>
            <View style={styles.totalesRow}>
              <Text style={styles.totalesCell}>Existencia Inicial: {totales.existenciaInicial}</Text>
              <Text style={styles.totalesCell}>Entrada: {totales.entrada}</Text>
              <Text style={styles.totalesCell}>Consumo: {totales.consumo}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
            <TouchableOpacity style={styles.guardarButton} onPress={handleGuardar}>
              <Text style={styles.guardarButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continuarButton} onPress={handleContinuar}>
              <Text style={styles.continuarButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal isVisible={modalSinGuardar} onBackdropPress={() => setModalSinGuardar(false)}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', minWidth: 260 }}>
          <Ionicons name="alert-circle-outline" size={48} color="#e6b800" style={{ marginBottom: 12 }} />
          <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 10, color: '#2a3a4b', textAlign: 'center' }}>¡Atención!</Text>
          <Text style={{ color: '#666', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>Tienes datos sin guardar. Borra todos los datos o guarda los datos para poder salir.</Text>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#e0e7ef', borderRadius: 8, padding: 14, alignItems: 'center', marginRight: onConfirmSalir ? 8 : 0 }}
              onPress={() => setModalSinGuardar(false)}
            >
              <Text style={{ color: '#2a3a4b', fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
            </TouchableOpacity>
            {onConfirmSalir && (
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#e53935', borderRadius: 8, padding: 14, alignItems: 'center', marginLeft: 8 }}
                onPress={onConfirmSalir}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Salir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  casetaBlockRoja: { backgroundColor: '#ffd6d6', borderColor: '#e53935', borderWidth: 2, shadowColor: '#e53935', shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  casetaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#c7d7ee' },
  casetaTitle: { fontSize: 16, fontWeight: 'bold', color: '#2a3a4b' },
  caret: { fontSize: 18, color: '#2a3a4b', marginLeft: 8 },
  casetaContent: { padding: 16 },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8
  },
  inputLabel: { 
    fontSize: 14, 
    color: '#333', 
    fontWeight: '500',
    flex: 1,
    marginRight: 16
  },
  inputCell: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10, // más redondeado
    width: 120,
    height: 44, // más alto
    paddingHorizontal: 12,
    paddingVertical: 8, // más padding vertical
    textAlign: 'center',
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputCellTipo: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    width: 180,
    height: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'left',
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  totalesBlock: { 
    margin: 16, 
    padding: 16, // más padding
    backgroundColor: '#dbeafe', 
    borderRadius: 8,
    flexWrap: 'wrap',
    minWidth: 0,
    alignItems: 'flex-start',
  },
  totalesTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: '#2a3a4b' },
  totalesRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4,
    flexWrap: 'wrap',
    width: '100%',
  },
  totalesCell: { 
    marginLeft: 10, 
    fontSize: 15, 
    color: '#333',
    flexShrink: 1,
    minWidth: 0,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  table: { borderWidth: 1, borderColor: '#b0b0b0', borderRadius: 8, margin: 8, backgroundColor: '#fff' },
  headerRowTable: { flexDirection: 'row', backgroundColor: '#dbeafe', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  headerCell: { fontWeight: 'bold', fontSize: 13, padding: 6, minWidth: 90, textAlign: 'center', color: '#222' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  casetaCell: { fontWeight: 'bold', fontSize: 13, minWidth: 70, textAlign: 'center', color: '#333' },
  guardarButton: {
    flex: 1,
    backgroundColor: '#1db954',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  guardarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  continuarButton: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  continuarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
