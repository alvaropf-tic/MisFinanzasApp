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
  addOutline,
  calendarOutline,
  cardOutline,
  cashOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  phonePortraitOutline,
  swapHorizontalOutline,
  trendingDownOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import type { Observable } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import type { Categoria } from '../../models/categoria.model';
import { METODOS_PAGO, type MetodoPago } from '../../models/gasto.model';
import { METODOS_INGRESO, type MetodoIngreso } from '../../models/ingreso.model';
import { ICONOS_METODO, type Movimiento, type TipoMovimiento } from '../../models/movimiento.model';
import { CategoriaIngresoService } from '../../services/categoria-ingreso.service';
import { CategoriaService } from '../../services/categoria.service';
import { GastoService } from '../../services/gasto.service';
import { IngresoService } from '../../services/ingreso.service';
import { pedirNombreCategoria } from '../../shared/pedir-nombre-categoria';

/** Fecha y hora local en el formato del backend, sin zona: "2026-11-03T13:45:00". */
function fechaHoraLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return (
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
    `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:00`
  );
}

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** Lo que cambia entre el alta de un gasto y la de un ingreso. */
const TEXTOS: Record<TipoMovimiento, { titulo: string; guardar: string; metodo: string; ejemploCategoria: string }> = {
  gasto: { titulo: 'Nuevo gasto', guardar: 'Guardar gasto', metodo: 'Método de pago', ejemploCategoria: 'Comida' },
  ingreso: {
    titulo: 'Nuevo ingreso',
    guardar: 'Guardar ingreso',
    metodo: 'Método de ingreso',
    ejemploCategoria: 'Nómina',
  },
};

/**
 * Hoja de alta de gasto o ingreso (según `tipo`, que llega en `componentProps`): importe grande,
 * categorías y métodos como botones, y fecha y descripción agrupadas.
 * Se cierra con el rol 'creado' y el movimiento como dato.
 */
@Component({
  selector: 'app-movimiento-form',
  templateUrl: 'movimiento-form.component.html',
  styleUrls: ['movimiento-form.component.scss'],
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
  // El color de acento (rojo gasto, verde ingreso) se define en el SCSS según esta clase
  host: { '[class.tipo-gasto]': "tipo === 'gasto'", '[class.tipo-ingreso]': "tipo === 'ingreso'" },
})
export class MovimientoFormComponent implements OnInit {
  private readonly gastoService = inject(GastoService);
  private readonly ingresoService = inject(IngresoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly categoriaIngresoService = inject(CategoriaIngresoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  // `componentProps` del modal asigna la propiedad directamente: con un input() de señal la sustituiría
  @Input() tipo: TipoMovimiento = 'gasto';

  get textos(): (typeof TEXTOS)[TipoMovimiento] {
    return TEXTOS[this.tipo];
  }

  get metodos(): { valor: MetodoPago | MetodoIngreso; etiqueta: string }[] {
    return this.tipo === 'gasto' ? METODOS_PAGO : METODOS_INGRESO;
  }

  /** Color de Ionic del botón de guardar. */
  get color(): string {
    return this.tipo === 'gasto' ? 'danger' : 'success';
  }

  readonly iconosMetodo = ICONOS_METODO;

  readonly categorias = signal<Categoria[]>([]);
  readonly cargandoCategorias = signal(true);
  readonly enviando = signal(false);

  // Mismas validaciones que el backend (GastoRegistroDTO e IngresoRegistroDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fecha: [fechaHoraLocal(), Validators.required],
    descripcion: ['', Validators.maxLength(255)],
    metodo: ['' as MetodoPago | MetodoIngreso, Validators.required],
    categoriaId: [null as number | null, Validators.required],
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
      phonePortraitOutline,
      swapHorizontalOutline,
      trendingDownOutline,
      trendingUpOutline,
    });
  }

  ngOnInit(): void {
    // El tipo ya está asignado aquí: el método por defecto es el primero de su lista
    this.formulario.controls.metodo.setValue(this.metodos[0].valor);
    this.listarCategorias().subscribe({
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

  importeInvalido(): boolean {
    const control = this.formulario.controls.importe;
    return control.invalid && control.touched;
  }

  categoriaInvalida(): boolean {
    const control = this.formulario.controls.categoriaId;
    return control.invalid && control.touched;
  }

  /** Importe ya escrito, con formato, para el botón de guardar ("25,40 €"); vacío si no es válido. */
  importeTexto(): string {
    const importe = Number(this.formulario.controls.importe.value);
    return importe > 0 ? FORMATO_EUROS.format(importe) : '';
  }

  elegirCategoria(id: number): void {
    this.formulario.controls.categoriaId.setValue(id);
    this.formulario.controls.categoriaId.markAsTouched();
  }

  cancelar(): void {
    void this.modalController.dismiss(null, 'cancelar');
  }

  async nuevaCategoria(): Promise<void> {
    const nombre = await pedirNombreCategoria(this.alertController, this.textos.ejemploCategoria);
    if (!nombre) {
      return;
    }
    const creacion =
      this.tipo === 'gasto' ? this.categoriaService.crear({ nombre }) : this.categoriaIngresoService.crear({ nombre });
    creacion.subscribe({
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
    const comunes = {
      importe: Number(valores.importe),
      // ion-datetime puede devolver la fecha con zona o sin segundos; se normaliza a la hora local
      fecha: `${valores.fecha.substring(0, 16)}:00`,
      descripcion: valores.descripcion.trim() || null,
    };
    const creacion: Observable<Movimiento> =
      this.tipo === 'gasto'
        ? this.gastoService.crear({
            ...comunes,
            metodoPago: valores.metodo as MetodoPago,
            categoriaId: valores.categoriaId as number,
          })
        : this.ingresoService.crear({
            ...comunes,
            metodoIngreso: valores.metodo as MetodoIngreso,
            categoriaIngresoId: valores.categoriaId as number,
          });
    this.enviando.set(true);
    creacion.subscribe({
      next: (movimiento) => {
        this.enviando.set(false);
        void this.modalController.dismiss(movimiento, 'creado');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }

  private listarCategorias(): Observable<Categoria[]> {
    return this.tipo === 'gasto' ? this.categoriaService.listar() : this.categoriaIngresoService.listar();
  }
}
