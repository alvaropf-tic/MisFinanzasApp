import { Component, Input, type OnInit, inject, signal } from '@angular/core';
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
  trashOutline,
} from 'ionicons/icons';
import type { Observable } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import type { Categoria } from '../../models/categoria.model';
import {
  type GastoRecurrente,
  type GastoRecurrenteRegistro,
  PERIODICIDADES,
  type Periodicidad,
} from '../../models/gasto-recurrente.model';
import { METODOS_PAGO, type MetodoPago } from '../../models/gasto.model';
import { ICONOS_METODO } from '../../models/movimiento.model';
import { CategoriaService } from '../../services/categoria.service';
import { GastoRecurrenteService } from '../../services/gasto-recurrente.service';
import { pedirNombreCategoria } from '../../shared/pedir-nombre-categoria';

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** Fecha local sin hora en el formato del backend: "2026-11-03". */
function fechaLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** Roles con los que se cierra la hoja: 'guardado', 'pausado', 'reactivado' o 'eliminado'. */
export type ResultadoRecurrente = 'guardado' | 'pausado' | 'reactivado' | 'eliminado';

/** Mensaje de confirmación para cada resultado. */
export const MENSAJES_RECURRENTE: Record<ResultadoRecurrente, string> = {
  guardado: 'Pago recurrente guardado',
  pausado: 'Pago recurrente pausado',
  reactivado: 'Pago recurrente reactivado',
  eliminado: 'Pago recurrente eliminado',
};

/** Abre la hoja (nuevo si no se pasa `recurrente`) y devuelve cómo se cerró, o `null` si se canceló. */
export async function abrirFormularioRecurrente(
  modalController: ModalController,
  recurrente: GastoRecurrente | null = null,
): Promise<ResultadoRecurrente | null> {
  const modal = await modalController.create({
    component: RecurrenteFormComponent,
    componentProps: { recurrente },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  return ['guardado', 'pausado', 'reactivado', 'eliminado'].includes(role ?? '') ? (role as ResultadoRecurrente) : null;
}

/**
 * Hoja de alta y edición de un pago recurrente (suscripción, alquiler…). Si el próximo cobro es hoy
 * o anterior, el backend apunta ya el gasto. En edición permite pausar, reactivar y eliminar.
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
})
export class RecurrenteFormComponent implements OnInit {
  private readonly recurrenteService = inject(GastoRecurrenteService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  // `componentProps` del modal asigna la propiedad directamente: con un input() de señal la sustituiría
  @Input() recurrente: GastoRecurrente | null = null;

  readonly metodos = METODOS_PAGO;
  readonly iconosMetodo = ICONOS_METODO;
  readonly periodicidades = Object.entries(PERIODICIDADES) as [Periodicidad, string][];
  readonly hoy = fechaLocal();

  readonly categorias = signal<Categoria[]>([]);
  readonly cargandoCategorias = signal(true);
  readonly enviando = signal(false);

  // Mismas validaciones que el backend (GastoRecurrenteRegistroDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    categoriaId: [null as number | null, Validators.required],
    metodoPago: ['TARJETA' as MetodoPago, Validators.required],
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
      trashOutline,
    });
  }

  ngOnInit(): void {
    const r = this.recurrente;
    if (r) {
      this.formulario.setValue({
        importe: r.importe,
        descripcion: r.descripcion,
        categoriaId: r.categoriaId,
        metodoPago: r.metodoPago,
        periodicidad: r.periodicidad,
        proximaFecha: r.proximaFecha,
        conFechaFin: r.fechaFin !== null,
        fechaFin: r.fechaFin ?? r.proximaFecha,
      });
    }
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargandoCategorias.set(false);
        if (!r && categorias.length === 1) {
          this.formulario.controls.categoriaId.setValue(categorias[0].id);
        }
      },
      error: (error: unknown) => {
        this.cargandoCategorias.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }

  invalido(control: 'importe' | 'descripcion' | 'categoriaId'): boolean {
    const c = this.formulario.controls[control];
    return c.invalid && c.touched;
  }

  /** ion-datetime puede devolver la fecha con hora o zona: solo interesa "AAAA-MM-DD". */
  private fecha(valor: string): string {
    return valor.substring(0, 10);
  }

  /** Aviso bajo las fechas cuando guardar va a apuntar gastos al momento. */
  avisoCobro(): string {
    if (this.recurrente && !this.recurrente.activo) {
      return '';
    }
    const proxima = this.fecha(this.formulario.controls.proximaFecha.value);
    if (proxima === this.hoy) {
      return 'El cobro de hoy se apuntará ya como gasto al guardar.';
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
    const nombre = await pedirNombreCategoria(this.alertController, 'Suscripciones');
    if (!nombre) {
      return;
    }
    this.categoriaService.crear({ nombre }).subscribe({
      next: (categoria) => {
        this.categorias.update((actuales) =>
          [...actuales, categoria].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        );
        this.elegirCategoria(categoria.id);
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
    const datos: GastoRecurrenteRegistro = {
      importe: Number(v.importe),
      descripcion: v.descripcion.trim(),
      metodoPago: v.metodoPago,
      periodicidad: v.periodicidad,
      proximaFecha,
      fechaInicio,
      fechaFin: v.conFechaFin ? this.fecha(v.fechaFin) : null,
      categoriaId: v.categoriaId as number,
    };
    this.ejecutar(
      original ? this.recurrenteService.actualizar(original.id, datos) : this.recurrenteService.crear(datos),
      'guardado',
    );
  }

  cambiarEstado(): void {
    const r = this.recurrente;
    if (r) {
      this.ejecutar(this.recurrenteService.cambiarEstado(r.id), r.activo ? 'pausado' : 'reactivado');
    }
  }

  async eliminar(): Promise<void> {
    const r = this.recurrente;
    if (!r) {
      return;
    }
    const alerta = await this.alertController.create({
      header: `¿Eliminar «${r.descripcion}»?`,
      message: 'Dejará de apuntarse. Los gastos que ya generó se quedan en tu historial.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'destructive') {
      this.ejecutar(this.recurrenteService.eliminar(r.id), 'eliminado');
    }
  }

  private ejecutar(peticion: Observable<unknown>, resultado: ResultadoRecurrente): void {
    this.enviando.set(true);
    peticion.subscribe({
      next: () => {
        this.enviando.set(false);
        void this.modalController.dismiss(null, resultado);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }
}
