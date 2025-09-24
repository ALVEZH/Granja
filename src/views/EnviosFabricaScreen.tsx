// src/screens/EnviosFabricaScreen.tsx
import React, { useState, useLayoutEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useEnviosFabrica, EnvioFabrica } from "../hooks/useEnviosFabrica";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useGranjas } from "../hooks/useGranjas";
import { useSilos } from "../hooks/useSilos";
import EnvioFabricaCard from "../components/EnvioFabricaCard";

const EnviosFabricaScreen: React.FC = () => {
  const { envios, reload, deleteEnvio, saveEnvio } = useEnviosFabrica();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { granjas } = useGranjas();
  const { silos } = useSilos();

  // Campos del modal
  const [fecha, setFecha] = useState(new Date());
  const [granjaDestinoID, setGranjaDestinoID] = useState<number | null>(null);
  const [siloDestinoID, setSiloDestinoID] = useState<number | null>(null);
  const [tipoAlimento, setTipoAlimento] = useState("");
  const [cantidadKg, setCantidadKg] = useState("");
  const [chofer, setChofer] = useState("");
  const [placas, setPlacas] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  // Filtro por rango de fechas
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);

  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

  // Refrescar lista
  const onRefresh = async () => {
    await reload();
  };

  // Abrir modal
  const handleAdd = () => {
    setFecha(new Date());
    setGranjaDestinoID(null);
    setSiloDestinoID(null);
    setTipoAlimento("");
    setCantidadKg("");
    setChofer("");
    setPlacas("");
    setObservaciones("");
    setModalVisible(true);
  };

  // Guardar envío
  const handleGuardar = async () => {
  if (!granjaDestinoID || !siloDestinoID || !tipoAlimento || !cantidadKg || !chofer || !placas) {
    Alert.alert("Error", "Por favor completa todos los campos obligatorios.");
    return;
  }

  Alert.alert(
    "Confirmar envío",
    "¿Estás seguro de que deseas guardar este envío?",
    [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Aceptar",
        onPress: async () => {
          setLoading(true);
          try {
            await saveEnvio({
              Fecha: fecha.toISOString(),
              GranjaDestinoID: granjaDestinoID,
              SiloDestinoID: siloDestinoID,
              TipoAlimento: tipoAlimento,
              CantidadKg: parseFloat(cantidadKg),
              Chofer: chofer,
              Placas: placas,
              Observaciones: observaciones,
            });
            setModalVisible(false);
            await reload();
          } catch (err: any) {
            Alert.alert("Error", err.message || "No se pudo guardar el envío");
          } finally {
            setLoading(false);
          }
        },
      },
    ]
  );
};


  // Eliminar envío
  const handleDelete = (id: number) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Desea eliminar este envío?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteEnvio(id) },
      ]
    );
  };

  // Renderizar cada ítem
  const renderItem = ({ item }: { item: EnvioFabrica }) => (
    <EnvioFabricaCard 
    item={item} 
    granjas={granjas} 
    silos={silos}  />
  );

  // Aplicar filtro por rango de fechas
  const enviosFiltrados = envios.filter((e) => {
    const f = new Date(e.Fecha);
    if (fechaInicio && f < startOfDay(fechaInicio)) return false;
    if (fechaFin && f > endOfDay(fechaFin)) return false;
    return true;
  });

  // Configuración del header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("../../assets/Iconos/fabrica.png")}
            style={{ width: 32, height: 32, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>Envios Fábrica</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleAdd} style={{ marginRight: 16 }}>
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtro por rango de fechas */}
      <View style={styles.filtroContainer}>
        <TouchableOpacity style={styles.filtroBtn} onPress={() => setShowPickerInicio(true)}>
          <Text style={styles.filtroBtnText}>
            {fechaInicio ? startOfDay(fechaInicio).toISOString().split("T")[0] : "Inicio"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filtroBtn} onPress={() => setShowPickerFin(true)}>
          <Text style={styles.filtroBtnText}>
            {fechaFin ? endOfDay(fechaFin).toISOString().split("T")[0] : "Fin"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.limpiarBtn} onPress={() => { setFechaInicio(null); setFechaFin(null); }}>
          <Text style={styles.limpiarBtnText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      {fechaInicio && fechaFin && (
        <View style={{ alignItems: "center", marginVertical: 6 }}>
          <Text style={{ fontStyle: "italic" }}>
            Filtrando del {fechaInicio.toLocaleDateString()} al {fechaFin.toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* DatePickers */}
      {showPickerInicio && (
        <DateTimePicker
          value={fechaInicio || new Date()}
          mode="date"
          display="spinner"
          onChange={(_, selected) => {
            setShowPickerInicio(false);
            if (selected) setFechaInicio(selected);
          }}
        />
      )}
      {showPickerFin && (
        <DateTimePicker
          value={fechaFin || new Date()}
          mode="date"
          display="spinner"
          onChange={(_, selected) => {
            setShowPickerFin(false);
            if (selected) {
              if (fechaInicio && selected < fechaInicio) {
                Alert.alert("Error", "La fecha fin no puede ser menor que la fecha inicio");
              } else setFechaFin(selected);
            }
          }}
        />
      )}

      {/* Lista de envíos filtrados */}
      {/* Lista de envíos */}
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={enviosFiltrados}
          renderItem={renderItem}
          keyExtractor={(item) => item.EnvioFabricaID.toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              {fechaInicio || fechaFin
                ? "No hay envíos en este rango de fechas."
                : "No hay envíos registrados."}
            </Text>
          }
          contentContainerStyle={styles.scroll}
        />
      </KeyboardAvoidingView>


      

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Nuevo Envío a Fábrica</Text>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Granja Destino */}
                <Text style={styles.label}>Granja Destino</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={granjaDestinoID}
                    onValueChange={(value) => { setGranjaDestinoID(value); setSiloDestinoID(null); }}
                  >
                    <Picker.Item label="Seleccione una granja" value={null} />
                    {granjas.map((g) => (
                      <Picker.Item key={g.GranjaID} label={g.Nombre} value={g.GranjaID} />
                    ))}
                  </Picker>
                </View>

                {/* Silo Destino */}
                <Text style={styles.label}>Silo Destino</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={siloDestinoID}
                    enabled={!!granjaDestinoID}
                    onValueChange={(value) => setSiloDestinoID(value)}
                  >
                    <Picker.Item label="Seleccione un silo" value={null} />
                    {silos.filter(s => s.GranjaID === granjaDestinoID && s.Activo)
                          .map(s => <Picker.Item key={s.SiloID} label={s.Nombre} value={s.SiloID} />)}
                  </Picker>
                </View>

                {/* Tipo de Alimento */}
                <Text style={styles.label}>Tipo de Alimento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tipo de Alimento"
                  value={tipoAlimento}
                  onChangeText={text => {
                    const regex = /^[a-zA-Z\s]*$/;
                    if (regex.test(text)) setTipoAlimento(text);
                    else Alert.alert("Entrada inválida", "Solo letras y espacios.");
                  }}
                />

                {/* Cantidad Kg */}
                <Text style={styles.label}>Cantidad (Kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cantidad"
                  keyboardType="numeric"
                  value={cantidadKg}
                  onChangeText={setCantidadKg}
                />

                {/* Chofer */}
                <Text style={styles.label}>Chofer</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del chofer"
                  value={chofer}
                  onChangeText={text => {
                    const regex = /^[a-zA-Z\s]*$/;
                    if (regex.test(text)) setChofer(text);
                    else Alert.alert("Entrada inválida", "Solo letras y espacios.");
                  }}
                />

                {/* Placas */}
                <Text style={styles.label}>Placas</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Placas"
                  value={placas}
                  onChangeText={text => {
                    const regex = /^[a-zA-Z0-9]*$/;
                    if (regex.test(text)) setPlacas(text);
                    else Alert.alert("Entrada inválida", "Solo letras y números.");
                  }}
                />

                {/* Observaciones */}
                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Opcional"
                  multiline
                  value={observaciones}
                  onChangeText={setObservaciones}
                />

                {/* Fecha */}
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateInput}>Fecha: {fecha.toISOString().split("T")[0]}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={fecha}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setFecha(selectedDate);
                    }}
                  />
                )}

                {/* Botones */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, loading && { backgroundColor: "#999" }]}
                    onPress={handleGuardar}
                    disabled={loading}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {loading ? "Guardando..." : "Guardar"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#aaa" }]}
                    onPress={() => {
                      Alert.alert(
                        "Confirmar cancelación",
                        "¿Estás seguro de que deseas cancelar? Se perderán los cambios.",
                        [
                          { text: "No", style: "cancel" },
                          { text: "Sí, cancelar", style: "destructive", onPress: () => setModalVisible(false) }
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default EnviosFabricaScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eaf1f9" },
  filtroContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f7fa",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3, // sombra para Android
    shadowColor: "#000", // sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  filtroBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  filtroBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  limpiarBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  limpiarBtnText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
  },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, padding: 16 },
  modalBackground: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999 },
  modalContainer: { width: "90%", backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  label: { fontWeight: "bold", marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 10 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10 },
  dateInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  modalButton: { flex: 1, backgroundColor: "#007AFF", padding: 10, marginHorizontal: 5, borderRadius: 8, alignItems: "center" },
});
