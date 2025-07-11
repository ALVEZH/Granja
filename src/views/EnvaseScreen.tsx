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
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import Icon from "react-native-vector-icons/MaterialIcons"
import { dbManager } from "../database/offline/db"
import { DatabaseQueries } from "../database/offline/queries"
import type { EnvaseData } from "../database/offline/types"

// Constantes
const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`)
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`)

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
]

type FormData = {
  tipo: string
  existenciaInicial: string
  recibido: string
  consumo: string
  existenciaFinal: string
}

// Input personalizado
const CustomInput = ({
  label,
  value,
  onChangeText,
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
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
)

// Tarjeta reutilizable
const Card = ({ children }: { children: React.ReactNode }) => <View style={styles.card}>{children}</View>

// Botón reutilizable
const Button = ({
  title,
  onPress,
  icon,
  disabled = false,
}: {
  title: string
  onPress: () => void
  icon?: string
  disabled?: boolean
}) => (
  <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
    {icon && <Icon name={icon} size={20} color="#fff" style={{ marginRight: 8 }} />}
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
)

export default function EnvaseScreen() {
  const [formData, setFormData] = useState<FormData>({
    tipo: "",
    existenciaInicial: "",
    recibido: "",
    consumo: "",
    existenciaFinal: "",
  })

  const [selectedSeccion, setSelectedSeccion] = useState(secciones[0])
  const [selectedCaseta, setSelectedCaseta] = useState<string | null>(null)
  const [fecha, setFecha] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showModalSeccion, setShowModalSeccion] = useState(false)
  const [showModalEnvase, setShowModalEnvase] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDbReady, setIsDbReady] = useState(false)
  const [envaseDataList, setEnvaseDataList] = useState<EnvaseData[]>([])

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
  }, [selectedCaseta, envaseDataList])

  const loadDataByFecha = async () => {
    try {
      const data = await DatabaseQueries.getEnvaseByFecha(formattedDateForDB)
      setEnvaseDataList(data)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  const loadExistingData = () => {
    if (!selectedCaseta) return

    const casetaData = envaseDataList.find((d) => d.caseta === selectedCaseta)

    if (casetaData) {
      setFormData({
        tipo: casetaData.tipo,
        existenciaInicial: casetaData.inicial.toString(),
        recibido: casetaData.recibido.toString(),
        consumo: casetaData.consumo.toString(),
        existenciaFinal: casetaData.final.toString(),
      })
    } else {
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: "",
      existenciaInicial: "",
      recibido: "",
      consumo: "",
      existenciaFinal: "",
    })
  }

  const handleDateChange = useCallback((_: any, date?: Date) => {
    setShowDatePicker(false)
    if (date) setFecha(date)
  }, [])

  const handleChange = useCallback((campo: keyof FormData, valor: string) => {
    setFormData((prev) => {
      const nuevoRegistro = {
        ...prev,
        [campo]: valor,
      }

      // Calcular existencia final automáticamente
      if (campo !== "existenciaFinal") {
        const inicial = Number.parseFloat(nuevoRegistro.existenciaInicial) || 0
        const recibido = Number.parseFloat(nuevoRegistro.recibido) || 0
        const consumo = Number.parseFloat(nuevoRegistro.consumo) || 0
        nuevoRegistro.existenciaFinal = (inicial + recibido - consumo).toString()
      }

      return nuevoRegistro
    })
  }, [])

  const handleSave = async () => {
    if (!selectedCaseta || !isDbReady) {
      Alert.alert("Error", "Selecciona una caseta primero")
      return
    }

    if (!formData.tipo) {
      Alert.alert("Error", "Selecciona un tipo de envase")
      return
    }

    setLoading(true)
    try {
      const envaseData: EnvaseData = {
        caseta: selectedCaseta,
        fecha: formattedDateForDB,
        tipo: formData.tipo,
        inicial: Number.parseFloat(formData.existenciaInicial) || 0,
        recibido: Number.parseFloat(formData.recibido) || 0,
        consumo: Number.parseFloat(formData.consumo) || 0,
        final: Number.parseFloat(formData.existenciaFinal) || 0,
      }

      await DatabaseQueries.insertEnvase(envaseData)

      Alert.alert("Éxito", `Datos de envase guardados para ${selectedCaseta} - ${formattedDate}`, [
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
    const completadas = envaseDataList.length
    const total = casetas.length
    return completadas / total
  }, [envaseDataList])

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

      {/* Progreso */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>
          Progreso de Casetas ({envaseDataList.length}/{casetas.length})
        </Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progresoCasetas * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progresoCasetas * 100)}%</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.content}>
        {!selectedCaseta ? (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.instructionText}>Selecciona una caseta para registrar envases del {formattedDate}</Text>
            {casetas.map((caseta) => {
              const hasData = envaseDataList.some((d) => d.caseta === caseta)
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
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.formTitle}>
              ENVASE - {selectedSeccion} / {selectedCaseta}
            </Text>
            <Text style={styles.formSubtitle}>Fecha: {formattedDate}</Text>

            <Card>
              <Text style={styles.cardTitle}>Registro de Envase</Text>

              {/* Selector de tipo de envase */}
              <TouchableOpacity style={styles.envaseSelector} onPress={() => setShowModalEnvase(true)}>
                <Text style={[styles.envaseText, !formData.tipo && styles.placeholderText]}>
                  {formData.tipo || "Seleccionar tipo de envase"}
                </Text>
                <Icon name="arrow-drop-down" size={24} color="#749BC2" />
              </TouchableOpacity>

              <CustomInput
                label="Existencia Inicial"
                value={formData.existenciaInicial}
                onChangeText={(text) => handleChange("existenciaInicial", text)}
              />

              <CustomInput
                label="Recibido"
                value={formData.recibido}
                onChangeText={(text) => handleChange("recibido", text)}
              />

              <CustomInput
                label="Consumo"
                value={formData.consumo}
                onChangeText={(text) => handleChange("consumo", text)}
              />

              <View style={styles.existenciaFinalContainer}>
                <Text style={styles.existenciaFinalLabel}>Existencia Final:</Text>
                <Text style={styles.existenciaFinalValue}>{formData.existenciaFinal}</Text>
              </View>
            </Card>

            <View style={styles.buttonRow}>
              <Button
                title={loading ? "GUARDANDO..." : "GUARDAR"}
                onPress={handleSave}
                icon="save"
                disabled={loading}
              />
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
                    setSelectedSeccion(sec)
                    setShowModalSeccion(false)
                  }}
                  style={[styles.modalItem, selectedSeccion === sec && styles.modalItemSelected]}
                >
                  <Text style={[styles.modalItemText, selectedSeccion === sec && styles.modalItemTextSelected]}>
                    {sec}
                  </Text>
                  {selectedSeccion === sec && <Icon name="check" size={20} color="#749BC2" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowModalSeccion(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal selección tipo de envase */}
      <Modal visible={showModalEnvase} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tipo de envase</Text>
            <ScrollView>
              {envases.map((envase) => (
                <TouchableOpacity
                  key={envase}
                  onPress={() => {
                    handleChange("tipo", envase)
                    setShowModalEnvase(false)
                  }}
                  style={[styles.modalItem, formData.tipo === envase && styles.modalItemSelected]}
                >
                  <Text style={[styles.modalItemText, formData.tipo === envase && styles.modalItemTextSelected]}>
                    {envase}
                  </Text>
                  {formData.tipo === envase && <Icon name="check" size={20} color="#749BC2" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowModalEnvase(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
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
  content: { flex: 1 },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    color: "#517aa2",
    marginBottom: 20,
    fontWeight: "500",
  },
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
  formTitle: { fontSize: 18, textAlign: "center", fontWeight: "bold", color: "#517aa2", marginBottom: 8 },
  formSubtitle: { fontSize: 14, textAlign: "center", color: "#64748b", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#749BC2",
    textAlign: "center",
  },
  envaseSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#749BC2",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  envaseText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#94a3b8",
  },
  inputContainer: { position: "relative", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#749BC2",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
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
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
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
