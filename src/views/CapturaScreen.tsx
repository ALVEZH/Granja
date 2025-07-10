import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
import { TextInput as PaperInput, Button, Card, Divider } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;
const totalCasetas = 9;

const tiposHuevos = [
  'Blanco', 'Roto 1', 'Roto 2', 'Manchado', 'Frágil 1', 'Frágil 2',
  'Yema', 'B1', 'Extra 240PZS',
];

const tiposEnvaseDetalle = [
  'Caja Tipo A',
  'Separador Tipo A',
  'Caja Tipo B',
  'Separador Tipo B',
  'Cono 240 PZS',
  'Cono Estrella',
  'Cinta Estrella',
  'Cinta Blanca',
];

export default function ProduccionPasoAPaso() {
  const [casetaActual, setCasetaActual] = useState(0);
  const [pasoActual, setPasoActual] = useState(0);

  // Estados para Producción (cajas y restos por tipo huevo)
  const [produccion, setProduccion] = useState(
    tiposHuevos.map(() => ({ cajas: '', restos: '' }))
  );

  // Estados para Alimento
  const [alimento, setAlimento] = useState({
    existenciaInicial: '',
    entrada: '',
    consumo: '',
    tipo: '',
  });

  // Estados para Existencia (con edad, mortalidad y final aves)
  const [existencia, setExistencia] = useState({
    inicial: '',
    entrada: '',
    salida: '',
    final: '',
    edad: '',
    mortalidad: '',
    finalAves: '',
  });

  // Estados para Envases
  const [envases, setEnvases] = useState(
    tiposEnvaseDetalle.map(() => ({
      inicial: '',
      recibido: '',
      consumo: '',
      final: '',
    }))
  );

  // Manejo de cambios en Producción
  const handleProduccionChange = (index: number, field: 'cajas' | 'restos', value: string) => {
    const newProduccion = [...produccion];
    newProduccion[index][field] = value;
    setProduccion(newProduccion);
  };

  // Manejo cambios Alimento
  const handleAlimentoChange = (field: keyof typeof alimento, value: string) => {
    setAlimento(prev => ({ ...prev, [field]: value }));
  };

  // Manejo cambios Existencia
  const handleExistenciaChange = (field: keyof typeof existencia, value: string) => {
    setExistencia(prev => ({ ...prev, [field]: value }));
  };

  // Manejo cambios Envases
  const handleEnvaseChange = (
    index: number,
    field: 'inicial' | 'recibido' | 'consumo' | 'final',
    value: string
  ) => {
    const newEnvases = [...envases];
    newEnvases[index][field] = value;
    setEnvases(newEnvases);
  };

  // Parsear número seguro
  const parseNum = (v: string) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  // Totales Producción
  const totalProduccionCajas = produccion.reduce((acc, cur) => acc + parseNum(cur.cajas), 0);
  const totalProduccionRestos = produccion.reduce((acc, cur) => acc + parseNum(cur.restos), 0);

  // Totales Existencia
  const totalExistenciaInicial = parseNum(existencia.inicial);
  const totalExistenciaEntrada = parseNum(existencia.entrada);
  const totalExistenciaSalida = parseNum(existencia.salida);
  const totalExistenciaFinal = parseNum(existencia.final);
  const mortalidadAves = parseNum(existencia.mortalidad);
  const finalAves = parseNum(existencia.finalAves);

  // Totales Envases
  const totalEnvaseInicial = envases.reduce((acc, cur) => acc + parseNum(cur.inicial), 0);
  const totalEnvaseRecibido = envases.reduce((acc, cur) => acc + parseNum(cur.recibido), 0);
  const totalEnvaseConsumo = envases.reduce((acc, cur) => acc + parseNum(cur.consumo), 0);
  const totalEnvaseFinal = envases.reduce((acc, cur) => acc + parseNum(cur.final), 0);

  const avanzarPaso = () => setPasoActual((p) => (p < 3 ? p + 1 : p));
  const retrocederPaso = () => setPasoActual((p) => (p > 0 ? p - 1 : p));

  const siguienteCaseta = () => {
    if (casetaActual < totalCasetas - 1) {
      setCasetaActual(casetaActual + 1);
      setPasoActual(0);
    }
  };

  const anteriorCaseta = () => {
    if (casetaActual > 0) {
      setCasetaActual(casetaActual - 1);
      setPasoActual(0);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>🐔 Caseta {casetaActual + 1} / {totalCasetas}</Text>

        <Card style={styles.card}>
          <Card.Content>
            {pasoActual === 0 && (
              <>
                <Text style={styles.title}>🥚 Producción</Text>
                {tiposHuevos.map((tipo, i) => (
                  <View key={i} style={styles.rowWrap}>
                    <Text style={styles.label}>{tipo}</Text>
                    <View style={styles.inputGroup}>
                      <PaperInput
                        style={styles.smallInput}
                        placeholder="Cajas"
                        keyboardType="numeric"
                        mode="outlined"
                        value={produccion[i].cajas}
                        onChangeText={(v) => handleProduccionChange(i, 'cajas', v)}
                      />
                      <PaperInput
                        style={styles.smallInput}
                        placeholder="Restos"
                        keyboardType="numeric"
                        mode="outlined"
                        value={produccion[i].restos}
                        onChangeText={(v) => handleProduccionChange(i, 'restos', v)}
                      />
                    </View>
                  </View>
                ))}
                <Divider style={{ marginVertical: 10 }} />
                <Text style={styles.totalText}>
                  Total Cajas: {totalProduccionCajas} | Total Restos: {totalProduccionRestos}
                </Text>
              </>
            )}

            {pasoActual === 1 && (
              <>
                <Text style={styles.title}>🍽 Alimento</Text>
                <View style={styles.rowWrap}>
                  <PaperInput
                    label="Existencia Inicial"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={alimento.existenciaInicial}
                    onChangeText={(v) => handleAlimentoChange('existenciaInicial', v)}
                  />
                  <PaperInput
                    label="Entrada"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={alimento.entrada}
                    onChangeText={(v) => handleAlimentoChange('entrada', v)}
                  />
                  <PaperInput
                    label="Consumo"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={alimento.consumo}
                    onChangeText={(v) => handleAlimentoChange('consumo', v)}
                  />
                </View>
                <View style={styles.rowWrap}>
                  <PaperInput
                    label="Tipo"
                    style={styles.flexInput}
                    mode="outlined"
                    value={alimento.tipo}
                    onChangeText={(v) => handleAlimentoChange('tipo', v)}
                  />
                </View>
              </>
            )}

            {pasoActual === 2 && (
              <>
                <Text style={styles.title}>📊 Existencia</Text>
                <View style={styles.rowWrap}>
                  <PaperInput
                    label="Inicial"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={existencia.inicial}
                    onChangeText={(v) => handleExistenciaChange('inicial', v)}
                  />
                  <PaperInput
                    label="Entrada"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={existencia.entrada}
                    onChangeText={(v) => handleExistenciaChange('entrada', v)}
                  />
                  <PaperInput
                    label="Salida"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={existencia.salida}
                    onChangeText={(v) => handleExistenciaChange('salida', v)}
                  />
                  <PaperInput
                    label="Final"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={existencia.final}
                    onChangeText={(v) => handleExistenciaChange('final', v)}
                  />
                </View>
                <View style={styles.rowWrap}>
                  <PaperInput
                    label="Edad (días)"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={existencia.edad}
                    onChangeText={(v) => handleExistenciaChange('edad', v)}
                  />
                  <PaperInput
                    label="Mortalidad de Aves"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={existencia.mortalidad}
                    onChangeText={(v) => handleExistenciaChange('mortalidad', v)}
                  />
                  <PaperInput
                    label="Existencia Final de Aves"
                    style={styles.flexInput}
                    mode="outlined"
                    keyboardType="numeric"
                    value={existencia.finalAves}
                    onChangeText={(v) => handleExistenciaChange('finalAves', v)}
                  />
                </View>
                <Divider style={{ marginVertical: 10 }} />
                <Text style={styles.totalText}>
                  Totales Existencia - Inicial: {totalExistenciaInicial} | Entrada: {totalExistenciaEntrada} | Salida: {totalExistenciaSalida} | Final: {totalExistenciaFinal} | Mortalidad: {mortalidadAves} | Final Aves: {finalAves}
                </Text>
              </>
            )}

            {pasoActual === 3 && (
              <>
                <Text style={styles.title}>🧺 Envases</Text>
                <View style={styles.envaseSection}>
                  <View style={styles.envaseHeaderRow}>
                    <Text style={styles.envaseHeader}>Tipo</Text>
                    <Text style={styles.envaseHeader}>Inicial</Text>
                    <Text style={styles.envaseHeader}>Recibido</Text>
                    <Text style={styles.envaseHeader}>Consumo</Text>
                    <Text style={styles.envaseHeader}>Final</Text>
                  </View>
                  {tiposEnvaseDetalle.map((tipo, idx) => (
                    <View key={idx} style={styles.envaseRow}>
                      <Text style={styles.envaseLabel}>{tipo}</Text>
                      <PaperInput
                        mode="outlined"
                        style={styles.envaseInput}
                        keyboardType="numeric"
                        value={envases[idx].inicial}
                        onChangeText={(v) => handleEnvaseChange(idx, 'inicial', v)}
                      />
                      <PaperInput
                        mode="outlined"
                        style={styles.envaseInput}
                        keyboardType="numeric"
                        value={envases[idx].recibido}
                        onChangeText={(v) => handleEnvaseChange(idx, 'recibido', v)}
                      />
                      <PaperInput
                        mode="outlined"
                        style={styles.envaseInput}
                        keyboardType="numeric"
                        value={envases[idx].consumo}
                        onChangeText={(v) => handleEnvaseChange(idx, 'consumo', v)}
                      />
                      <PaperInput
                        mode="outlined"
                        style={styles.envaseInput}
                        keyboardType="numeric"
                        value={envases[idx].final}
                        onChangeText={(v) => handleEnvaseChange(idx, 'final', v)}
                      />
                    </View>
                  ))}
                </View>
                <Divider style={{ marginVertical: 10 }} />
                <Text style={styles.totalText}>
                  Totales Envases - Inicial: {totalEnvaseInicial} | Recibido: {totalEnvaseRecibido} | Consumo: {totalEnvaseConsumo} | Final: {totalEnvaseFinal}
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.navigation}>
        <View style={styles.navRow}>
          <Button mode="outlined" onPress={retrocederPaso} disabled={pasoActual === 0}>⬅ Paso</Button>
          <Button mode="contained" onPress={avanzarPaso} disabled={pasoActual === 3}>Paso ➡</Button>
        </View>
        <View style={styles.navRow}>
          <Button mode="outlined" onPress={anteriorCaseta} disabled={casetaActual === 0}>⏮ Caseta</Button>
          <Button mode="contained" onPress={siguienteCaseta} disabled={casetaActual === totalCasetas - 1}>Caseta ⏭</Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#eef5ff',
  },
  scrollContainer: {
    padding: 12,
    paddingBottom: 150,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#204080',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  rowWrap: {
    flexDirection: 'column',
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  smallInput: {
    flex: 1,
    marginRight: 5,
  },
  flexInput: {
    flex: 1,
    marginVertical: 5,
    marginHorizontal: 5,
  },
  envaseSection: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  envaseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  envaseHeader: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    color: '#2a5d9f',
  },
  envaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  envaseLabel: {
    flex: 1,
    fontSize: 12,
    paddingRight: 4,
    color: '#333',
  },
  envaseInput: {
    width: '20%',
    height: 40,
    marginHorizontal: 2,
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
  },
  navigation: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a3d7c',
  },
});
