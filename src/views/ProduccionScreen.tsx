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
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import Icon from "react-native-vector-icons/MaterialIcons"
import { dbManager } from "../database/offline/db"
import { DatabaseQueries } from "../database/offline/queries"
import type { ProduccionData } from "../database/offline/types"

// Constantes
const tiposHuevo = ["BLANCO", "ROTO 1", "ROTO 2", "MANCHADO", "FRAGIL 1", "FRAGIL 2", "YEMA", "B1", "EXTRA 240P25"]
const secciones = Array.from({ length: 10 }, (_, i) => `SECCIÓN ${i + 1}`)
const casetas = Array.from({ length: 9 }, (_, i) => `CASETA ${i + 1}`)

// Tipos locales para el formulario
type RegistroProduccion = {
  [tipo: string]: {
    cajas: string
    restos: string
  }
}

type FormData = {
  [tipo: string]: {
    cajas: string
    restos: string
  }
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

export default function ProduccionScreen() {
  // Estados del formulario
  const [formData, setFormData] = useState<FormData>(() => {
    return tiposHuevo.reduce((acc, tipo) => {
      acc[tipo] = { cajas: "", restos: "" }
      return acc
    }, {} as FormData)
  })

  const [fecha, setFecha] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedSeccion, setSelectedSeccion] = useState(secciones[0])
  const [selectedCaseta, setSelectedCaseta] = useState<string | null>(null)
  const [showModalSeccion, setShowModalSeccion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDbReady, setIsDbReady] = useState(false)

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

  // Cargar datos existentes cuando se selecciona una caseta
  useEffect(() => {
    if (selectedCaseta && isDbReady) {
      loadExistingData()
    }
  }, [selectedCaseta, fecha, isDbReady])

  const formattedDate = useMemo(
    () => fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }),
    [fecha],
  )

  const formattedDateForDB = useMemo(() => fecha.toISOString().split("T")[0], [fecha])

  const loadExistingData = async () => {
    if (!selectedCaseta) return

    try {
      const existingData = await DatabaseQueries.getProduccionByFecha(formattedDateForDB)
      const casetaData = existingData.find((d) => d.caseta === selectedCaseta)

      if (casetaData) {
        // Mapear datos de la DB al formulario
        const mappedData: FormData = {
          BLANCO: { cajas: casetaData.blanco_cajas.toString(), restos: casetaData.blanco_restos.toString() },
          "ROTO 1": { cajas: casetaData.roto1_cajas.toString(), restos: casetaData.roto1_restos.toString() },
          "ROTO 2": { cajas: casetaData.roto2_cajas.toString(), restos: casetaData.roto2_restos.toString() },
          MANCHADO: { cajas: casetaData.manchado_cajas.toString(), restos: casetaData.manchado_restos.toString() },
          "FRAGIL 1": { cajas: casetaData.fragil1_cajas.toString(), restos: casetaData.fragil1_restos.toString() },
          "FRAGIL 2": { cajas: casetaData.fragil2_cajas.toString(), restos: casetaData.fragil2_restos.toString() },
          YEMA: { cajas: casetaData.yema_cajas.toString(), restos: casetaData.yema_restos.toString() },
          B1: { cajas: casetaData.b1_cajas.toString(), restos: casetaData.b1_restos.toString() },
          "EXTRA 240P25": {
            cajas: casetaData.extra240_cajas.toString(),
            restos: casetaData.extra240_restos.toString(),
          },
        }
        setFormData(mappedData)
      } else {
        // Limpiar formulario si no hay datos
        resetForm()
      }
    } catch (error) {
      console.error("Error al cargar datos existentes:", error)
    }
  }

  const resetForm = () => {
    setFormData(
      tiposHuevo.reduce((acc, tipo) => {
        acc[tipo] = { cajas: "", restos: "" }
        return acc
      }, {} as FormData),
    )
  }

  const handleDateChange = useCallback((_: any, date?: Date) => {
    setShowDatePicker(false)
    if (date) setFecha(date)
  }, [])

  const handleChange = useCallback((tipo: string, campo: "cajas" | "restos", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [campo]: value,
      },
    }))
  }, [])

  const handleSave = async () => {
    if (!selectedCaseta || !isDbReady) {
      Alert.alert("Error", "Selecciona una caseta primero")
      return
    }

    setLoading(true)
    try {
      // Convertir datos del formulario al formato de la DB
      const produccionData: ProduccionData = {
        caseta: selectedCaseta,
        fecha: formattedDateForDB,
        blanco_cajas: Number.parseInt(formData["BLANCO"].cajas) || 0,
        blanco_restos: Number.parseInt(formData["BLANCO"].restos) || 0,
        roto1_cajas: Number.parseInt(formData["ROTO 1"].cajas) || 0,
        roto1_restos: Number.parseInt(formData["ROTO 1"].restos) || 0,
        roto2_cajas: Number.parseInt(formData["ROTO 2"].cajas) || 0,
        roto2_restos: Number.parseInt(formData["ROTO 2"].restos) || 0,
        manchado_cajas: Number.parseInt(formData["MANCHADO"].cajas) || 0,
        manchado_restos: Number.parseInt(formData["MANCHADO"].restos) || 0,
        fragil1_cajas: Number.parseInt(formData["FRAGIL 1"].cajas) || 0,
        fragil1_restos: Number.parseInt(formData["FRAGIL 1"].restos) || 0,
        fragil2_cajas: Number.parseInt(formData["FRAGIL 2"].cajas) || 0,
        fragil2_restos: Number.parseInt(formData["FRAGIL 2"].restos) || 0,
        yema_cajas: Number.parseInt(formData["YEMA"].cajas) || 0,
        yema_restos: Number.parseInt(formData["YEMA"].restos) || 0,
        b1_cajas: Number.parseInt(formData["B1"].cajas) || 0,
        b1_restos: Number.parseInt(formData["B1"].restos) || 0,
        extra240_cajas: Number.parseInt(formData["EXTRA 240P25"].cajas) || 0,
        extra240_restos: Number.parseInt(formData["EXTRA 240P25"].restos) || 0,
      }

      await DatabaseQueries.insertProduccion(produccionData)

      Alert.alert("Éxito", `Datos de producción guardados para ${selectedCaseta} - ${formattedDate}`, [
        {
          text: "OK",
          onPress: () => {
            setSelectedCaseta(null)
            resetForm()
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.content}>
        {!selectedCaseta ? (
          <ScrollView contentContainerStyle={styles.casetaList}>
            <Text style={styles.instructionText}>
              Selecciona una caseta para registrar la producción del {formattedDate}
            </Text>
            {casetas.map((caseta) => (
              <TouchableOpacity
                key={caseta}
                style={styles.casetaCard}
                onPress={() => setSelectedCaseta(caseta)}
                disabled={!isDbReady}
              >
                <Icon name="home" size={24} color="#517aa2" />
                <Text style={styles.casetaText}>{caseta}</Text>
                <Icon name="chevron-right" size={20} color="#517aa2" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formTitle}>
              REGISTRO - {selectedSeccion} / {selectedCaseta}
            </Text>
            <Text style={styles.formSubtitle}>Fecha: {formattedDate}</Text>

            {tiposHuevo.map((tipo) => (
              <Card key={tipo}>
                <Text style={styles.cardTitle}>{tipo}</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <CustomInput
                      label="Cajas"
                      value={formData[tipo].cajas}
                      onChangeText={(text) => handleChange(tipo, "cajas", text)}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <CustomInput
                      label="Restos"
                      value={formData[tipo].restos}
                      onChangeText={(text) => handleChange(tipo, "restos", text)}
                    />
                  </View>
                </View>
              </Card>
            ))}

            <View style={styles.buttonRow}>
              <Button
                title={loading ? "GUARDANDO..." : "GUARDAR"}
                onPress={handleSave}
                icon="save"
                disabled={loading || !isDbReady}
              />
              <Button title="CANCELAR" onPress={handleCancel} icon="close" disabled={loading} />
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
  container: {
    flex: 1,
    backgroundColor: "#eaf1f9",
  },
  header: {
    backgroundColor: "#749BC2",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },
  seccionSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  seccionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 6,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5f85a2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateText: {
    color: "#fff",
    fontSize: 14,
    marginRight: 6,
  },
  content: {
    flex: 1,
  },
  casetaList: {
    padding: 16,
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  casetaText: {
    fontSize: 16,
    color: "#517aa2",
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    color: "#517aa2",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#749BC2",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
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
    color: "#64748b",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#517aa2",
  },
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
