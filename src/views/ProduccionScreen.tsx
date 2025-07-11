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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Constantes
const tiposHuevo = ['BLANCO', 'ROTO 1', 'ROTO 2', 'MANCHADO', 'FRAGIL 1', 'FRAGIL 2', 'YEMA', 'B1', 'EXTRA 240P25'];
const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`);
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`);

// Tipos
type RegistroProduccion = {
  [tipo: string]: {
    cajas: string;
    restos: string;
  };
};

type ProduccionData = {
  [seccion: string]: {
    [caseta: string]: RegistroProduccion;
  };
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

export default function ProduccionScreen() {
  const [produccionData, setProduccionData] = useState<ProduccionData>(() => {
    const initial: ProduccionData = {};
    secciones.forEach(seccion => {
      initial[seccion] = {};
      casetas.forEach(caseta => {
        initial[seccion][caseta] = tiposHuevo.reduce((acc, tipo) => {
          acc[tipo] = { cajas: '', restos: '' };
          return acc;
        }, {} as RegistroProduccion);
      });
    });
    return initial;
  });

  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSeccion, setSelectedSeccion] = useState(secciones[0]);
  const [selectedCaseta, setSelectedCaseta] = useState<string | null>(null);
  const [showModalSeccion, setShowModalSeccion] = useState(false);

  const formattedDate = useMemo(() =>
    fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    [fecha]
  );

  const handleDateChange = useCallback((_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setFecha(date);
  }, []);

  const handleChange = useCallback(
    (seccion: string, caseta: string, tipo: string, campo: 'cajas' | 'restos', value: string) => {
      setProduccionData(prev => ({
        ...prev,
        [seccion]: {
          ...prev[seccion],
          [caseta]: {
            ...prev[seccion][caseta],
            [tipo]: {
              ...prev[seccion][caseta][tipo],
              [campo]: value,
            },
          },
        },
      }));
    },
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado */}
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

      {/* Contenido */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        {!selectedCaseta ? (
          <ScrollView contentContainerStyle={styles.casetaList}>
            {casetas.map(caseta => (
              <TouchableOpacity key={caseta} style={styles.casetaCard} onPress={() => setSelectedCaseta(caseta)}>
                <Icon name="home" size={24} color="#517aa2" />
                <Text style={styles.casetaText}>{caseta}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formTitle}>REGISTRO - {selectedSeccion} / {selectedCaseta}</Text>

            {tiposHuevo.map(tipo => (
              <Card key={tipo}>
                <Text style={styles.cardTitle}>{tipo}</Text>
                <CustomInput
                  label="Cajas"
                  value={produccionData[selectedSeccion][selectedCaseta][tipo].cajas}
                  onChangeText={text => handleChange(selectedSeccion, selectedCaseta!, tipo, 'cajas', text)}
                />
                <CustomInput
                  label="Restos"
                  value={produccionData[selectedSeccion][selectedCaseta][tipo].restos}
                  onChangeText={text => handleChange(selectedSeccion, selectedCaseta!, tipo, 'restos', text)}
                />
              </Card>
            ))}

            <View style={styles.buttonRow}>
              <Button title="GUARDAR" onPress={() => { /* guardar datos */ }} icon="save" />
              <Button title="CANCELAR" onPress={() => setSelectedCaseta(null)} icon="close" />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modal de Sección */}
      <Modal visible={showModalSeccion} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una sección</Text>
            <ScrollView>
              {secciones.map(seccion => (
                <TouchableOpacity
                  key={seccion}
                  onPress={() => {
                    setSelectedSeccion(seccion);
                    setShowModalSeccion(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text>{seccion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker value={fecha} mode="date" display="default" onChange={handleDateChange} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf1f9',
  },
  header: {
    backgroundColor: '#749BC2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  seccionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seccionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 6,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5f85a2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 6,
  },
  content: {
    flex: 1,
  },
  casetaList: {
    padding: 16,
  },
  casetaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 3,
  },
  casetaText: {
    fontSize: 16,
    color: '#517aa2',
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#517aa2',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#749BC2',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  floatingLabel: {
    position: 'absolute',
    top: -10,
    left: 12,
    fontSize: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    color: '#64748b',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 30,
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
});
