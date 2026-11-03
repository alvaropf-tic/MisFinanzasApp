import { Component, Input, type OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, pieChartOutline, trashOutline } from 'ionicons/icons';
import type { Observable } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import type { Presupuesto } from '../../models/presupuesto.model';
import { PresupuestoService } from '../../services/presupuesto.service';

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/**
 * Hoja para definir, cambiar o quitar el presupuesto de un mes. Con `presupuesto` edita; sin él, crea.
 * Se cierra con el rol 'guardado' o 'eliminado'.
 */
@Component({
  selector: 'app-presupuesto-form',
  templateUrl: 'presupuesto-form.component.html',
  styleUrls: ['presupuesto-form.component.scss'],
  imports: [ReactiveFormsModule, IonContent, IonFooter, IonButton, IonIcon, IonSpinner],
})
export class PresupuestoFormComponent implements OnInit {
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  // `componentProps` del modal asigna las propiedades directamente: con input() de señal las sustituiría
  @Input() presupuesto: Presupuesto | null = null;
  @Input() anio = new Date().getFullYear();
  @Input() mes = new Date().getMonth() + 1;

  readonly enviando = signal(false);

  // Mismas validaciones que el backend (PresupuestoRegistroDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    addIcons({ checkmarkOutline, closeOutline, pieChartOutline, trashOutline });
  }

  ngOnInit(): void {
    if (this.presupuesto) {
      this.formulario.controls.importe.setValue(this.presupuesto.importe);
    }
  }

  /** "noviembre de 2026" */
  get nombreMes(): string {
    return new Date(this.anio, this.mes - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  importeInvalido(): boolean {
    const control = this.formulario.controls.importe;
    return control.invalid && control.touched;
  }

  /** Importe ya escrito, con formato, para el botón de guardar ("800,00 €"); vacío si no es válido. */
  importeTexto(): string {
    const importe = Number(this.formulario.controls.importe.value);
    return importe > 0 ? FORMATO_EUROS.format(importe) : '';
  }

  cancelar(): void {
    void this.modalController.dismiss(null, 'cancelar');
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const datos = { importe: Number(this.formulario.controls.importe.value), mes: this.mes, anio: this.anio };
    const peticion: Observable<Presupuesto> = this.presupuesto
      ? this.presupuestoService.actualizar(this.presupuesto.id, datos)
      : this.presupuestoService.crear(datos);
    this.enviando.set(true);
    peticion.subscribe({
      next: (presupuesto) => {
        this.enviando.set(false);
        void this.modalController.dismiss(presupuesto, 'guardado');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }

  async eliminar(): Promise<void> {
    const presupuesto = this.presupuesto;
    if (!presupuesto) {
      return;
    }
    const alerta = await this.alertController.create({
      header: '¿Quitar el presupuesto?',
      message: `Se eliminará el presupuesto de ${this.nombreMes}. Tus gastos no se borran.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Quitar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role !== 'destructive') {
      return;
    }
    this.enviando.set(true);
    this.presupuestoService.eliminar(presupuesto.id).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.modalController.dismiss(null, 'eliminado');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }
}
