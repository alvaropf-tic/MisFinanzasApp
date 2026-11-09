import { Component, Input, type OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonFooter,
  IonIcon,
  IonInput,
  IonModal,
  IonSpinner,
  IonToggle,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  cardOutline,
  cashOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  flagOutline,
  pauseOutline,
  phonePortraitOutline,
  playOutline,
  repeatOutline,
  swapHorizontalOutline,
  trashOutline,
  trendingDownOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import type { Observable } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import type { Categoria } from '../../models/categoria.model';
import { METODOS_PAGO, type MetodoPago } from '../../models/gasto.model';
import { METODOS_INGRESO, type MetodoIngreso } from '../../models/ingreso.model';
import { ICONOS_METODO } from '../../models/movimiento.model';
import {
  PERIODICIDADES,
  type Periodicidad,
  type Recurrente,
  type RecurrenteDatos,
  type TipoRecurrente,
} from '../../models/recurrente.model';
import { CategoriaIngresoService } from '../../services/categoria-ingreso.service';
import { CategoriaService } from '../../services/categoria.service';
import { RecurrenteService } from '../../services/recurrente.service';
import { pedirNombreCategoria } from '../../shared/pedir-nombre-categoria';
import { monedaActual, simboloMoneda } from '../../core/moneda';

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: monedaActual() });

/** Fecha local sin hora en el formato del backend: "2026-11-03". */
function fechaLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** Roles con los que se cierra la hoja: 'guardado', 'pausado', 'reactivado' o 'eliminado'. */
export type ResultadoRecurrente = 'guardado' | 'pausado' | 'reactivado' | 'eliminado';

/** Cómo se cerró la hoja y de qué tipo era (en una nueva se puede cambiar de pago a cobro). */
export interface CierreRecurrente {
  resultado: ResultadoRecurrente;
  tipo: TipoRecurrente;
}

/** "Pago recurrente" / "Cobro recurrente" */
export const NOMBRES_RECURRENTE: Record<TipoRecurrente, string> = {
  gasto: 'Pago recurrente',
  ingreso: 'Cobro recurrente',
};

/** Mensaje de confirmación: "Cobro recurrente guardado". */
export function mensajeRecurrente({ tipo, resultado }: CierreRecurrente): string {
  return `${NOMBRES_RECURRENTE[tipo]} ${resultado}`;
}

/** Textos que cambian entre pago y cobro. */
const TEXTOS: Record<
  TipoRecurrente,
  { nombre: string; ejemploNombre: string; ejemploCategoria: string; movimiento: string; metodo: string }
> = {
  gasto: {
    nombre: 'pago recurrente',
    ejemploNombre: 'Netflix, alquiler, gimnasio…',
    ejemploCategoria: 'Suscripciones',
    movimiento: 'gasto',
    metodo: 'Método de pago',
  },
  ingreso: {
    nombre: 'cobro recurrente',
    ejemploNombre: 'Nómina, alquiler cobrado, pensión…',
    ejemploCategoria: 'Nómina',
    movimiento: 'ingreso',
    metodo: 'Método de cobro',
  },
};

/**
 * Abre la hoja y devuelve cómo se cerró, o `null` si se canceló. Sin `recurrente` es una nueva de tipo `tipo`
 * (en ella se puede cambiar entre pago y cobro); `fechaInicial` ("2026-11-20") propone el primer cobro.
 */
export async function abrirFormularioRecurrente(
  modalController: ModalController,
  tipo: TipoRecurrente = 'gasto',
  recurrente: Recurrente | null = null,
  fechaInicial: string | null = null,
): Promise<CierreRecurrente | null> {
  const modal = await modalController.create({
    component: RecurrenteFormComponent,
    componentProps: { tipoInicial: recurrente?.tipo ?? tipo, recurrente, fechaInicial },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { data, role } = await modal.onWillDismiss<TipoRecurrente>();
  return ['guardado', 'pausado', 'reactivado', 'eliminado'].includes(role ?? '') && data
    ? { resultado: role as ResultadoRecurrente, tipo: data }
    : null;
}

/**
 * Hoja de alta y edición de un pago recurrente (suscripción, alquiler…: genera gastos, acento rojo) o de un
 * cobro recurrente (nómina…: genera ingresos, acento verde). Si el próximo cobro es hoy o anterior, el backend
 * apunta ya el movimiento. En edición permite pausar, reactivar y eliminar.
 */
@Component({
  selector: 'app-recurrente-form',
  templateUrl: 'recurrente-form.component.html',
  styleUrls: ['recurrente-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonFooter,
    IonButton,
    IonInput,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonIcon,
    IonSpinner,
    IonToggle,
  ],
  host: { '[class.hoja--ingreso]': "tipo() === 'ingreso'" },
})
export class RecurrenteFormComponent implements OnInit {
  /** Símbolo de la moneda elegida para el campo de importe. */
  readonly simboloMoneda = simboloMoneda();

  private readonly recurrenteService = inject(RecurrenteService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly categoriaIngresoService = inject(CategoriaIngresoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  // `componentProps` del modal asigna la propiedad directamente: con un input() de señal la sustituiría
  @Input() tipoInicial: TipoRecurrente = 'gasto';
  @Input() recurrente: Recurrente | null = null;
  /** Primer cobro propuesto para uno nuevo ("2026-11-20"), p. ej. el día elegido en el calendario. */
  @Input() fechaInicial: string | null = null;

  readonly tipo = signal<TipoRecurrente>('gasto');
  readonly textos = computed(() => TEXTOS[this.tipo()]);
  readonly metodos = computed<{ valor: MetodoPago | MetodoIngreso; etiqueta: string }[]>(() =>
    this.tipo() === 'gasto' ? METODOS_PAGO : METODOS_INGRESO,
  );
  readonly iconosMetodo = ICONOS_METODO;
  readonly periodicidades = Object.entries(PERIODICIDADES) as [Periodicidad, string][];
  readonly hoy = fechaLocal();

  readonly categorias = signal<Categoria[]>([]);
  readonly cargandoCategorias = signal(true);
  readonly enviando = signal(false);
  /** Categorías ya cargadas de cada tipo, para no pedirlas otra vez al alternar pago y cobro. */
  private readonly categoriasPorTipo = new Map<TipoRecurrente, Categoria[]>();

  // Mismas validaciones que el backend (Gasto/IngresoRecurrenteRegistroDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    categoriaId: [null as number | null, Validators.required],
    metodo: ['TARJETA' as MetodoPago | MetodoIngreso, Validators.required],
    periodicidad: ['MENSUAL' as Periodicidad, Validators.required],
    proximaFecha: [fechaLocal(), Validators.required],
    conFechaFin: [false],
    fechaFin: [fechaLocal()],
  });

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      cardOutline,
      cashOutline,
      checkmarkOutline,
      closeOutline,
      createOutline,
      flagOutline,
      pauseOutline,
      phonePortraitOutline,
      playOutline,
      repeatOutline,
      swapHorizontalOutline,
      trashOutline,
      trendingDownOutline,
      trendingUpOutline,
    });
  }

  ngOnInit(): void {
    const r = this.recurrente;
    this.tipo.set(r?.tipo ?? this.tipoInicial);
    if (r) {
      this.formulario.setValue({
        importe: r.importe,
        descripcion: r.descripcion,
        categoriaId: r.categoriaId,
        metodo: r.metodo,
        periodicidad: r.periodicidad,
        proximaFecha: r.proximaFecha,
        conFechaFin: r.fechaFin !== null,
        fechaFin: r.fechaFin ?? r.proximaFecha,
      });
    } else {
      this.formulario.controls.metodo.setValue(this.metodos()[0].valor);
      if (this.fechaInicial) {
        this.formulario.patchValue({ proximaFecha: this.fechaInicial, fechaFin: this.fechaInicial });
      }
    }
    this.cargarCategorias();
  }

  /** Solo en uno nuevo: pasa de pago a cobro o al revés (cambian categorías y métodos). */
  cambiarTipo(tipo: TipoRecurrente): void {
    if (this.recurrente || tipo === this.tipo()) {
      return;
    }
    this.tipo.set(tipo);
    this.formulario.controls.metodo.setValue(this.metodos()[0].valor);
    this.formulario.controls.categoriaId.reset(null);
    this.cargarCategorias();
  }

  private cargarCategorias(): void {
    const tipo = this.tipo();
    const enCache = this.categoriasPorTipo.get(tipo);
    if (enCache) {
      this.ponerCategorias(enCache);
      return;
    }
    this.cargandoCategorias.set(true);
    const peticion = tipo === 'gasto' ? this.categoriaService.listar() : this.categoriaIngresoService.listar();
    peticion.subscribe({
      next: (categorias) => {
        this.categoriasPorTipo.set(tipo, categorias);
        // Si entretanto se cambió de tipo, estas ya no son las que se ven
        if (this.tipo() === tipo) {
          this.ponerCategorias(categorias);
        }
      },
      error: (error: unknown) => {
        this.cargandoCategorias.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }

  private ponerCategorias(categorias: Categoria[]): void {
    this.categorias.set(categorias);
    this.cargandoCategorias.set(false);
    if (!this.recurrente && categorias.length === 1) {
      this.formulario.controls.categoriaId.setValue(categorias[0].id);
    }
  }

  invalido(control: 'importe' | 'descripcion' | 'categoriaId'): boolean {
    const c = this.formulario.controls[control];
    return c.invalid && c.touched;
  }

  /** ion-datetime puede devolver la fecha con hora o zona: solo interesa "AAAA-MM-DD". */
  private fecha(valor: string): string {
    return valor.substring(0, 10);
  }

  /** Aviso bajo las fechas cuando guardar va a apuntar movimientos al momento. */
  avisoCobro(): string {
    if (this.recurrente && !this.recurrente.activo) {
      return '';
    }
    const proxima = this.fecha(this.formulario.controls.proximaFecha.value);
    if (proxima === this.hoy) {
      return `El cobro de hoy se apuntará ya como ${this.textos().movimiento} al guardar.`;
    }
    return proxima < this.hoy ? 'Al guardar se apuntarán también los cobros atrasados desde esa fecha.' : '';
  }

  /** Importe y periodicidad para el botón de guardar ("9,99 € · mensual"); vacío si el importe no es válido. */
  resumenImporte(): string {
    const importe = Number(this.formulario.controls.importe.value);
    const periodicidad = PERIODICIDADES[this.formulario.controls.periodicidad.value].toLowerCase();
    return importe > 0 ? `${FORMATO_EUROS.format(importe)} · ${periodicidad}` : '';
  }

  elegirCategoria(id: number): void {
    this.formulario.controls.categoriaId.setValue(id);
    this.formulario.controls.categoriaId.markAsTouched();
  }

  async nuevaCategoria(): Promise<void> {
    const tipo = this.tipo();
    const nombre = await pedirNombreCategoria(this.alertController, this.textos().ejemploCategoria);
    if (!nombre) {
      return;
    }
    const peticion =
      tipo === 'gasto' ? this.categoriaService.crear({ nombre }) : this.categoriaIngresoService.crear({ nombre });
    peticion.subscribe({
      next: (categoria) => {
        const todas = [...(this.categoriasPorTipo.get(tipo) ?? []), categoria].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es'),
        );
        this.categoriasPorTipo.set(tipo, todas);
        if (this.tipo() === tipo) {
          this.categorias.set(todas);
          this.elegirCategoria(categoria.id);
        }
      },
      error: (error: unknown) => void this.avisos.errorHttp(error),
    });
  }

  cancelar(): void {
    void this.modalController.dismiss(null, 'cancelar');
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const proximaFecha = this.fecha(v.proximaFecha);
    // fechaInicio fija el día de referencia de los cobros: si cambia la fecha del próximo cobro,
    // la nueva pasa a ser la referencia (así "del 15 al 20" sigue el día 20 los meses siguientes)
    const original = this.recurrente;
    const fechaInicio = original && original.proximaFecha === proximaFecha ? original.fechaInicio : proximaFecha;
    const datos: RecurrenteDatos = {
      importe: Number(v.importe),
      descripcion: v.descripcion.trim(),
      metodo: v.metodo,
      periodicidad: v.periodicidad,
      proximaFecha,
      fechaInicio,
      fechaFin: v.conFechaFin ? this.fecha(v.fechaFin) : null,
      categoriaId: v.categoriaId as number,
    };
    this.ejecutar(
      original ? this.recurrenteService.actualizar(original, datos) : this.recurrenteService.crear(this.tipo(), datos),
      'guardado',
    );
  }

  cambiarEstado(): void {
    const r = this.recurrente;
    if (r) {
      this.ejecutar(this.recurrenteService.cambiarEstado(r), r.activo ? 'pausado' : 'reactivado');
    }
  }

  async eliminar(): Promise<void> {
    const r = this.recurrente;
    if (!r) {
      return;
    }
    const alerta = await this.alertController.create({
      header: `¿Eliminar «${r.descripcion}»?`,
      message: `Dejará de apuntarse. Los ${this.textos().movimiento}s que ya generó se quedan en tu historial.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'destructive') {
      this.ejecutar(this.recurrenteService.eliminar(r), 'eliminado');
    }
  }

  private ejecutar(peticion: Observable<unknown>, resultado: ResultadoRecurrente): void {
    this.enviando.set(true);
    peticion.subscribe({
      next: () => {
        this.enviando.set(false);
        void this.modalController.dismiss(this.tipo(), resultado);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }
}
