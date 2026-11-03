import { Component, type OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';

import { AvisoService } from '../../core/aviso.service';
import type { Categoria } from '../../models/categoria.model';
import { METODOS_PAGO, type MetodoPago } from '../../models/gasto.model';
import { CategoriaService } from '../../services/categoria.service';
import { GastoService } from '../../services/gasto.service';

/** Fecha y hora local en el formato del backend, sin zona: "2026-11-03T13:45:00". */
function fechaHoraLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return (
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
    `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:00`
  );
}

/** Modal de alta de gasto. Se cierra con el rol 'creado' y el gasto como dato. */
@Component({
  selector: 'app-gasto-form',
  templateUrl: 'gasto-form.component.html',
  styleUrls: ['gasto-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonNote,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonSpinner,
  ],
})
export class GastoFormComponent implements OnInit {
  private readonly gastoService = inject(GastoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  readonly metodosPago = METODOS_PAGO;
  readonly categorias = signal<Categoria[]>([]);
  readonly cargandoCategorias = signal(true);
  readonly enviando = signal(false);

  // Mismas validaciones que el backend (GastoRegistroDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fecha: [fechaHoraLocal(), Validators.required],
    descripcion: ['', Validators.maxLength(255)],
    metodoPago: ['TARJETA' as MetodoPago, Validators.required],
    categoriaId: [null as number | null, Validators.required],
  });

  constructor() {
    addIcons({ addCircleOutline });
  }

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargandoCategorias.set(false);
        if (categorias.length === 1) {
          this.formulario.controls.categoriaId.setValue(categorias[0].id);
        }
      },
      error: (error: unknown) => {
        this.cargandoCategorias.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }

  cancelar(): void {
    void this.modalController.dismiss(null, 'cancelar');
  }

  async nuevaCategoria(): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Nueva categoría',
      inputs: [{ name: 'nombre', type: 'text', placeholder: 'Ej.: Comida', attributes: { maxlength: 50 } }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Crear', role: 'confirm' },
      ],
    });
    await alerta.present();
    const { role, data } = await alerta.onDidDismiss<{ values: { nombre: string } }>();
    const nombre = data?.values.nombre.trim() ?? '';
    if (role !== 'confirm' || !nombre) {
      return;
    }
    // Las validaciones (2-50 caracteres, nombre repetido) las devuelve el backend en `mensaje`
    this.categoriaService.crear({ nombre }).subscribe({
      next: (categoria) => {
        this.categorias.update((actuales) =>
          [...actuales, categoria].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        );
        this.formulario.controls.categoriaId.setValue(categoria.id);
      },
      error: (error: unknown) => void this.avisos.errorHttp(error),
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    this.enviando.set(true);
    this.gastoService
      .crear({
        importe: Number(valores.importe),
        // ion-datetime puede devolver la fecha con zona o sin segundos; se normaliza a la hora local
        fecha: `${valores.fecha.substring(0, 16)}:00`,
        descripcion: valores.descripcion.trim() || null,
        metodoPago: valores.metodoPago,
        categoriaId: valores.categoriaId as number,
      })
      .subscribe({
        next: (gasto) => {
          this.enviando.set(false);
          void this.modalController.dismiss(gasto, 'creado');
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          void this.avisos.errorHttp(error);
        },
      });
  }
}
