// Tipos para la base de datos
export interface ProduccionData {
  id?: number
  caseta: string
  fecha: string
  granja_id: number
  blanco_cajas: number
  blanco_restos: number
  roto1_cajas: number
  roto1_restos: number
  roto2_cajas: number
  roto2_restos: number
  manchado_cajas: number
  manchado_restos: number
  fragil1_cajas: number
  fragil1_restos: number
  fragil2_cajas: number
  fragil2_restos: number
  yema_cajas: number
  yema_restos: number
  b1_cajas: number
  b1_restos: number
  extra240_cajas: number
  extra240_restos: number
  created_at?: string
}

export interface AlimentoData {
  id?: number
  caseta: string
  fecha: string
  granja_id: number
  existencia_inicial: number
  entrada: number
  consumo: number
  tipo: string
  edad: string
  created_at?: string
}

export interface ExistenciaData {
  id?: number
  caseta: string
  fecha: string
  granja_id: number
  inicial: number
  entrada: number
  mortalidad: number
  salida: number
  edad: number
  final: number
  created_at?: string
}

export interface EnvaseData {
  id?: number
  caseta: string
  fecha: string
  granja_id: number
  tipo: string
  inicial: number
  recibido: number
  consumo: number
  final: number
  created_at?: string
}

export type CasetaKey =
  | "CASETA 1"
  | "CASETA 2"
  | "CASETA 3"
  | "CASETA 4"
  | "CASETA 5"
  | "CASETA 6"
  | "CASETA 7"
  | "CASETA 8"
  | "CASETA 9"
export type ColumnaProduccion =
  | "BLANCO"
  | "ROTO 1"
  | "ROTO 2"
  | "MANCHADO"
  | "FRAGIL 1"
  | "FRAGIL 2"
  | "YEMA"
  | "B1"
  | "EXTRA 240PZS"
