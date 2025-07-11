export type CasetaKey =
  | 'CASETA 1' | 'CASETA 2' | 'CASETA 3' | 'CASETA 4' | 'CASETA 5'
  | 'CASETA 6' | 'CASETA 7' | 'CASETA 8' | 'CASETA 9';

export type ColumnaProduccion =
  | 'BLANCO' | 'ROTO 1' | 'ROTO 2' | 'MANCHADO' | 'FRAGIL 1'
  | 'FRAGIL 2' | 'YEMA' | 'B1' | 'EXTRA 240PZS';

export interface ProduccionData {
  cajas: number;
  restos: number;
}

export interface AlimentoData {
  existenciaInicial: number;
  entrada: number;
  consumo: number;
  tipo: string;
  edad: string;
}

export interface ExistenciaData {
  inicial: number;
  entrada: number;
  mortalidad: number;
  salida: number;
  final: number;
}

export interface EnvaseData {
  tipo: string;
  inicial: number;
  recibido: number;
  consumo: number;
  final: number;
}
