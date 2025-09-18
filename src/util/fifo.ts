// src/utils/fifo.ts
import { Lote } from "../hooks/useLotes";

export function ordenarLotesFIFO(lotes: Lote[]) {
  return [...lotes].sort(
    (a, b) => new Date(a.FechaEntrada).getTime() - new Date(b.FechaEntrada).getTime()
  );
}

/**
 * Consumir FIFO global por tipo de alimento **y granja**
 */
export function consumirFIFOPorGranja(
  lotes: Lote[],
  tipoAlimento: string,
  granjaID: number,
  cantidad: number
): Lote[] {
  const candidatos = lotes.filter(
    l =>
      l.TipoAlimento === tipoAlimento &&
      l.CantidadDisponibleKg > 0 &&
      (l as any).GranjaID === granjaID // ✅ filtro por granja
  );

  const ordenados = ordenarLotesFIFO(candidatos);

  let restante = cantidad;
  for (let lote of ordenados) {
    if (restante <= 0) break;
    if (lote.CantidadDisponibleKg >= restante) {
      lote.CantidadDisponibleKg -= restante;
      restante = 0;
    } else {
      restante -= lote.CantidadDisponibleKg;
      lote.CantidadDisponibleKg = 0;
    }
  }

  if (restante > 0) {
    console.warn(`No hay suficiente stock de ${tipoAlimento} en la granja ${granjaID}`);
  }

  return ordenados;
}

