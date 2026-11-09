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
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  notificationsOutline,
  textOutline,
  trashOutline,
} from 'ionicons/icons';
import { type Observable, firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import {
  REPETICIONES,
  type Recordatorio,
  type RecordatorioRegistro,
  type Repeticion,
} from '../../models/recordatorio.model';
import { RecordatorioService } from '../../services/recordatorio.service';

function fechaLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export type ResultadoRecordatorio = 'guardado' | 'eliminado';

export const MENSAJES_RECORDATORIO: Record<ResultadoRecordatorio, string> = {
  guardado: 'Recordatorio guardado',
  eliminado: 'Recordatorio eliminado',
};

/** Abre la hoja de un recordatorio (nuevo si no se pasa; `fechaInicial` propone el día). */
export async function abrirFormularioRecordatorio(
  modalController: ModalController,
  recordatorio: Recordatorio | null = null,
  fechaInicial: string | null = null,
): Promise<ResultadoRecordatorio | null> {
  const modal = await modalController.create({
    component: RecordatorioFormComponent,
    componentProps: { recordatorio, fechaInicial },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  return role === 'guardado' || role === 'eliminado' ? role : null;
}

/** Hoja de un recordatorio del calendario: qué, cuándo, si se repite y una nota. */
@Component({
  selector: 'app-recordatorio-form',
  templateUrl: 'recordatorio-form.component.html',
  styleUrls: ['recordatorio-form.component.scss'],
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
})
export class RecordatorioFormComponent implements OnInit {
  private readonly recordatorioService = inject(RecordatorioService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  @Input() recordatorio: Recordatorio | null = null;
  @Input() fechaInicial: string | null = null;

  readonly repeticiones = REPETICIONES;
  readonly enviando = signal(false);

  readonly formulario = inject(NonNullableFormBuilder).group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    fecha: [fechaLocal(), Validators.required],
    repeticion: ['NINGUNA' as Repeticion],
    nota: ['', Validators.maxLength(255)],
  });

  constructor() {
    addIcons({
      calendarOutline,
      checkmarkOutline,
      closeOutline,
      createOutline,
      notificationsOutline,
      textOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    const r = this.recordatorio;
    if (r) {
      this.formulario.setValue({ titulo: r.titulo, fecha: r.fecha, repeticion: r.repeticion, nota: r.nota ?? '' });
    } else if (this.fechaInicial) {
      this.formulario.controls.fecha.setValue(this.fechaInicial);
    }
  }

  tituloInvalido(): boolean {
    const c = this.formulario.controls.titulo;
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
    const datos: RecordatorioRegistro = {
      titulo: v.titulo.trim(),
      fecha: v.fecha.substring(0, 10),
      repeticion: v.repeticion,
      nota: v.nota.trim() || null,
    };
    const r = this.recordatorio;
    void this.ejecutar(
      r ? this.recordatorioService.actualizar(r.id, datos) : this.recordatorioService.crear(datos),
      'guardado',
    );
  }

  async eliminar(): Promise<void> {
    const r = this.recordatorio;
    if (!r) {
      return;
    }
    const alerta = await this.alertController.create({
      header: `¿Eliminar «${r.titulo}»?`,
      message: r.repeticion === 'NINGUNA' ? 'No se puede deshacer.' : 'Se borran todas sus repeticiones.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'destructive') {
      void this.ejecutar(this.recordatorioService.eliminar(r.id), 'eliminado');
    }
  }

  private async ejecutar(peticion: Observable<unknown>, resultado: ResultadoRecordatorio): Promise<void> {
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
