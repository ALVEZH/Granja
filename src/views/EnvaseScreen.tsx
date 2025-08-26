"use client"
import React, { useState, useMemo, createContext, useContext } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Image, Platform, UIManager, LayoutAnimation, KeyboardAvoidingView } from 'react-native';
import { DatabaseQueries } from '../database/offline/queries';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCasetas } from '../hooks/useCasetas';
import { useGranjas } from '../hooks/useGranjas';
import Modal from 'react-native-modal';

// CONTEXTO GLOBAL DE SECCIÓN

export const SeccionContext = createContext<{
  seccionSeleccionada: any;
  setSeccionSeleccionada: (s: any) => void;
}>({
  seccionSeleccionada: null,
  setSeccionSeleccionada: () => {},
});

export function useSeccion() {
  return useContext(SeccionContext);
}

const envases = [
  "CAJA TIPO A",
  "SEPARADOR TIPO A",
  "CAJA TIPO B",
  "SEPARADOR TIPO B",
  "CONO",
  "CONO 240 PZS",
  "CONO ESTRELLA",
  "CINTA",
  "CINTA BLANCA",
];
const columnas = ['Existencia Inicial', 'Recibido', 'Consumo'];

export default function EnvaseScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const paramSeccion = (route as any).params?.seccionSeleccionada;
  const { seccionSeleccionada, setSeccionSeleccionada } = useSeccion();

  // Si hay parámetro, actualiza el contexto solo la primera vez
  React.useEffect(() => {
    if (paramSeccion) setSeccionSeleccionada(paramSeccion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramSeccion]);
  // Elimina el estado de fecha y usa siempre la fecha actual en el render
  // const [fecha, setFecha] = useState(() => {
  //   const today = new Date();
  //   return today.toISOString().split('T')[0];
  // });
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Estructura: { [envase]: { existenciaInicial, recibido, consumo, existenciaFinal } }
  const [tabla, setTabla] = useState(() => {
    const obj: any = {};
    envases.forEach(envase => {
      obj[envase] = { existenciaInicial: '', recibido: '', consumo: '', existenciaFinal: '0' };
    });
    return obj;
  });

  // Estado para el acumulado de envases guardados
  const [envaseAcumulado, setEnvaseAcumulado] = useState<any>({});
  // Estado para mostrar la alerta de acumulación solo una vez por envase
  const [alertaEnvases, setAlertaEnvases] = useState<{ [envase: string]: boolean }>({});

  // Cargar datos acumulados al entrar
  React.useEffect(() => {
    const cargarAcumulado = async () => {
      if (!seccionSeleccionada?.GranjaID) return;
      const fechaHoy = new Date().toISOString().split('T')[0];
      const datos = await DatabaseQueries.getEnvaseByFecha(fechaHoy, seccionSeleccionada.GranjaID);
      const acumulado: any = {};
      datos.forEach((row: any) => {
        acumulado[row.tipo] = {
          existenciaInicial: row.inicial || 0,
          recibido: row.recibido || 0,
          consumo: row.consumo || 0,
          existenciaFinal: row.final || 0,
        };
      });
      setEnvaseAcumulado(acumulado);
    };
    cargarAcumulado();
    // Limpiar inputs y alertas al entrar
    setTabla(() => {
      const obj: any = {};
      envases.forEach(envase => {
        obj[envase] = { existenciaInicial: '', recibido: '', consumo: '', existenciaFinal: '0' };
      });
      return obj;
    });
    setAlertaEnvases({});
    setGuardado(false);
  }, [seccionSeleccionada]);

  // Totales en tiempo real: suma de acumulado + input
  const totales = useMemo(() => {
    let existenciaInicial = 0, recibido = 0, consumo = 0, existenciaFinal = 0;
    envases.forEach(envase => {
      const acumulado = envaseAcumulado[envase] || { existenciaInicial: 0, recibido: 0, consumo: 0, existenciaFinal: 0 };
      const inputInicial = Number(tabla[envase].existenciaInicial) || 0;
      const inputRecibido = Number(tabla[envase].recibido) || 0;
      const inputConsumo = Number(tabla[envase].consumo) || 0;
      const final = acumulado.existenciaInicial + acumulado.recibido - acumulado.consumo + inputInicial + inputRecibido - inputConsumo;
      existenciaInicial += acumulado.existenciaInicial + inputInicial;
      recibido += acumulado.recibido + inputRecibido;
      consumo += acumulado.consumo + inputConsumo;
      existenciaFinal += final;
    });
    return { existenciaInicial, recibido, consumo, existenciaFinal };
  }, [tabla, envaseAcumulado]);

  // Alerta de acumulación y cálculo de existencia final por envase
  const handleChange = (envase: string, campo: string, valor: string) => {
    setTabla((prev: any) => {
      const newTabla = {
        ...prev,
        [envase]: {
          ...prev[envase],
          [campo]: valor.replace(/[^0-9.]/g, '')
        }
      };
      // Calcular existencia final para este envase (acumulado + input)
      const acumulado = envaseAcumulado[envase] || { existenciaInicial: 0, recibido: 0, consumo: 0 };
      const inicial = Number(newTabla[envase].existenciaInicial) || 0;
      const recibido = Number(newTabla[envase].recibido) || 0;
      const consumo = Number(newTabla[envase].consumo) || 0;
      newTabla[envase].existenciaFinal = String(
        acumulado.existenciaInicial + acumulado.recibido - acumulado.consumo + inicial + recibido - consumo
      );
      return newTabla;
    });
  };

  // Estado para saber si los datos ya se guardaron
  const [guardado, setGuardado] = useState(false);
  // Estado para evitar doble guardado
  const [guardando, setGuardando] = useState(false);

  // Función para saber si hay algún dato ingresado en cualquier input
  const hayDatosIngresados = () => {
    return envases.some(envase => {
      const datos = tabla[envase] || { existenciaInicial: '', recibido: '', consumo: '', existenciaFinal: '0' };
      return (
        (datos.existenciaInicial !== '' && datos.existenciaInicial !== '0') ||
        (datos.recibido !== '' && datos.recibido !== '0') ||
        (datos.consumo !== '' && datos.consumo !== '0')
      );
    });
  };

  // 1. Agrega estado para mostrar el modal
  const [modalSinGuardar, setModalSinGuardar] = useState(false);
  const [onConfirmSalir, setOnConfirmSalir] = useState<null | (() => void)>(null);

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
    }, [navigation, tabla, envases, guardado])
  );

  // Función para verificar si un envase está completo
  const isEnvaseCompleto = (envase: string) => {
    const datos = tabla[envase] || {};
    // Un envase está "completo" si al menos un campo tiene datos distintos de vacío o cero
    return (
      (datos.existenciaInicial !== '' && datos.existenciaInicial !== '0') ||
      (datos.recibido !== '' && datos.recibido !== '0') ||
      (datos.consumo !== '' && datos.consumo !== '0')
    );
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

  // Guardar solo los envases con algún dato ingresado y campos vacíos como null
  const handleGuardar = async () => {
    if (!seccionSeleccionada || !seccionSeleccionada.Nombre) {
      Alert.alert('Error', 'No se ha seleccionado una sección.');
      return;
    }
    const exito = await guardarEnvases(false);
    if (exito) {
      setTabla(() => {
        const obj: any = {};
        envases.forEach(envase => {
          obj[envase] = { existenciaInicial: '', recibido: '', consumo: '', existenciaFinal: '0' };
        });
        return obj;
      });
      setGuardado(true);
      // Recargar el acumulado después de guardar para que los totales reflejen la suma
      if ((seccionSeleccionada as any)?.GranjaID) {
        const fechaHoy = new Date().toISOString().split('T')[0];
        DatabaseQueries.getEnvaseByFecha(fechaHoy, (seccionSeleccionada as any)?.GranjaID).then(datos => {
          const acumulado: any = {};
          datos.forEach((row: any) => {
            acumulado[row.tipo] = {
              existenciaInicial: row.inicial || 0,
              recibido: row.recibido || 0,
              consumo: row.consumo || 0,
              existenciaFinal: row.final || 0,
            };
          });
          setEnvaseAcumulado(acumulado);
        });
      }
      Alert.alert('Éxito', 'Datos de envase guardados correctamente.');
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

  // Guardar solo los envases con algún dato ingresado y campos vacíos como null
  const guardarEnvases = async (forzar: boolean) => {
    if (guardando) return false;
    setGuardando(true);
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      for (const envase of envases) {
        const datos = tabla[envase];
        // Solo guardar si hay algún dato ingresado
        if (
          datos.existenciaInicial !== '' ||
          datos.recibido !== '' ||
          datos.consumo !== ''
        ) {
          const data: any = {
            caseta: envase,
            fecha: fechaHoy,
            granja_id: (seccionSeleccionada as any)?.GranjaID ?? null,
            tipo: envase,
            inicial: datos.existenciaInicial === '' ? null : Number(datos.existenciaInicial),
            recibido: datos.recibido === '' ? null : Number(datos.recibido),
            consumo: datos.consumo === '' ? null : Number(datos.consumo),
            final: null, // El cálculo acumulado lo hace la DB
          };
          await DatabaseQueries.insertEnvase(data);
        }
      }
      // Recargar acumulado después de guardar
      const datos = await DatabaseQueries.getEnvaseByFecha(fechaHoy, (seccionSeleccionada as any)?.GranjaID ?? null);
      const acumulado: any = {};
      datos.forEach((row: any) => {
        acumulado[row.tipo] = {
          existenciaInicial: row.inicial || 0,
          recibido: row.recibido || 0,
          consumo: row.consumo || 0,
          existenciaFinal: row.final || 0,
        };
      });
      setEnvaseAcumulado(acumulado);
      return true;
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudieron guardar los datos.');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Estado para controlar qué envases están abiertos
  const [envasesAbiertos, setEnvasesAbiertos] = useState<{ [envase: string]: boolean }>(() => {
    const obj: { [envase: string]: boolean } = {};
    envases.forEach(e => { obj[e] = false; });
    return obj;
  });

  const toggleEnvase = (envase: string) => {
    if (typeof LayoutAnimation !== 'undefined') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setEnvasesAbiertos(prev => ({ ...prev, [envase]: !prev[envase] }));
  };

  // Obtener GranjaID de la seccion seleccionada (asumiendo que seccionSeleccionada es un objeto con GranjaID y Nombre)
  // Ajuste temporal para soportar string u objeto
  const granjaId = (seccionSeleccionada as any)?.GranjaID ?? null;
  const { casetas, loading: loadingCasetas, error: errorCasetas } = useCasetas(granjaId);

  // Filtrar solo las casetas de la granja seleccionada (por si la API no lo hace)
  const casetasFiltradas = casetas?.filter(c => c.GranjaID === granjaId) ?? [];

  // useEffect para limpiar los inputs al entrar
  React.useEffect(() => {
    setGuardado(false);
    setTabla(() => {
      const obj: any = {};
      envases.forEach(envase => {
        obj[envase] = { existenciaInicial: '', recibido: '', consumo: '', existenciaFinal: '0' };
      });
      return obj;
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ENVASE</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/Iconos/envase.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>{seccionSeleccionada?.Nombre} - {fechaHoy}</Text>
          </View>
          {envases.map((envase, idx) => {
            const completo = isEnvaseCompleto(envase);
            return (
              <View
                key={envase}
                style={[
                  styles.envaseBlock,
                  idx % 2 === 0 ? styles.envaseBlockEven : styles.envaseBlockOdd,
                  completo
                    ? { backgroundColor: '#b6f5c3', borderColor: '#1db954', borderWidth: 2, shadowColor: '#1db954', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }
                    : styles.envaseBlockRoja,
                ]}
              >
              <TouchableOpacity onPress={() => toggleEnvase(envase)} style={styles.casetaHeader} activeOpacity={0.7}>
                <Text style={styles.casetaTitle}>{envase}</Text>
                <Text style={styles.caret}>{envasesAbiertos[envase] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {envasesAbiertos[envase] && (
                <View style={styles.casetaContent}>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Existencia Inicial</Text>
                    <TextInput
                      style={styles.inputCell}
                      value={tabla[envase].existenciaInicial}
                      onChangeText={v => handleChange(envase, 'existenciaInicial', v)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Recibido</Text>
                    <TextInput
                      style={styles.inputCell}
                      value={tabla[envase].recibido}
                      onChangeText={v => handleChange(envase, 'recibido', v)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Consumo</Text>
                    <TextInput
                      style={styles.inputCell}
                      value={tabla[envase].consumo}
                      onChangeText={v => handleChange(envase, 'consumo', v)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Existencia Final</Text>
                    <TextInput
                      style={styles.inputCell}
                      value={tabla[envase].existenciaFinal}
                      onChangeText={v => handleChange(envase, 'existenciaFinal', v)}
                      keyboardType="numeric"
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
            <View style={styles.totalesRow}>
              <Text style={styles.totalesCell}>Existencia Inicial: {totales.existenciaInicial}</Text>
              <Text style={styles.totalesCell}>Recibido: {totales.recibido}</Text>
              <Text style={styles.totalesCell}>Consumo: {totales.consumo}</Text>
              <Text style={styles.totalesCell}>Existencia Final: {totales.existenciaFinal}</Text>
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
  casetaCell: { fontWeight: 'bold', fontSize: 13, minWidth: 110, textAlign: 'center', color: '#333' },
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
  envaseBlock: { borderRadius: 10, margin: 10, padding: 0, elevation: 2, overflow: 'hidden' },
  envaseBlockEven: { backgroundColor: '#f4f8fd' },
  envaseBlockOdd: { backgroundColor: '#e0e7ef' },
  envaseBlockRoja: { backgroundColor: '#ffd6d6', borderColor: '#e53935', borderWidth: 2, shadowColor: '#e53935', shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
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
