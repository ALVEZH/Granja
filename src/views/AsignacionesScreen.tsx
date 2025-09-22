import React, { useState, useLayoutEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAsignaciones, Asignacion } from "../hooks/useAsignaciones";
import { useCasetas } from "../hooks/useCasetas";
import { useSilos } from "../hooks/useSilos";
import { useGranjas, Granja } from "../hooks/useGranjas";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

const AsignacionesScreen: React.FC = () => {
  const { asignaciones, reload, saveAsignacion } = useAsignaciones();
  const { silos } = useSilos();
  const { granjas } = useGranjas();

  // filtro para la lista (picker superior)
  const [filterGranjaID, setFilterGranjaID] = useState<number | null>(null);
  // casetas para el filtro (se usan para resolver nombre en la lista)
  // Todas las casetas (para renderizar la lista)
  const { casetas: allCasetas } = useCasetas(null);

  // estados para el modal
  const [selectedGranjaID, setSelectedGranjaID] = useState<number | null>(null);
  // casetas para el modal (usa tu hook tal cual)
  const { casetas } = useCasetas(selectedGranjaID);

  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [modalVisible, setModalVisible] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [granjaID, setGranjaID] = useState<number | null>(null);
  const [casetaID, setCasetaID] = useState<number | null>(null);
  const [tipoAlimento, setTipoAlimento] = useState("");
  const [siloID, setSiloID] = useState<number | null>(null);
  const [notas, setNotas] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => navigation.replace("Menu" );


  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleAdd = () => {
    setFecha(new Date());
    setGranjaID(null);
    setSelectedGranjaID(null);
    setCasetaID(null);
    setTipoAlimento("");
    setSiloID(null);
    setNotas("");
    setModalVisible(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("../../assets/Iconos/asignar.png")}
            style={{ width: 32, height: 32, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
            Asignaciones
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleAdd} style={{ marginRight: 16 }}>
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleSave = async () => {
  if (!fecha || !granjaID || !casetaID || !tipoAlimento) {
    Alert.alert("Error", "Granja, Caseta, Fecha y Tipo de Alimento son obligatorios");
    return;
  }

  Alert.alert(
    "Confirmación",
    "¿Deseas guardar esta asignación?",
    [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Guardar",
        onPress: async () => {
          try {
            setLoading(true); // 🔹 activa el loading
            await saveAsignacion({
              GranjaID: granjaID,
              CasetaID: casetaID,
              TipoAlimento: tipoAlimento,
              SiloPreferenteID: siloID,
              FechaAsignacion: fecha.toISOString().split("T")[0],
              Notas: notas,
            });
            setModalVisible(false);
          } catch (err: any) {
            Alert.alert("Error", err.message);
          } finally {
            setLoading(false); // 🔹 desactiva el loading
          }
        },
      },
    ]
  );
};

  // datos a mostrar: si hay filtro, solo asignaciones de esa granja
  const displayedAsignaciones: Asignacion[] = filterGranjaID
    ? (asignaciones || []).filter((a) => a.GranjaID === filterGranjaID)
    : (asignaciones || []);

  const renderItem = ({ item }: { item: Asignacion }) => {
    // Buscar caseta dentro de TODAS las que tengas cargadas
    const casetaSeleccionada = casetas.find(c => c.CasetaID === item.CasetaID);
    const casetaNombre = casetaSeleccionada
      ? casetaSeleccionada.Nombre
      : `ID ${item.CasetaID}`;

      // 🔹 Resolver granja por nombre
    const granjaSeleccionada = granjas.find(g => g.GranjaID === item.GranjaID);
    const granjaNombre = granjaSeleccionada
      ? granjaSeleccionada.Nombre
      : `ID ${item.GranjaID}`;

    const siloNombre = silos.find(s => s.SiloID === item.SiloPreferenteID)?.Nombre || "-";
    const fechaCorta = item.FechaAsignacion?.split("T")[0] || item.FechaAsignacion;

    return (
      <View style={styles.item}>
        <Text style={styles.itemTitle}>Fecha: {fechaCorta}</Text>
         <Text>Granja: {granjaNombre}</Text>
        <Text>Caseta: {casetaNombre}</Text>
        <Text>Tipo de Alimento: {item.TipoAlimento}</Text>
        <Text>Silo Preferente: {siloNombre}</Text>
        <Text>Notas: {item.Notas || "-"}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ASIGNACIONES</Text>
        <TouchableOpacity onPress={handleAdd} style={{ width: 40, alignItems: "flex-end" }}>
          <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View> */}

      {/* Lista */}
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={displayedAsignaciones}
          keyExtractor={(item) => item.AsignacionID.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          /* ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Image
                source={require("../../assets/Iconos/asignar.png")}
                style={styles.headerImage}
                resizeMode="contain"
              />
            </View>
          } */
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No hay asignaciones registradas.
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
              <Text style={styles.modalTitle}>Nueva Asignación</Text>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Granja (modal) */}
                <Text style={styles.label}>Granja</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={granjaID}
                    onValueChange={(value) => {
                      setGranjaID(value);
                      setSelectedGranjaID(value); // 🔹 carga las casetas del hook filtradas
                      setCasetaID(null);          // 🔹 resetea caseta cuando cambia granja
                    }}
                  >
                    <Picker.Item label="Seleccione una granja" value={null} />
                    {granjas.map((g) => (
                      <Picker.Item key={g.GranjaID} label={g.Nombre} value={g.GranjaID} />
                    ))}
                  </Picker>
                </View>

                {/* Caseta (modal) */}
                <Text style={styles.label}>Caseta</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={casetaID}
                    enabled={!!selectedGranjaID}
                    onValueChange={(value) => setCasetaID(value)}
                  >
                    <Picker.Item label="Seleccione una caseta" value={null} />
                    {casetas
                      .filter((c) => c.GranjaID === selectedGranjaID) // <--- filtro aquí
                      .map((c) => (
                        <Picker.Item key={c.CasetaID} label={c.Nombre} value={c.CasetaID} />
                      ))
                    }
                  </Picker>
                </View>

                {/* Silo Preferente */}
                {/* <Text style={styles.label}>Silo Preferente (opcional)</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={siloID} onValueChange={(value) => setSiloID(value)}>
                    <Picker.Item label="Sin selección" value={null} />
                    {silos.map((s) => (
                      <Picker.Item key={s.SiloID} label={s.Nombre} value={s.SiloID} />
                    ))}
                  </Picker>
                </View> */}
                {/* Silo Preferente */}
                <Text style={styles.label}>Silo Preferente (opcional)</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={siloID} onValueChange={(value) => setSiloID(value)}>
                    <Picker.Item label="Sin selección" value={null} />
                    {silos
                      .filter((s) => s.GranjaID === granjaID && s.Activo) // 🔹 solo activos y de la granja seleccionada
                      .map((s) => (
                        <Picker.Item key={s.SiloID} label={s.Nombre} value={s.SiloID} />
                      ))
                    }
                  </Picker>
                </View>

                {/* <TextInput
                  style={styles.input}
                  placeholder="Tipo de Alimento"
                  value={tipoAlimento}
                  onChangeText={setTipoAlimento}
                /> */}

                {/* Tipo de Alimento */}
                <TextInput
                  style={styles.input}
                  placeholder="Tipo de Alimento"
                  value={tipoAlimento}
                  onChangeText={(text) => {
                    // Verifica si contiene algo inválido
                    if (/[^a-zA-Z\s]/.test(text)) {
                      Alert.alert(
                        "Entrada no válida",
                        "Solo se permiten letras y espacios.",
                        [{ text: "OK" }]
                      );
                      return; // no actualiza el valor
                    }
                    setTipoAlimento(text);
                  }}
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

                {/* Notas */}
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Notas (opcional)"
                  multiline
                  value={notas}
                  onChangeText={setNotas}
                />

                {/* Botones */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, loading && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={loading} // deshabilita mientras carga
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {loading ? "Guardando..." : "Guardar"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#aaa" }]}
                    onPress={() =>
                      Alert.alert(
                        "Confirmar cancelación",
                        "¿Estás seguro que deseas cancelar? Los cambios no guardados se perderán.",
                        [
                          { text: "No", style: "cancel" },
                          { text: "Sí, cancelar", style: "destructive", onPress: () => setModalVisible(false) }
                        ]
                      )
                    }
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

export default AsignacionesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#eaf1f9" },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#2a3a4b", textAlign: "center", flex: 1 },
  backButton: { padding: 6, width: 40, alignItems: "flex-start", justifyContent: "center" },
  item: { backgroundColor: "#fff", padding: 16, marginVertical: 6, borderRadius: 12, elevation: 3 },
  itemTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { width: "90%", backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 10 },
  label: { fontWeight: "bold", marginTop: 8, marginBottom: 4 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10 },
  dateInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  modalButton: { flex: 1, backgroundColor: "#007AFF", padding: 10, marginHorizontal: 5, borderRadius: 8, alignItems: "center" },
  headerContainer: { alignItems: 'center', marginBottom: 10 },
  headerImage: { width: 48, height: 48, marginRight: 10 },
});
