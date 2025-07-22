"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Image, Platform, UIManager, LayoutAnimation, KeyboardAvoidingView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSeccion } from './EnvaseScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCasetas } from '../hooks/useCasetas';
import { useGranjas } from '../hooks/useGranjas';

const columnas = ['Existencia Inicial', 'Entrada', 'Mortalidad', 'Salida', 'Edad'];

// Definir el tipo para los datos de cada caseta en existencia
interface CasetaExistencia {
  existenciaInicial: string;
  entrada: string;
  mortalidad: string;
  salida: string;
  edad: string;
  existenciaFinal: string;
}

export default function ExistenciaScreen() {
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

  // Estructura: { [caseta]: { existenciaInicial, entrada, mortalidad, salida, edad, existenciaFinal } }
  const [tabla, setTabla] = useState<Record<string, CasetaExistencia>>({});

  // Sincronizar tabla cuando cambian las casetas
  useEffect(() => {
    if (!casetas) return;
    setTabla((prev: Record<string, CasetaExistencia>) => {
      const obj: Record<string, CasetaExistencia> = { ...prev };
      casetas.forEach(caseta => {
        if (!obj[caseta.Nombre]) {
          obj[caseta.Nombre] = {
            existenciaInicial: '',
            entrada: '',
            mortalidad: '',
            salida: '',
            edad: '',
            existenciaFinal: '0',
          };
        }
      });
      // Eliminar casetas que ya no existen
      Object.keys(obj).forEach(nombre => {
        if (!casetas.find(c => c.Nombre === nombre)) {
          delete obj[nombre];
        }
      });
      return obj;
    });
  }, [casetas]);

  // Calcular totales y existencia final
  const totales = useMemo(() => {
    let existenciaInicial = 0, entrada = 0, mortalidad = 0, salida = 0, existenciaFinal = 0;
    casetasFiltradas.forEach(caseta => {
      const nombre = typeof caseta === 'string' ? caseta : caseta.Nombre;
      const datos = tabla[nombre] || { existenciaInicial: '', entrada: '', mortalidad: '', salida: '', edad: '', existenciaFinal: '0' };
      const inicial = Number(datos.existenciaInicial) || 0;
      const ent = Number(datos.entrada) || 0;
      const mort = Number(datos.mortalidad) || 0;
      const sal = Number(datos.salida) || 0;
      const final = inicial + ent - mort - sal;
      existenciaInicial += inicial;
      entrada += ent;
      mortalidad += mort;
      salida += sal;
      existenciaFinal += final;
    });
    return { existenciaInicial, entrada, mortalidad, salida, existenciaFinal };
  }, [tabla, casetasFiltradas]);

  // Manejar cambios en la tabla
  const handleChange = (caseta: string, campo: string, valor: string) => {
    setTabla((prev: any) => {
      const prevDatos = prev[caseta] || { existenciaInicial: '', entrada: '', mortalidad: '', salida: '', edad: '', existenciaFinal: '0' };
      const newDatos = {
        ...prevDatos,
        [campo]: campo === 'edad' ? valor.replace(/[^0-9]/g, '') : valor.replace(/[^0-9]/g, '')
      };
      // Calcular existencia final para esta caseta
      const inicial = Number(newDatos.existenciaInicial) || 0;
      const entrada = Number(newDatos.entrada) || 0;
      const mortalidad = Number(newDatos.mortalidad) || 0;
      const salida = Number(newDatos.salida) || 0;
      newDatos.existenciaFinal = String(inicial + entrada - mortalidad - salida);
      return {
        ...prev,
        [caseta]: newDatos
      };
    });
  };

  // Estado para saber si los datos ya se guardaron
  const [guardado, setGuardado] = useState(false);
  // Estado para evitar doble guardado
  const [guardando, setGuardando] = useState(false);

  // Función para saber si hay algún dato ingresado en cualquier input
  const hayDatosIngresados = () => {
    return casetasFiltradas.some(caseta => {
      const nombre = typeof caseta === 'string' ? caseta : caseta.Nombre;
      const datos = tabla[nombre] || { existenciaInicial: '', entrada: '', mortalidad: '', salida: '', edad: '', existenciaFinal: '0' };
      return (
        (datos.existenciaInicial !== '' && datos.existenciaInicial !== '0') ||
        (datos.entrada !== '' && datos.entrada !== '0') ||
        (datos.mortalidad !== '' && datos.mortalidad !== '0') ||
        (datos.salida !== '' && datos.salida !== '0') ||
        (datos.edad !== '' && datos.edad !== '0')
      );
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBeforeRemove = (e: any) => {
        if (guardado) {
          // Permitir salir sin alerta si los datos acaban de guardarse
          return;
        }
        if (hayDatosIngresados()) {
          e.preventDefault();
          Alert.alert(
            'Atención',
            'Tienes datos sin guardar. Borra todos los datos o guarda los datos para poder salir.',
            [
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
        // Si no hay datos, permite salir normalmente
      };
      navigation.addListener('beforeRemove', onBeforeRemove);
      return () => navigation.removeListener('beforeRemove', onBeforeRemove);
    }, [navigation, tabla, casetasFiltradas, guardado])
  );

  // Función para verificar si una caseta está completa
  const isCasetaCompleta = (caseta: string | { Nombre: string }) => {
    const nombre = typeof caseta === 'string' ? caseta : caseta.Nombre;
    const datos = tabla[nombre] || { existenciaInicial: '', entrada: '', mortalidad: '', salida: '', edad: '', existenciaFinal: '0' };
    // Una caseta está "completa" si al menos un campo tiene datos distintos de vacío o cero
    return (
      (datos.existenciaInicial !== '' && datos.existenciaInicial !== '0') ||
      (datos.entrada !== '' && datos.entrada !== '0') ||
      (datos.mortalidad !== '' && datos.mortalidad !== '0') ||
      (datos.salida !== '' && datos.salida !== '0') ||
      (datos.edad !== '' && datos.edad !== '0')
    );
  };

  // Cambiar la flecha de regresar para mostrar alerta si hay datos sin guardar
  const handleBack = () => {
    if (hayDatosIngresados()) {
      Alert.alert(
        'Atención',
        'Tienes datos sin guardar. Borra todos los datos o guarda los datos para poder salir.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => navigation.replace('Menu') }
        ]
      );
    } else {
      navigation.replace('Menu');
    }
  };

  // Guardar datos en la base de datos
  const handleGuardar = async () => {
    if (!seccionSeleccionada) {
      Alert.alert('Error', 'No se ha seleccionado una sección.');
      return;
    }
    const exito = await guardarExistencia(false);
    if (exito) {
      setTabla({});
      setGuardado(true);
      Alert.alert('Éxito', 'Datos de existencia guardados correctamente.');
    }
    // NO navegar aquí
  };

  const handleContinuar = () => {
    if (hayDatosIngresados()) {
      Alert.alert(
        'Atención',
        'Tienes datos sin guardar. Borra todos los datos o guarda los datos para poder salir.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }
    navigation.replace('Menu');
  };

  // Función auxiliar para guardar los datos
  const guardarExistencia = async (forzar: boolean) => {
    if (guardando) return false;
    setGuardando(true);
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const caseta of casetasFiltradas) {
        const nombre = typeof caseta === 'string' ? caseta : caseta.Nombre;
        if (
          tabla[nombre].existenciaInicial ||
          tabla[nombre].entrada ||
          tabla[nombre].mortalidad ||
          tabla[nombre].salida ||
          tabla[nombre].edad ||
          tabla[nombre].existenciaFinal
        ) {
          const data: any = {
            caseta: nombre,
            fecha: fechaHoy,
            granja_id: granjaId,
            inicial: Number(tabla[nombre].existenciaInicial) || 0,
            entrada: Number(tabla[nombre].entrada) || 0,
            mortalidad: Number(tabla[nombre].mortalidad) || 0,
            salida: Number(tabla[nombre].salida) || 0,
            edad: Number(tabla[nombre].edad) || 0,
            final: Number(tabla[nombre].existenciaFinal) || 0,
          };
          await DatabaseQueries.insertExistencia(data);
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

  // Estado para controlar qué casetas están abiertas
  const [casetasAbiertas, setCasetasAbiertas] = useState<{ [caseta: string]: boolean }>(() => {
    const obj: { [caseta: string]: boolean } = {};
    casetas.forEach(c => { obj[c.Nombre] = false; });
    return obj;
  });

  const toggleCaseta = (caseta: string) => {
    if (typeof LayoutAnimation !== 'undefined') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setCasetasAbiertas(prev => ({ ...prev, [caseta]: !prev[caseta] }));
  };

  // useEffect para limpiar los inputs al entrar
  useEffect(() => {
    if (!casetasFiltradas || !granjaId) return;
    setGuardado(false); // Reiniciar el estado de guardado al entrar
    setTabla(() => {
      const obj: Record<string, CasetaExistencia> = {};
      casetasFiltradas.forEach(caseta => {
        obj[caseta.Nombre] = {
          existenciaInicial: '',
          entrada: '',
          mortalidad: '',
          salida: '',
          edad: '',
          existenciaFinal: '0',
        };
      });
      return obj;
    });
  }, [casetasFiltradas.length, granjaId, fechaHoy]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXISTENCIA</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/Iconos/existencia.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>{seccionSeleccionada?.Nombre} - {fechaHoy}</Text>
          </View>
          {loadingCasetas && <Text>Cargando casetas...</Text>}
          {errorCasetas && <Text style={{ color: 'red' }}>{errorCasetas}</Text>}
          {casetasFiltradas.map((caseta, idx) => {
            const nombre = typeof caseta === 'string' ? caseta : caseta.Nombre;
            const datos = tabla[nombre] || {
              existenciaInicial: '',
              entrada: '',
              mortalidad: '',
              salida: '',
              edad: '',
              existenciaFinal: '0',
            };
            const completa = isCasetaCompleta(nombre);
            return (
              <View
                key={nombre}
                style={[
                  styles.casetaBlock,
                  idx % 2 === 0 ? styles.casetaBlockEven : styles.casetaBlockOdd,
                  completa
                    ? { backgroundColor: '#b6f5c3', borderColor: '#1db954', borderWidth: 2, shadowColor: '#1db954', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }
                    : styles.casetaBlockRoja,
                ]}
              >
                <TouchableOpacity onPress={() => toggleCaseta(nombre)} style={styles.casetaHeader} activeOpacity={0.7}>
                  <Text style={styles.casetaTitle}>{nombre}</Text>
                  <Text style={styles.caret}>{casetasAbiertas[nombre] ? '\u25b2' : '\u25bc'}</Text>
                </TouchableOpacity>
                {casetasAbiertas[nombre] && (
                  <View style={styles.casetaContent}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Existencia Inicial</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datos.existenciaInicial}
                        onChangeText={v => handleChange(nombre, 'existenciaInicial', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Entrada</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datos.entrada}
                        onChangeText={v => handleChange(nombre, 'entrada', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Mortalidad</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datos.mortalidad}
                        onChangeText={v => handleChange(nombre, 'mortalidad', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Salida</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datos.salida}
                        onChangeText={v => handleChange(nombre, 'salida', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Edad</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datos.edad}
                        onChangeText={v => handleChange(nombre, 'edad', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Existencia Final</Text>
                      <TextInput
                        style={styles.inputCell}
                        value={datos.existenciaFinal}
                        editable={false}
                        placeholder="0"
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
            <View style={styles.totalesColumn}>
              <Text style={styles.totalesCell}>Inicial: {totales.existenciaInicial}</Text>
              <Text style={styles.totalesCell}>Entrada: {totales.entrada}</Text>
              <Text style={styles.totalesCell}>Mortalidad: {totales.mortalidad}</Text>
              <Text style={styles.totalesCell}>Salida: {totales.salida}</Text>
              <Text style={styles.totalesCell}>Final: {totales.existenciaFinal}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf1f9' },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  title: { fontSize: 18, fontWeight: 'bold', margin: 12, textAlign: 'center', color: '#333' },
  table: { borderWidth: 1, borderColor: '#b0b0b0', borderRadius: 8, margin: 8, backgroundColor: '#fff' },
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
  headerCell: { fontWeight: 'bold', fontSize: 13, padding: 6, minWidth: 90, textAlign: 'center', color: '#222' },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  casetaCell: { fontWeight: 'bold', fontSize: 13, minWidth: 70, textAlign: 'center', color: '#333' },
  inputCell: {
    borderWidth: 1.5,
    borderColor: '#b0b8c1',
    borderRadius: 10,
    width: 110,
    height: 44,
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  btnGuardar: { backgroundColor: '#749BC2', borderRadius: 8, margin: 16, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  scrollContent: { paddingBottom: 30 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  headerImage: { width: 48, height: 48, marginRight: 10 },
  subtitle: { fontSize: 15, color: '#333', marginBottom: 10, textAlign: 'center' },
  casetaBlock: { borderRadius: 10, margin: 10, padding: 0, elevation: 2, overflow: 'hidden' },
  casetaBlockEven: { backgroundColor: '#f4f8fd' },
  casetaBlockOdd: { backgroundColor: '#e0e7ef' },
  casetaBlockRoja: { backgroundColor: '#ffd6d6', borderColor: '#e53935', borderWidth: 2, shadowColor: '#e53935', shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  casetaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#c7d7ee' },
  casetaTitle: { fontSize: 16, fontWeight: 'bold', color: '#2a3a4b' },
  caret: { fontSize: 18, color: '#2a3a4b', marginLeft: 8 },
  casetaContent: { padding: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { width: 120, fontWeight: '600', color: '#3b3b3b', fontSize: 13 },
  totalesBlock: { 
    margin: 16, 
    padding: 16, 
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
  totalesColumn: {flexDirection: 'column'},
  totalesCell: { 
    marginRight: 16, 
    fontSize: 15, 
    color: '#333',
    flexShrink: 1,
    minWidth: 0,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
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
