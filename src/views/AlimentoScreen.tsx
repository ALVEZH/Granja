"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { Picker } from "@react-native-picker/picker"
import DateTimePicker from "@react-native-community/datetimepicker"
import { dbManager } from "../database/offline/db"
import { DatabaseQueries } from "../database/offline/queries"
import type { AlimentoData } from "../database/offline/types"

const tiposAlimento = ["Pollinaza", "Concentrado", "Maíz"]
const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`)
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`)

type FormData = {
  tipo: string
  existenciaInicial: string
  entrada: string
  consumo: string
  edad: string
}

export default function AlimentoScreen() {
  const [formData, setFormData] = useState<FormData>({
    tipo: "",
    existenciaInicial: "",
    entrada: "",
    consumo: "",
    edad: "",
  })

  const [fecha, setFecha] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedSeccion, setSelectedSeccion] = useState(secciones[0])
  const [selectedCaseta, setSelectedCaseta] = useState<string | null>(null)
  const [showModalSeccion, setShowModalSeccion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDbReady, setIsDbReady] = useState(false)
  const [alimentoDataList, setAlimentoDataList] = useState<AlimentoData[]>([])

  const formattedDate = useMemo(
    () => fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }),
    [fecha],
  )

  const formattedDateForDB = useMemo(() => fecha.toISOString().split("T")[0], [fecha])

  // Inicializar base de datos
  useEffect(() => {
    const initDB = async () => {
      try {
        await dbManager.init()
        setIsDbReady(true)
      } catch (error) {
        console.error("Error al inicializar DB:", error)
        Alert.alert("Error", "No se pudo inicializar la base de datos")
      }
    }
    initDB()
  }, [])

  // Cargar datos cuando cambia la fecha
  useEffect(() => {
    if (isDbReady) {
      loadDataByFecha()
    }
  }, [fecha, isDbReady])

  // Cargar datos existentes cuando se selecciona una caseta
  useEffect(() => {
    if (selectedCaseta && isDbReady) {
      loadExistingData()
    }
  }, [selectedCaseta, alimentoDataList])

  const loadDataByFecha = async () => {
    try {
      const data = await DatabaseQueries.getAlimentoByFecha(formattedDateForDB)
      setAlimentoDataList(data)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  const loadExistingData = () => {
    if (!selectedCaseta) return

    const casetaData = alimentoDataList.find((d) => d.caseta === selectedCaseta)

    if (casetaData) {
      setFormData({
        tipo: casetaData.tipo,
        existenciaInicial: casetaData.existencia_inicial.toString(),
        entrada: casetaData.entrada.toString(),
        consumo: casetaData.consumo.toString(),
        edad: casetaData.edad,
      })
    } else {
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: "",
      existenciaInicial: "",
      entrada: "",
      consumo: "",
      edad: "",
    })
  }

  const handleDateChange = useCallback((_: any, date?: Date) => {
    setShowDatePicker(false)
    if (date) setFecha(date)
  }, [])

  const handleChange = (campo: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: value,
    }))
  }

  const handleSave = async () => {
    if (!selectedCaseta || !isDbReady) {
      Alert.alert("Error", "Selecciona una caseta primero")
      return
    }

    setLoading(true)
    try {
      const alimentoData: AlimentoData = {
        caseta: selectedCaseta,
        fecha: formattedDateForDB,
        existencia_inicial: Number.parseFloat(formData.existenciaInicial) || 0,
        entrada: Number.parseFloat(formData.entrada) || 0,
        consumo: Number.parseFloat(formData.consumo) || 0,
        tipo: formData.tipo,
        edad: formData.edad,
      }

      await DatabaseQueries.insertAlimento(alimentoData)

      Alert.alert("Éxito", `Datos de alimento guardados para ${selectedCaseta} - ${formattedDate}`, [
        {
          text: "OK",
          onPress: () => {
            setSelectedCaseta(null)
            resetForm()
            loadDataByFecha() // Recargar datos
          },
        },
      ])
    } catch (error) {
      console.error("Error al guardar:", error)
      Alert.alert("Error", "No se pudieron guardar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    Alert.alert("Cancelar", "¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.", [
      { text: "No", style: "cancel" },
      {
        text: "Sí",
        onPress: () => {
          setSelectedCaseta(null)
          resetForm()
        },
      },
    ])
  }

  const progresoCasetas = useMemo(() => {
    const completadas = alimentoDataList.length
    const total = casetas.length
    return completadas / total
  }, [alimentoDataList])

  if (!isDbReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#749BC2" />
          <Text style={styles.loadingText}>Inicializando base de datos...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.seccionSelector} onPress={() => setShowModalSeccion(true)}>
          <Text style={styles.seccionText}>{selectedSeccion}</Text>
          <Icon name="arrow-drop-down" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelector}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Icon name="event" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progreso */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>
          Progreso de Casetas ({alimentoDataList.length}/{casetas.length})
        </Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progresoCasetas * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progresoCasetas * 100)}%</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {!selectedCaseta ? (
          <ScrollView contentContainerStyle={styles.casetaList}>
            <Text style={styles.instructionText}>
              Selecciona una caseta para registrar alimento del {formattedDate}
            </Text>
            {casetas.map((caseta) => {
              const hasData = alimentoDataList.some((d) => d.caseta === caseta)
              return (
                <TouchableOpacity
                  key={caseta}
                  style={[styles.casetaCard, hasData && styles.casetaCardCompleted]}
                  onPress={() => setSelectedCaseta(caseta)}
                >
                  <Icon name="home" size={24} color="#517aa2" />
                  <Text style={styles.casetaText}>{caseta}</Text>
                  {hasData && <Icon name="check-circle" size={20} color="#4ade80" />}
                  <Icon name="chevron-right" size={20} color="#517aa2" />
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        ) : (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formTitle}>
              ALIMENTO - {selectedSeccion} / {selectedCaseta}
            </Text>
            <Text style={styles.formSubtitle}>Fecha: {formattedDate}</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Tipo de Alimento</Text>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={formData.tipo} onValueChange={(value) => handleChange("tipo", value)}>
                  <Picker.Item label="Selecciona tipo" value="" />
                  {tiposAlimento.map((tipo) => (
                    <Picker.Item key={tipo} label={tipo} value={tipo} />
                  ))}
                </Picker>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Existencia inicial"
                keyboardType="numeric"
                value={formData.existenciaInicial}
                onChangeText={(text) => handleChange("existenciaInicial", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Entrada"
                keyboardType="numeric"
                value={formData.entrada}
                onChangeText={(text) => handleChange("entrada", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Consumo"
                keyboardType="numeric"
                value={formData.consumo}
                onChangeText={(text) => handleChange("consumo", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Edad (semanas)"
                value={formData.edad}
                onChangeText={(text) => handleChange("edad", text)}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.buttonText}>{loading ? "Guardando..." : "Guardar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#e74c3c" }, loading && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Icon name="close" size={20} color="#fff" />
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
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
              {secciones.map((seccion) => (
                <TouchableOpacity
                  key={seccion}
                  onPress={() => {
                    setSelectedSeccion(seccion)
                    setShowModalSeccion(false)
                  }}
                  style={[styles.modalItem, selectedSeccion === seccion && styles.modalItemSelected]}
                >
                  <Text style={[styles.modalItemText, selectedSeccion === seccion && styles.modalItemTextSelected]}>
                    {seccion}
                  </Text>
                  {selectedSeccion === seccion && <Icon name="check" size={20} color="#749BC2" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowModalSeccion(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDatePicker && <DateTimePicker value={fecha} mode="date" display="default" onChange={handleDateChange} />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eaf1f9" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#749BC2",
  },
  header: {
    backgroundColor: "#749BC2",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },
  seccionSelector: { flexDirection: "row", alignItems: "center" },
  seccionText: { color: "#fff", fontSize: 18, fontWeight: "bold", marginRight: 6 },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5f85a2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateText: { color: "#fff", fontSize: 14, marginRight: 6 },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#eaf1f9",
  },
  progressLabel: { fontSize: 14, color: "#333", marginBottom: 4 },
  progressBarBackground: {
    height: 10,
    borderRadius: 10,
    backgroundColor: "#cbd5e1",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    backgroundColor: "#749BC2",
  },
  progressText: { fontSize: 12, color: "#555", textAlign: "right", marginTop: 4 },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    color: "#517aa2",
    marginBottom: 20,
    fontWeight: "500",
  },
  casetaList: { padding: 16 },
  casetaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
  },
  casetaCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: "#4ade80",
  },
  casetaText: { fontSize: 16, color: "#517aa2", fontWeight: "600", flex: 1, marginLeft: 12 },
  formContainer: { padding: 16 },
  formTitle: { fontSize: 18, textAlign: "center", fontWeight: "bold", color: "#517aa2", marginBottom: 8 },
  formSubtitle: { fontSize: 14, textAlign: "center", color: "#64748b", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
    fontSize: 16,
  },
  label: {
    marginBottom: 4,
    fontSize: 14,
    color: "#555",
    marginTop: 8,
    fontWeight: "500",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#749BC2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, textAlign: "center", color: "#517aa2" },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemSelected: {
    backgroundColor: "#f1f5f9",
  },
  modalItemText: {
    fontSize: 16,
    color: "#334155",
  },
  modalItemTextSelected: {
    color: "#749BC2",
    fontWeight: "600",
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#749BC2",
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
})
