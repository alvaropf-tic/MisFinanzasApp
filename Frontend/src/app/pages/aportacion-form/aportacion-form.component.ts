import { Component, Input, type OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonFooter,
  IonIcon,
  IonInput,
  IonModal,
  IonSpinner,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  calendarOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  removeCircleOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import { monedaActual, simboloMoneda } from '../../core/moneda';
import type { Objetivo } from '../../models/objetivo.model';
import { ObjetivoService } from '../../services/objetivo.service';

function fechaLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export type Movimiento = 'aportar' | 'retirar';

/** Abre la hoja para aportar o retirar dinero de un objetivo. Devuelve el mensaje de confirmación o `null`. */
export async function abrirFormularioAportacion(
  modalController: ModalController,
  objetivo: Objetivo,
  movimiento: Movimiento = 'aportar',
): Promise<string | null> {
  const modal = await modalController.create({
    component: AportacionFormComponent,
    componentProps: { objetivo, movimientoInicial: movimiento },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { data, role } = await modal.onWillDismiss<string>();
  return role === 'guardado' ? (data ?? null) : null;
}

/** Hoja de aportar (verde) o retirar (rojo) dinero de un objetivo de ahorro. */
@Component({
  selector: 'app-aportacion-form',
  templateUrl: 'aportacion-form.component.html',
  styleUrls: ['aportacion-form.component.scss'],
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
  ],
  host: { '[class.retirar]': "movimiento() === 'retirar'" },
})
export class AportacionFormComponent implements OnInit {
  private readonly objetivoService = inject(ObjetivoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);

  @Input() objetivo!: Objetivo;
  @Input() movimientoInicial: Movimiento = 'aportar';

  readonly simboloMoneda = simboloMoneda();
  readonly hoy = fechaLocal();
  readonly movimiento = signal<Movimiento>('aportar');
  readonly enviando = signal(false);
  readonly ahorradoTexto = computed(() =>
    this.objetivo
      ? this.objetivo.ahorrado.toLocaleString('es-ES', { style: 'currency', currency: monedaActual() })
      : '',
  );

  readonly formulario = inject(NonNullableFormBuilder).group({
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fecha: [fechaLocal(), Validators.required],
    nota: ['', Validators.maxLength(255)],
  });

  constructor() {
    addIcons({ addCircleOutline, calendarOutline, checkmarkOutline, closeOutline, createOutline, removeCircleOutline });
  }

  ngOnInit(): void {
    // Sin nada ahorrado no se puede retirar
    this.movimiento.set(this.objetivo.ahorrado > 0 ? this.movimientoInicial : 'aportar');
  }

  importeInvalido(): boolean {
    const c = this.formulario.controls.importe;
    return c.invalid && c.touched;
  }

  /** Al retirar, no más de lo ahorrado. */
  demasiado(): boolean {
    return this.movimiento() === 'retirar' && Number(this.formulario.controls.importe.value) > this.objetivo.ahorrado;
  }

  cancelar(): void {
    void this.modalController.dismiss(null, 'cancelar');
  }

  async guardar(): Promise<void> {
    if (this.formulario.invalid || this.demasiado()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const importe = Number(v.importe);
    const retirar = this.movimiento() === 'retirar';
    this.enviando.set(true);
    try {
      const actualizado = await firstValueFrom(
        this.objetivoService.aportar(this.objetivo.id, {
          importe: retirar ? -importe : importe,
          fecha: v.fecha.substring(0, 10),
          nota: v.nota.trim() || null,
        }),
      );
      const mensaje =
        actualizado.completado && !this.objetivo.completado
          ? `¡Objetivo «${actualizado.nombre}» conseguido!`
          : retirar
            ? 'Retirada guardada'
            : 'Aportación guardada';
      void this.modalController.dismiss(mensaje, 'guardado');
    } catch (error) {
      void this.avisos.errorHttp(error);
    } finally {
      this.enviando.set(false);
    }
  }
}
