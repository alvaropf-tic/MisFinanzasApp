import { Component, Input, type OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
  IonSpinner,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  carSportOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  pauseOutline,
  playOutline,
  pricetagOutline,
  trashOutline,
} from 'ionicons/icons';
import type { Observable } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import type { Vehiculo } from '../../models/vehiculo.model';
import { VehiculoService } from '../../services/vehiculo.service';

/** Cómo se cerró la hoja; `null` si se canceló. */
export type ResultadoVehiculo = 'guardado' | 'desactivado' | 'activado' | 'eliminado';

export const MENSAJES_VEHICULO: Record<ResultadoVehiculo, string> = {
  guardado: 'Vehículo guardado',
  desactivado: 'Vehículo desactivado',
  activado: 'Vehículo activado',
  eliminado: 'Vehículo eliminado',
};

/** Abre la hoja (nuevo si no se pasa `vehiculo`) y devuelve cómo se cerró. */
export async function abrirFormularioVehiculo(
  modalController: ModalController,
  vehiculo: Vehiculo | null = null,
): Promise<ResultadoVehiculo | null> {
  const modal = await modalController.create({
    component: VehiculoFormComponent,
    componentProps: { vehiculo },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  return role && role in MENSAJES_VEHICULO ? (role as ResultadoVehiculo) : null;
}

/** Hoja de alta y edición de un vehículo. Los km de ahora son el punto de partida de la cuenta por trips. */
@Component({
  selector: 'app-vehiculo-form',
  templateUrl: 'vehiculo-form.component.html',
  styleUrls: ['vehiculo-form.component.scss'],
  imports: [ReactiveFormsModule, IonContent, IonFooter, IonButton, IonInput, IonIcon, IonSpinner],
})
export class VehiculoFormComponent implements OnInit {
  private readonly vehiculoService = inject(VehiculoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  // `componentProps` del modal asigna la propiedad directamente: con un input() de señal la sustituiría
  @Input() vehiculo: Vehiculo | null = null;

  readonly enviando = signal(false);

  // Mismas validaciones que el backend (VehiculoRegistroDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    kilometrosIniciales: [null as number | null, [Validators.required, Validators.min(0)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    marca: ['', Validators.maxLength(50)],
    modelo: ['', Validators.maxLength(50)],
    matricula: ['', Validators.maxLength(20)],
    anio: [null as number | null, [Validators.min(1900), Validators.max(2100)]],
  });

  constructor() {
    addIcons({
      calendarOutline,
      carSportOutline,
      checkmarkOutline,
      closeOutline,
      createOutline,
      pauseOutline,
      playOutline,
      pricetagOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    const v = this.vehiculo;
    if (v) {
      this.formulario.setValue({
        kilometrosIniciales: v.kilometrosIniciales ?? 0,
        nombre: v.nombre,
        marca: v.marca ?? '',
        modelo: v.modelo ?? '',
        matricula: v.matricula ?? '',
        anio: v.anio,
      });
    }
  }

  invalido(control: 'kilometrosIniciales' | 'nombre' | 'anio'): boolean {
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
    const texto = (valor: string) => valor.trim() || null;
    const datos = {
      nombre: v.nombre.trim(),
      marca: texto(v.marca),
      modelo: texto(v.modelo),
      matricula: texto(v.matricula)?.toUpperCase() ?? null,
      anio: v.anio ? Number(v.anio) : null,
      kilometrosIniciales: Math.round(Number(v.kilometrosIniciales)),
    };
    const original = this.vehiculo;
    this.ejecutar(
      original ? this.vehiculoService.actualizar(original.id, datos) : this.vehiculoService.crear(datos),
      'guardado',
    );
  }

  cambiarEstado(): void {
    const v = this.vehiculo;
    if (v) {
      this.ejecutar(this.vehiculoService.cambiarEstado(v.id), v.activo ? 'desactivado' : 'activado');
    }
  }

  async eliminar(): Promise<void> {
    const v = this.vehiculo;
    if (!v) {
      return;
    }
    const alerta = await this.alertController.create({
      header: `¿Eliminar «${v.nombre}»?`,
      message: 'Solo se puede si no tiene registros. Si los tiene, desactívalo para conservar su historial.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'destructive') {
      this.ejecutar(this.vehiculoService.eliminar(v.id), 'eliminado');
    }
  }

  private ejecutar(peticion: Observable<unknown>, resultado: ResultadoVehiculo): void {
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
