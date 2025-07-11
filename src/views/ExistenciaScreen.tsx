"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { dbManager } from "../database/offline/db"
import { DatabaseQueries } from "../database/offline/queries"
import type { ExistenciaData } from "../database/offline/types"

// Constantes
const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`)
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`)

// Tipos
type FormData = {
  existenciaInicial: string
  entradaAves: string
  mortalidadAves: string
  salidaAves: string
  existenciaFinal: string // Calculado
}

export default function ExistenciaScreen() {
  // Estado principal
  const [formData, setFormData] = useState<FormData>({
    existenciaInicial: "",
    entradaAves: "",
    mortalidadAves: "",
    salidaAves: "",
    existenciaFinal: "",
  })

  const [fecha, setFecha] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedSeccion, setSelectedSeccion] = useState<string>(secciones[0])
  const [selectedCaseta, setSelectedCaseta] = useState<string | null>(null)
  const [showModalSeccion, setShowModalSeccion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDbReady, setIsDbReady] = useState(false)
  const [existenciaDataList, setExistenciaDataList] = useState<ExistenciaData[]>([])

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
  }, [selectedCaseta, existenciaDataList])

  const loadDataByFecha = async () => {
    try {
      const data = await DatabaseQueries.getExistenciaByFecha(formattedDateForDB)
      setExistenciaDataList(data)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  const loadExistingData = () => {
    if (!selectedCaseta) return

    const casetaData = existenciaDataList.find((d) => d.caseta === selectedCaseta)

    if (casetaData) {
      setFormData({
        existenciaInicial: casetaData.inicial.toString(),
        entradaAves: casetaData.entrada.toString(),
        mortalidadAves: casetaData.mortalidad.toString(),
        salidaAves: casetaData.salida.toString(),
        existenciaFinal: casetaData.final.toString(),
      })
    } else {
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      existenciaInicial: "",
      entradaAves: "",
      mortalidadAves: "",
      salidaAves: "",
      existenciaFinal: "",
    })
  }

  const handleDateChange = useCallback((_: any, date?: Date) => {
    setShowDatePicker(false)
    if (date) setFecha(date)
  }, [])

  // Actualiza los campos y calcula existencia final
  const handleChange = useCallback((campo: keyof Omit<FormData, "existenciaFinal">, valor: string) => {
    setFormData((prev) => {
      const nuevoRegistro = {
        ...prev,
        [campo]: valor,
      }

      // Calcular existencia final
      const inicial = Number(nuevoRegistro.existenciaInicial) || 0
      const entrada = Number(nuevoRegistro.entradaAves) || 0
      const mortalidad = Number(nuevoRegistro.mortalidadAves) || 0
      const salida = Number(nuevoRegistro.salidaAves) || 0

      nuevoRegistro.existenciaFinal = String(inicial + entrada - mortalidad - salida)

      return nuevoRegistro
    })
  }, [])

  const handleSave = async () => {
    if (!selectedCaseta || !isDbReady) {
      Alert.alert("Error", "Selecciona una caseta primero")
      return
    }

    setLoading(true)
    try {
      const existenciaData: ExistenciaData = {
        caseta: selectedCaseta,
        fecha: formattedDateForDB,
        inicial: Number.parseInt(formData.existenciaInicial) || 0,
        entrada: Number.parseInt(formData.entradaAves) || 0,
        mortalidad: Number.parseInt(formData.mortalidadAves) || 0,
        salida: Number.parseInt(formData.salidaAves) || 0,
        final: Number.parseInt(formData.existenciaFinal) || 0,
      }

      await DatabaseQueries.insertExistencia(existenciaData)

      Alert.alert("Éxito", `Datos de existencia guardados para ${selectedCaseta} - ${formattedDate}`, [
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
    const completadas = existenciaDataList.length
    const total = casetas.length
    return completadas / total
  }, [existenciaDataList])

  // Reutilizable input con label flotante
  const CustomInput = ({
    label,
    value,
    onChangeText,
    editable = true,
  }: {
    label: string
    value: string
    onChangeText: (text: string) => void
    editable?: boolean
  }) => (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#94a3b8"
        editable={editable}
      />
      {value ? <Text style={styles.floatingLabel}>{label}</Text> : null}
    </View>
  )

  // Card para contener inputs
  const Card = ({ children }: { children: React.ReactNode }) => <View style={styles.card}>{children}</View>

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
          Progreso de Casetas ({existenciaDataList.length}/{casetas.length})
        </Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progresoCasetas * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progresoCasetas * 100)}%</Text>
      </View>

      {/* Contenido */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        {!selectedCaseta ? (
          <ScrollView contentContainerStyle={styles.casetaListContainer}>
            <Text style={styles.instructionText}>
              Selecciona una caseta para registrar existencia del {formattedDate}
            </Text>
            {casetas.map((caseta) => {
              const hasData = existenciaDataList.some((d) => d.caseta === caseta)
              return (
                <TouchableOpacity
                  key={caseta}
                  style={[styles.casetaCard, hasData && styles.casetaCardCompleted]}
                  onPress={() => setSelectedCaseta(caseta)}
                >
                  <Icon name="home" size={24} color="#749BC2" style={{ marginRight: 8 }} />
                  <Text style={styles.casetaText}>{caseta}</Text>
                  {hasData && <Icon name="check-circle" size={20} color="#4ade80" />}
                  <Icon name="chevron-right" size={20} color="#749BC2" />
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        ) : (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formTitle}>
              REGISTRO DE EXISTENCIA - {selectedSeccion} - {selectedCaseta}
            </Text>
            <Text style={styles.formSubtitle}>Fecha: {formattedDate}</Text>

            <Card>
              <CustomInput
                label="Existencia Inicial"
                value={formData.existenciaInicial}
                onChangeText={(text) => handleChange("existenciaInicial", text)}
              />
              <CustomInput
                label="Entrada Aves"
                value={formData.entradaAves}
                onChangeText={(text) => handleChange("entradaAves", text)}
              />
              <CustomInput
                label="Mortalidad Aves"
                value={formData.mortalidadAves}
                onChangeText={(text) => handleChange("mortalidadAves", text)}
              />
              <CustomInput
                label="Salida Aves"
                value={formData.salidaAves}
                onChangeText={(text) => handleChange("salidaAves", text)}
              />
              <View style={styles.existenciaFinalContainer}>
                <Text style={styles.existenciaFinalLabel}>Existencia Final:</Text>
                <Text style={styles.existenciaFinalValue}>{formData.existenciaFinal}</Text>
              </View>
            </Card>

            {/* Botones */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#749BC2" }, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Icon name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>{loading ? "GUARDANDO..." : "GUARDAR"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#e74c3c" }, loading && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Icon name="close" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modal para selección de sección */}
      <Modal
        visible={showModalSeccion}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModalSeccion(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Sección</Text>
            <ScrollView>
              {secciones.map((seccion) => (
                <TouchableOpacity
                  key={seccion}
                  style={[styles.modalSectionItem, selectedSeccion === seccion && styles.modalSectionItemSelected]}
                  onPress={() => {
                    setSelectedSeccion(seccion)
                    setShowModalSeccion(false)
                    setSelectedCaseta(null) // Resetea caseta al cambiar sección
                  }}
                >
                  <Text
                    style={[styles.modalSectionText, selectedSeccion === seccion && styles.modalSectionTextSelected]}
                  >
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#749BC2",
  },
  seccionSelector: { flexDirection: "row", alignItems: "center" },
  seccionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
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
  content: { flex: 1 },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    color: "#517aa2",
    marginBottom: 20,
    fontWeight: "500",
  },
  // Lista casetas
  casetaListContainer: { padding: 16 },
  casetaCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },
  casetaCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: "#4ade80",
  },
  casetaText: { fontSize: 16, fontWeight: "600", color: "#749BC2", flex: 1, marginLeft: 8 },
  // Formulario
  formContainer: { flex: 1, padding: 16 },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#749BC2",
    textAlign: "center",
  },
  formSubtitle: { fontSize: 14, textAlign: "center", color: "#64748b", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 4,
  },
  inputContainer: { position: "relative", marginBottom: 16 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#749BC2",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#333",
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: "#f8f9fa",
    color: "#6c757d",
  },
  floatingLabel: {
    position: "absolute",
    top: -10,
    left: 12,
    fontSize: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 4,
    color: "#749BC2",
    fontWeight: "bold",
  },
  existenciaFinalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: 8,
  },
  existenciaFinalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  existenciaFinalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#749BC2",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#517aa2",
  },
  modalSectionItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalSectionItemSelected: {
    backgroundColor: "#f1f5f9",
  },
  modalSectionText: {
    fontSize: 16,
    color: "#334155",
  },
  modalSectionTextSelected: {
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
