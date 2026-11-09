export type Repeticion = 'NINGUNA' | 'MENSUAL' | 'ANUAL';

export const REPETICIONES: { valor: Repeticion; nombre: string }[] = [
  { valor: 'NINGUNA', nombre: 'Una vez' },
  { valor: 'MENSUAL', nombre: 'Cada mes' },
  { valor: 'ANUAL', nombre: 'Cada año' },
];

export interface Recordatorio {
  id: number;
  titulo: string;
  /** Primera vez ("2026-11-20"); si se repite, el mismo día de cada mes o año. */
  fecha: string;
  nota: string | null;
  repeticion: Repeticion;
}

export type RecordatorioRegistro = Omit<Recordatorio, 'id'>;
