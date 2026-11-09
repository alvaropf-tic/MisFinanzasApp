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
  airplaneOutline,
  calendarOutline,
  carSportOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  flagOutline,
  giftOutline,
  homeOutline,
  medkitOutline,
  phonePortraitOutline,
  schoolOutline,
  trashOutline,
  walletOutline,
} from 'ionicons/icons';
import { type Observable, firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import { simboloMoneda } from '../../core/moneda';
import { ICONOS_OBJETIVO, type Objetivo, type ObjetivoRegistro } from '../../models/objetivo.model';
import { ObjetivoService } from '../../services/objetivo.service';

/** Fecha local sin hora: "2026-11-09". */
function fechaLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export type ResultadoObjetivo = 'guardado' | 'eliminado';

export const MENSAJES_OBJETIVO: Record<ResultadoObjetivo, string> = {
  guardado: 'Objetivo guardado',
  eliminado: 'Objetivo eliminado',
};

/** Abre la hoja de un objetivo (nuevo si no se pasa `objetivo`). */
export async function abrirFormularioObjetivo(
  modalController: ModalController,
  objetivo: Objetivo | null = null,
): Promise<ResultadoObjetivo | null> {
  const modal = await modalController.create({
    component: ObjetivoFormComponent,
    componentProps: { objetivo },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  return role === 'guardado' || role === 'eliminado' ? role : null;
}

/** Hoja de alta y edición de un objetivo de ahorro: meta, nombre, icono y fecha límite opcional. */
@Component({
  selector: 'app-objetivo-form',
  templateUrl: 'objetivo-form.component.html',
  styleUrls: ['objetivo-form.component.scss'],
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
export class ObjetivoFormComponent implements OnInit {
  private readonly objetivoService = inject(ObjetivoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  // `componentProps` del modal asigna la propiedad directamente: con un input() de señal la sustituiría
  @Input() objetivo: Objetivo | null = null;

  readonly simboloMoneda = simboloMoneda();
  readonly iconos = ICONOS_OBJETIVO;
  readonly manana = fechaLocal(new Date(Date.now() + 86_400_000));
  readonly enviando = signal(false);

  readonly formulario = inject(NonNullableFormBuilder).group({
    importeObjetivo: [null as number | null, [Validators.required, Validators.min(0.01)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    icono: [ICONOS_OBJETIVO[0].icono],
    conFecha: [false],
    fechaLimite: [fechaLocal(new Date(new Date().getFullYear(), new Date().getMonth() + 6, 1))],
  });

  constructor() {
    addIcons({
      airplaneOutline,
      calendarOutline,
      carSportOutline,
      checkmarkOutline,
      closeOutline,
      createOutline,
      flagOutline,
      giftOutline,
      homeOutline,
      medkitOutline,
      phonePortraitOutline,
      schoolOutline,
      trashOutline,
      walletOutline,
    });
  }

  ngOnInit(): void {
    const o = this.objetivo;
    if (o) {
      this.formulario.patchValue({
        importeObjetivo: o.importeObjetivo,
        nombre: o.nombre,
        icono: o.icono ?? ICONOS_OBJETIVO[0].icono,
        conFecha: o.fechaLimite !== null,
        ...(o.fechaLimite ? { fechaLimite: o.fechaLimite } : {}),
      });
    }
  }

  invalido(control: 'importeObjetivo' | 'nombre'): boolean {
    const c = this.formulario.controls[control];
    return c.invalid && c.touched;
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
    const datos: ObjetivoRegistro = {
      nombre: v.nombre.trim(),
      importeObjetivo: Number(v.importeObjetivo),
      icono: v.icono,
      fechaLimite: v.conFecha ? v.fechaLimite.substring(0, 10) : null,
    };
    const o = this.objetivo;
    void this.ejecutar(
      o ? this.objetivoService.actualizar(o.id, datos) : this.objetivoService.crear(datos),
      'guardado',
    );
  }

  async eliminar(): Promise<void> {
    const o = this.objetivo;
    if (!o) {
      return;
    }
    const alerta = await this.alertController.create({
      header: `¿Eliminar «${o.nombre}»?`,
      message: 'Se borrará con todas sus aportaciones. No se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'destructive') {
      void this.ejecutar(this.objetivoService.eliminar(o.id), 'eliminado');
    }
  }

  private async ejecutar(peticion: Observable<unknown>, resultado: ResultadoObjetivo): Promise<void> {
    this.enviando.set(true);
    try {
      await firstValueFrom(peticion, { defaultValue: null });
      void this.modalController.dismiss(null, resultado);
    } catch (error) {
      void this.avisos.errorHttp(error);
    } finally {
      this.enviando.set(false);
    }
  }
}
