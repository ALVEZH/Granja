import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Constantes
const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`);

type EnvaseData = {
  existenciaInicial: string;
  recibido: string;
  consumo: string;
  existenciaFinal: string;
};

const envases = [
  'CAJA TIPO A',
  'SEPARADOR TIPO A',
  'CAJA TIPO B',
  'SEPARADOR TIPO B',
  'CONO',
  'CONO 240 PZS',
  'CONO ESTRELLA',
  'CINTA',
  'CINTA BLANCA',
];

// Tipo de datos por sección (solo secciones, no casetas)
type EnvaseSeccionData = {
  [envase: string]: EnvaseData;
};

type EnvaseDataPorSeccion = {
  [seccion: string]: EnvaseSeccionData;
};

// Input personalizado
const CustomInput = ({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) => (
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={label}
      keyboardType="numeric"
      placeholderTextColor="#94a3b8"
    />
    {value ? <Text style={styles.floatingLabel}>{label}</Text> : null}
  </View>
);

// Tarjeta reutilizable
const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

// Botón reutilizable
const Button = ({
  title,
  onPress,
  icon,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
}) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    {icon && <Icon name={icon} size={20} color="#fff" style={{ marginRight: 8 }} />}
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

export default function EnvaseScreen() {
  // Inicializar estructura vacía para todos envases en cada sección
  const inicializarDatos = () => {
    const data: EnvaseDataPorSeccion = {};
    secciones.forEach((sec) => {
      data[sec] = {};
      envases.forEach((env) => {
        data[sec][env] = { existenciaInicial: '', recibido: '', consumo: '', existenciaFinal: '' };
      });
    });
    return data;
  };

  const [envaseData, setEnvaseData] = useState<EnvaseDataPorSeccion>(inicializarDatos);
  const [selectedSeccion, setSelectedSeccion] = useState(secciones[0]);
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showModalSeccion, setShowModalSeccion] = useState(false);

  const formattedDate = useMemo(
    () => fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    [fecha],
  );

  const handleDateChange = useCallback((_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setFecha(date);
  }, []);

  const handleChange = useCallback(
    (seccion: string, envase: string, campo: keyof EnvaseData, valor: string) => {
      setEnvaseData((prev) => ({
        ...prev,
        [seccion]: {
          ...prev[seccion],
          [envase]: {
            ...prev[seccion][envase],
            [campo]: valor,
          },
        },
      }));
    },
    [],
  );

  const handleGuardar = () => {
    // Aquí podrías guardar en SQLite o backend según sección y fecha
    Alert.alert(
      'Guardado',
      `Datos de "${selectedSeccion}" para fecha ${formattedDate} guardados correctamente.`,
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: selector sección y fecha */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowModalSeccion(true)} style={styles.seccionSelector}>
          <Text style={styles.seccionText}>{selectedSeccion}</Text>
          <Icon name="arrow-drop-down" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelector}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Icon name="event" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {envases.map((envase) => {
            const data = envaseData[selectedSeccion][envase];
            return (
              <Card key={envase}>
                <Text style={styles.cardTitle}>{envase}</Text>
                <CustomInput
                  label="Existencia Inicial"
                  value={data.existenciaInicial}
                  onChangeText={(text) => handleChange(selectedSeccion, envase, 'existenciaInicial', text)}
                />
                <CustomInput
                  label="Recibido"
                  value={data.recibido}
                  onChangeText={(text) => handleChange(selectedSeccion, envase, 'recibido', text)}
                />
                <CustomInput
                  label="Consumo"
                  value={data.consumo}
                  onChangeText={(text) => handleChange(selectedSeccion, envase, 'consumo', text)}
                />
                <CustomInput
                  label="Existencia Final"
                  value={data.existenciaFinal}
                  onChangeText={(text) => handleChange(selectedSeccion, envase, 'existenciaFinal', text)}
                />
              </Card>
            );
          })}

          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Button title="GUARDAR" onPress={handleGuardar} icon="save" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal selección sección */}
      <Modal visible={showModalSeccion} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una sección</Text>
            <ScrollView>
              {secciones.map((sec) => (
                <TouchableOpacity
                  key={sec}
                  onPress={() => {
                    setSelectedSeccion(sec);
                    setShowModalSeccion(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text>{sec}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={fecha}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf1f9' },
  header: {
    backgroundColor: '#749BC2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  seccionSelector: { flexDirection: 'row', alignItems: 'center' },
  seccionText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 6 },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5f85a2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateText: { color: '#fff', fontSize: 14, marginRight: 6 },
  content: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#749BC2',
    textAlign: 'center',
  },
  inputContainer: { position: 'relative', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#749BC2',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f0f5fb',
    fontSize: 14,
    textAlign: 'center',
  },
  floatingLabel: {
    position: 'absolute',
    top: -10,
    left: 12,
    fontSize: 12,
    backgroundColor: '#eaf1f9',
    paddingHorizontal: 4,
    color: '#555',
  },
  button: {
    backgroundColor: '#749BC2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modalItem: { paddingVertical: 12, borderBottomColor: '#ccc', borderBottomWidth: 1 },
});
