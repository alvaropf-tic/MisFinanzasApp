import { Component, Input, type OnDestroy, type OnInit, inject, signal } from '@angular/core';
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
  receiptOutline,
  sparklesOutline,
  swapHorizontalOutline,
  trashOutline,
  trendingDownOutline,
  trendingUpOutline,
  warningOutline,
} from 'ionicons/icons';
import { type Observable, firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import { mensajeDeError } from '../../core/mensaje-error';
import type { Categoria } from '../../models/categoria.model';
import { METODOS_PAGO, type MetodoPago, type OrigenGasto } from '../../models/gasto.model';
import { METODOS_INGRESO, type MetodoIngreso } from '../../models/ingreso.model';
import { ICONOS_METODO, type Movimiento, type TipoMovimiento, esGasto } from '../../models/movimiento.model';
import { CategoriaIngresoService } from '../../services/categoria-ingreso.service';
import { CategoriaService } from '../../services/categoria.service';
import { GastoService } from '../../services/gasto.service';
import { IngresoService } from '../../services/ingreso.service';
import { TicketService } from '../../services/ticket.service';
import type { LecturaTicket } from '../../models/ticket.model';
import { pedirNombreCategoria } from '../../shared/pedir-nombre-categoria';
import { FORMATOS_IMAGEN, reducirImagen } from '../../shared/reducir-imagen';
import { monedaActual, simboloMoneda } from '../../core/moneda';

/** Fecha y hora local en el formato del backend, sin zona: "2026-11-03T13:45:00". */
function fechaHoraLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return (
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
    `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:00`
  );
}

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: monedaActual() });

/** Gastos que crea y mantiene el módulo de vehículos: no se editan con esta hoja, sino desde su registro. */
export const ORIGENES_VEHICULO: OrigenGasto[] = ['REPOSTAJE', 'ACEITE', 'NEUMATICO', 'MANTENIMIENTO', 'ITV'];

/** Cómo se cerró la hoja: 'creado', 'guardado' (editado) o 'eliminado'; `null` si se canceló. */
export type ResultadoMovimiento = 'creado' | 'guardado' | 'eliminado';

/** Aviso para cada resultado, p. ej. "Gasto actualizado". */
export function mensajeMovimiento(tipo: TipoMovimiento, resultado: ResultadoMovimiento): string {
  const nombre = tipo === 'gasto' ? 'Gasto' : 'Ingreso';
  return { creado: `${nombre} guardado`, guardado: `${nombre} actualizado`, eliminado: `${nombre} eliminado` }[
    resultado
  ];
}

/**
 * Abre la hoja de un gasto o ingreso (nuevo si no se pasa `movimiento`) y devuelve cómo se cerró.
 * `fechaInicial` ("2026-11-20") propone ese día en uno nuevo (desde el calendario).
 * `fotoTicket`: gasto nuevo desde la foto de un ticket; la IA rellena los datos y la foto se guarda con él.
 */
export async function abrirFormularioMovimiento(
  modalController: ModalController,
  tipo: TipoMovimiento,
  movimiento: Movimiento | null = null,
  fechaInicial: string | null = null,
  fotoTicket: Blob | null = null,
): Promise<ResultadoMovimiento | null> {
  return (await abrirGastoDesdeTicket(modalController, tipo, movimiento, fechaInicial, fotoTicket)).resultado;
}

/**
 * Como `abrirFormularioMovimiento`, y además: si la foto resulta ser de un vehículo, la hoja se cierra y
 * devuelve `vehiculo` con la foto ya reducida y lo leído, para registrarlo en su módulo. Con `lectura`
 * (ya leída) no se vuelve a llamar a la IA ni se redirige.
 */
export async function abrirGastoDesdeTicket(
  modalController: ModalController,
  tipo: TipoMovimiento,
  movimiento: Movimiento | null,
  fechaInicial: string | null,
  fotoTicket: Blob | null,
  lecturaTicket: LecturaTicket | null = null,
): Promise<{ resultado: ResultadoMovimiento | null; vehiculo: { foto: Blob; lectura: LecturaTicket } | null }> {
  // Hoja que sube desde abajo, con tirador para cerrarla deslizando
  const modal = await modalController.create({
    component: MovimientoFormComponent,
    componentProps: { tipo, movimiento, fechaInicial, fotoTicket, lecturaTicket },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { data, role } = await modal.onWillDismiss<{ foto: Blob; lectura: LecturaTicket }>();
  if (role === 'vehiculo' && data) {
    return { resultado: null, vehiculo: data };
  }
  return {
    resultado: role === 'creado' || role === 'guardado' || role === 'eliminado' ? role : null,
    vehiculo: null,
  };
}

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
export class MovimientoFormComponent implements OnInit, OnDestroy {
  /** Símbolo de la moneda elegida para el campo de importe. */
  readonly simboloMoneda = simboloMoneda();

  private readonly gastoService = inject(GastoService);
  private readonly ingresoService = inject(IngresoService);
  private readonly ticketService = inject(TicketService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly categoriaIngresoService = inject(CategoriaIngresoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  // `componentProps` del modal asigna las propiedades directamente: con input() de señal las sustituiría
  @Input() tipo: TipoMovimiento = 'gasto';
  /** Con un movimiento, la hoja edita (y permite eliminar); sin él, crea. */
  @Input() movimiento: Movimiento | null = null;
  /** Día propuesto para uno nuevo ("2026-11-20"), con la hora actual. */
  @Input() fechaInicial: string | null = null;
  /** Foto de un ticket para un gasto nuevo: se lee con la IA y se guarda con el gasto. */
  @Input() fotoTicket: Blob | null = null;
  /** Lectura ya hecha (al volver de «Guardar como gasto normal»): se aplica sin llamar otra vez a la IA. */
  @Input() lecturaTicket: LecturaTicket | null = null;

  /** Foto que se ve (la del ticket nuevo o la del gasto que se edita), como URL local. */
  readonly foto = signal<string | null>(null);
  readonly fotoAmpliada = signal(false);
  /** Estado de la lectura con IA: leyendo, leído, sin datos o error (con su mensaje). */
  readonly lectura = signal<{ estado: 'leyendo' | 'leido' | 'error'; mensaje: string } | null>(null);
  /** Foto ya reducida que se sube al guardar. */
  private fotoReducida: Blob | null = null;
  /** Comercio leído: el ticket lo guarda aunque la descripción se cambie. */
  private comercio: string | null = null;

  get textos(): (typeof TEXTOS)[TipoMovimiento] {
    return TEXTOS[this.tipo];
  }

  get titulo(): string {
    if (!this.movimiento) {
      return this.fotoTicket ? 'Gasto desde ticket' : this.textos.titulo;
    }
    return this.tipo === 'gasto' ? 'Editar gasto' : 'Editar ingreso';
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
      receiptOutline,
      sparklesOutline,
      swapHorizontalOutline,
      trashOutline,
      trendingDownOutline,
      trendingUpOutline,
      warningOutline,
    });
  }

  ngOnDestroy(): void {
    const foto = this.foto();
    if (foto) {
      URL.revokeObjectURL(foto);
    }
  }

  /** Foto del ticket del gasto que se edita. */
  private async cargarFoto(ticketId: number): Promise<void> {
    try {
      this.foto.set(URL.createObjectURL(await firstValueFrom(this.ticketService.imagen(ticketId))));
    } catch {
      // Sin foto la hoja sigue sirviendo para editar el gasto
    }
  }

  /** Reduce la foto, la enseña y la manda a leer; rellena lo que la IA haya sacado y el usuario no haya tocado. */
  private async leerTicket(archivo: Blob): Promise<void> {
    if (this.lecturaTicket) {
      // Ya leída y reducida: se aplica tal cual
      this.fotoReducida = archivo;
      this.foto.set(URL.createObjectURL(archivo));
      this.aplicarLectura(this.lecturaTicket);
      return;
    }
    this.lectura.set({ estado: 'leyendo', mensaje: 'Leyendo el ticket…' });
    const foto = await reducirImagen(archivo);
    if (!FORMATOS_IMAGEN.includes(foto.type)) {
      // No se ha podido abrir (p. ej. HEIC de iPhone): el gasto se guarda sin foto, rellenándolo a mano
      this.lectura.set({
        estado: 'error',
        mensaje: 'Esta foto no se puede abrir aquí (usa JPG, PNG o WEBP). Rellena el gasto a mano.',
      });
      return;
    }
    this.fotoReducida = foto;
    this.foto.set(URL.createObjectURL(foto));
    try {
      const datos = await firstValueFrom(this.ticketService.leer(foto));
      if (datos.tipo !== 'COMPRA') {
        // Ticket de vehículo (ITV, repostaje…): se registra en su módulo; quien abrió la hoja abre la del vehículo
        void this.modalController.dismiss({ foto, lectura: datos }, 'vehiculo');
        return;
      }
      this.aplicarLectura(datos);
    } catch (error) {
      // El motivo concreto (límite gratuito, sin conexión, IA sin configurar…) se ve en el aviso de la hoja;
      // la foto se guarda igual con el gasto
      this.lectura.set({ estado: 'error', mensaje: mensajeDeError(error) });
    }
  }

  /** Rellena lo que la IA haya leído y el usuario no haya tocado. */
  private aplicarLectura(datos: LecturaTicket): void {
    const c = this.formulario.controls;
    const poner = <T>(control: { dirty: boolean; setValue(valor: T): void }, valor: T | null) => {
      if (valor !== null && !control.dirty) {
        control.setValue(valor);
      }
    };
    poner(c.importe, datos.importe);
    // El ticket solo trae el día: se le pone la hora actual
    poner(c.fecha, datos.fecha ? `${datos.fecha}${fechaHoraLocal().substring(10)}` : null);
    poner(c.descripcion, datos.comercio);
    poner(c.metodo, datos.metodoPago);
    poner(c.categoriaId, datos.categoriaId);
    this.comercio = datos.comercio;
    const algo = datos.importe !== null || datos.comercio !== null || datos.fecha !== null;
    this.lectura.set(
      algo
        ? { estado: 'leido', mensaje: 'Datos leídos del ticket: revísalos antes de guardar.' }
        : { estado: 'error', mensaje: 'No se ha podido leer nada en la foto. Rellénalo a mano.' },
    );
  }

  ngOnInit(): void {
    const m = this.movimiento;
    if (m) {
      this.tipo = esGasto(m) ? 'gasto' : 'ingreso';
      this.formulario.setValue({
        importe: m.importe,
        fecha: m.fecha,
        descripcion: m.descripcion ?? '',
        metodo: esGasto(m) ? m.metodoPago : m.metodoIngreso,
        categoriaId: esGasto(m) ? m.categoriaId : m.categoriaIngresoId,
      });
      if (esGasto(m) && m.ticketId !== null) {
        void this.cargarFoto(m.ticketId);
      }
    } else {
      // El tipo ya está asignado aquí: el método por defecto es el primero de su lista
      this.formulario.controls.metodo.setValue(this.metodos[0].valor);
      if (this.fechaInicial) {
        // Ese día, a la hora actual ("T13:45:00")
        this.formulario.controls.fecha.setValue(`${this.fechaInicial}${fechaHoraLocal().substring(10)}`);
      }
      if (this.fotoTicket) {
        void this.leerTicket(this.fotoTicket);
      }
    }
    this.listarCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargandoCategorias.set(false);
        if (!m && categorias.length === 1 && this.formulario.controls.categoriaId.value === null) {
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
    // Mientras se reduce la foto todavía no hay qué subir
    if (this.fotoTicket && !this.fotoReducida && this.lectura()?.estado === 'leyendo') {
      return;
    }
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
    const id = this.movimiento?.id;
    let peticion: Observable<Movimiento>;
    if (this.tipo === 'gasto') {
      const datos = {
        ...comunes,
        metodoPago: valores.metodo as MetodoPago,
        categoriaId: valores.categoriaId as number,
      };
      if (id) {
        peticion = this.gastoService.actualizar(id, datos);
      } else if (this.fotoReducida) {
        // Gasto escaneado: se guarda con su ticket y la foto
        peticion = this.ticketService.crearGasto({ ...datos, comercio: this.comercio }, this.fotoReducida);
      } else {
        peticion = this.gastoService.crear(datos);
      }
    } else {
      const datos = {
        ...comunes,
        metodoIngreso: valores.metodo as MetodoIngreso,
        categoriaIngresoId: valores.categoriaId as number,
      };
      peticion = id ? this.ingresoService.actualizar(id, datos) : this.ingresoService.crear(datos);
    }
    this.enviando.set(true);
    peticion.subscribe({
      next: (movimiento) => {
        this.enviando.set(false);
        void this.modalController.dismiss(movimiento, id ? 'guardado' : 'creado');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }

  async eliminar(): Promise<void> {
    const m = this.movimiento;
    if (!m) {
      return;
    }
    const nombre = this.tipo === 'gasto' ? 'gasto' : 'ingreso';
    const alerta = await this.alertController.create({
      header: `¿Eliminar este ${nombre}?`,
      message:
        `${m.descripcion || 'Sin descripción'} · ${FORMATO_EUROS.format(m.importe)}.` +
        (esGasto(m) && m.ticketId !== null ? ' También se borrará la foto del ticket.' : '') +
        ' No se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role !== 'destructive') {
      return;
    }
    this.enviando.set(true);
    (this.tipo === 'gasto' ? this.gastoService.eliminar(m.id) : this.ingresoService.eliminar(m.id)).subscribe({
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

  private listarCategorias(): Observable<Categoria[]> {
    return this.tipo === 'gasto' ? this.categoriaService.listar() : this.categoriaIngresoService.listar();
  }
}
