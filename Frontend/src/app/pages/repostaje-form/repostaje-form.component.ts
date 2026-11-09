import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, Input, type OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  phonePortraitOutline,
  pricetagOutline,
  speedometerOutline,
  trashOutline,
  waterOutline,
} from 'ionicons/icons';
import { type Observable, of, switchMap } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import type { TicketEscaneado } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';
import { FotoTicketComponent } from '../../shared/foto-ticket/foto-ticket.component';
import type { Categoria } from '../../models/categoria.model';
import { METODOS_PAGO, type MetodoPago } from '../../models/gasto.model';
import { ICONOS_METODO } from '../../models/movimiento.model';
import type { Repostaje, RepostajeRegistro } from '../../models/vehiculo.model';
import { CategoriaService } from '../../services/categoria.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { pedirNombreCategoria } from '../../shared/pedir-nombre-categoria';
import { monedaActual, simboloMoneda } from '../../core/moneda';

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: monedaActual() });

/** Los tres valores que se calculan entre sí: con dos, sale el tercero. */
type Cantidad = 'precioTotal' | 'precioLitro' | 'litros';

/** Categoría que suele usarse para combustible, si el usuario aún no ha elegido ninguna en este vehículo. */
const CATEGORIA_PROBABLE = /combust|gasolin|gasóleo|gasoil|diesel|diésel|coche|veh[ií]cul/i;

const redondear = (valor: number, decimales: number): number => Number(valor.toFixed(decimales));

/** Fecha local sin hora: "2026-11-04". */
function fechaLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** 'gasto-normal': desde un ticket escaneado, el usuario prefiere guardarlo como gasto normal. */
export type ResultadoRepostaje = 'guardado' | 'eliminado' | 'gasto-normal';

/** Abre la hoja de repostaje (nuevo si no se pasa `repostaje`). `kilometrosActuales` orienta la corrección de km. */
export async function abrirFormularioRepostaje(
  modalController: ModalController,
  vehiculoId: number,
  kilometrosActuales: number | null,
  repostaje: Repostaje | null = null,
  ticket: TicketEscaneado | null = null,
): Promise<ResultadoRepostaje | null> {
  const modal = await modalController.create({
    component: RepostajeFormComponent,
    componentProps: { vehiculoId, kilometrosActuales, repostaje, ticket },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  return role === 'guardado' || role === 'eliminado' || role === 'gasto-normal' ? role : null;
}

/**
 * Hoja de repostaje: importe, precio por litro y litros (con dos se calcula el tercero), km del trip
 * del depósito anterior, depósito lleno y los datos del ordenador del coche. Crea o edita también su gasto.
 */
@Component({
  selector: 'app-repostaje-form',
  templateUrl: 'repostaje-form.component.html',
  styleUrls: ['repostaje-form.component.scss'],
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    FotoTicketComponent,
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
export class RepostajeFormComponent implements OnInit {
  /** Símbolo de la moneda elegida para el campo de importe. */
  readonly simboloMoneda = simboloMoneda();

  private readonly vehiculoService = inject(VehiculoService);
  private readonly ticketService = inject(TicketService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly destroyRef = inject(DestroyRef);

  // `componentProps` del modal asigna las propiedades directamente: con input() de señal las sustituiría
  @Input() vehiculoId = 0;
  @Input() kilometrosActuales: number | null = null;
  /** Ticket escaneado: rellena la hoja y su foto se guarda con el gasto del registro. */
  @Input() ticket: TicketEscaneado | null = null;
  @Input() repostaje: Repostaje | null = null;

  readonly metodos = METODOS_PAGO;
  readonly iconosMetodo = ICONOS_METODO;
  readonly categorias = signal<Categoria[]>([]);
  readonly cargandoCategorias = signal(true);
  readonly enviando = signal(false);

  // Mismas validaciones que el backend (RepostajeRegistroDTO)
  readonly formulario = inject(NonNullableFormBuilder).group({
    precioTotal: [null as number | null, [Validators.required, Validators.min(0.01)]],
    precioLitro: [null as number | null, [Validators.required, Validators.min(0.001)]],
    litros: [null as number | null, [Validators.required, Validators.min(0.01)]],
    kilometrosRecorridos: [null as number | null, [Validators.required, Validators.min(1)]],
    lleno: [true],
    cuentakilometros: [null as number | null, Validators.min(0)],
    consumoOrdenador: [null as number | null, Validators.min(0)],
    velocidadMedia: [null as number | null, Validators.min(0)],
    fecha: [fechaLocal(), Validators.required],
    notas: ['', Validators.maxLength(500)],
    categoriaId: [null as number | null, Validators.required],
    metodoPago: ['TARJETA' as MetodoPago, Validators.required],
  });

  /** Las dos cantidades escritas más recientemente; la tercera se calcula a partir de ellas. */
  private ultimasEscritas: Cantidad[] = [];
  private calculando = false;

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
      pricetagOutline,
      speedometerOutline,
      trashOutline,
      waterOutline,
    });
  }

  ngOnInit(): void {
    const r = this.repostaje;
    if (r) {
      this.formulario.setValue({
        precioTotal: r.precioTotal,
        precioLitro: r.precioLitro,
        litros: r.litros,
        kilometrosRecorridos: r.kilometrosRecorridos,
        lleno: r.lleno,
        cuentakilometros: r.cuentakilometros,
        consumoOrdenador: r.consumoOrdenador,
        velocidadMedia: r.velocidadMedia,
        fecha: r.fecha,
        notas: r.notas ?? '',
        categoriaId: r.categoriaId,
        metodoPago: r.metodoPago,
      });
      // Repostajes antiguos sin trip: basta con su lectura del cuentakilómetros
      if (r.kilometrosRecorridos === null) {
        this.formulario.controls.kilometrosRecorridos.clearValidators();
        this.formulario.controls.kilometrosRecorridos.updateValueAndValidity();
      }
      this.ultimasEscritas = ['precioTotal', 'litros'];
    } else if (this.ticket) {
      this.rellenarDesdeTicket();
    }

    for (const cantidad of ['precioTotal', 'precioLitro', 'litros'] as Cantidad[]) {
      this.formulario.controls[cantidad].valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.alEscribir(cantidad));
    }

    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargandoCategorias.set(false);
        if (!r) {
          this.formulario.controls.categoriaId.setValue(
            this.ticket?.lectura.categoriaId ?? this.categoriaPorDefecto(categorias),
          );
        }
      },
      error: (error: unknown) => {
        this.cargandoCategorias.set(false);
        void this.avisos.errorHttp(error);
      },
    });
  }

  invalido(control: 'precioTotal' | 'precioLitro' | 'litros' | 'kilometrosRecorridos' | 'categoriaId'): boolean {
    const c = this.formulario.controls[control];
    return c.invalid && c.touched;
  }

  /** Consumo que saldrá con lo escrito (si el depósito anterior también se llenó). */
  consumoEstimado(): number | null {
    const v = this.formulario.getRawValue();
    const km = Number(v.kilometrosRecorridos);
    const litros = Number(v.litros);
    return v.lleno && km > 0 && litros > 0 ? redondear((litros * 100) / km, 2) : null;
  }

  /** Diferencia del consumo real con el que marca el coche, en % (positiva: el coche marca menos). */
  diferenciaOrdenador(): number | null {
    const real = this.consumoEstimado();
    const coche = Number(this.formulario.controls.consumoOrdenador.value);
    return real !== null && coche > 0 ? Math.round(((real - coche) / coche) * 100) : null;
  }

  importeTexto(): string {
    const importe = Number(this.formulario.controls.precioTotal.value);
    return importe > 0 ? FORMATO_EUROS.format(importe) : '';
  }

  elegirCategoria(id: number): void {
    this.formulario.controls.categoriaId.setValue(id);
    this.formulario.controls.categoriaId.markAsTouched();
  }

  async nuevaCategoria(): Promise<void> {
    const nombre = await pedirNombreCategoria(this.alertController, 'Combustible');
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

  /** Desde un ticket escaneado: guardarlo como gasto normal en vez de como registro del vehículo. */
  comoGastoNormal(): void {
    void this.modalController.dismiss(null, 'gasto-normal');
  }

  /** Tras crear el registro, la foto del ticket se guarda dentro de su gasto. */
  private conTicket<T extends { gastoId: number | null }>(peticion: Observable<T>): Observable<unknown> {
    const ticket = this.ticket;
    if (!ticket) {
      return peticion;
    }
    return peticion.pipe(
      switchMap((creado) =>
        creado.gastoId === null
          ? of(creado)
          : this.ticketService.adjuntar(creado.gastoId, ticket.foto, ticket.lectura.comercio),
      ),
    );
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const numero = (valor: number | null) => (valor === null || (valor as unknown) === '' ? null : Number(valor));
    const datos: RepostajeRegistro = {
      fecha: v.fecha.substring(0, 10),
      litros: Number(v.litros),
      precioTotal: Number(v.precioTotal),
      precioLitro: Number(v.precioLitro),
      kilometrosRecorridos: numero(v.kilometrosRecorridos),
      cuentakilometros: numero(v.cuentakilometros),
      lleno: v.lleno,
      consumoOrdenador: numero(v.consumoOrdenador),
      velocidadMedia: numero(v.velocidadMedia),
      notas: v.notas.trim() || null,
      categoriaId: v.categoriaId as number,
      metodoPago: v.metodoPago,
    };
    this.recordarCategoria(datos.categoriaId);
    const r = this.repostaje;
    this.ejecutar(
      r
        ? this.vehiculoService.actualizarRepostaje(this.vehiculoId, r.id, datos)
        : this.conTicket(this.vehiculoService.crearRepostaje(this.vehiculoId, datos)),
      'guardado',
    );
  }

  async eliminar(): Promise<void> {
    const r = this.repostaje;
    if (!r) {
      return;
    }
    const alerta = await this.alertController.create({
      header: '¿Eliminar este repostaje?',
      message: `${FORMATO_EUROS.format(r.precioTotal)} · ${r.litros} L. También se borra su gasto. No se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'destructive') {
      this.ejecutar(this.vehiculoService.eliminarRepostaje(this.vehiculoId, r.id), 'eliminado');
    }
  }

  /** Lo leído en el ticket: cantidades (la que falte se calcula con las otras dos), fecha, pago y gasolinera. */
  private rellenarDesdeTicket(): void {
    const l = this.ticket?.lectura;
    if (!l) {
      return;
    }
    const c = this.formulario.controls;
    // Antes de que se suscriba alEscribir: se fijan tal cual y se recuerdan como escritas
    if (l.precioLitro !== null) {
      c.precioLitro.setValue(l.precioLitro);
    }
    if (l.litros !== null) {
      c.litros.setValue(l.litros);
    }
    if (l.importe !== null) {
      c.precioTotal.setValue(l.importe);
    }
    this.ultimasEscritas = (['precioTotal', 'litros', 'precioLitro'] as Cantidad[])
      .filter((x) => c[x].value !== null)
      .slice(0, 2);
    if (l.fecha) {
      c.fecha.setValue(l.fecha);
    }
    if (l.metodoPago) {
      c.metodoPago.setValue(l.metodoPago);
    }
    if (l.comercio) {
      c.notas.setValue(l.comercio);
    }
  }

  /** Recalcula la cantidad que no está entre las dos últimas escritas. */
  private alEscribir(cantidad: Cantidad): void {
    if (this.calculando) {
      return;
    }
    this.ultimasEscritas = [cantidad, ...this.ultimasEscritas.filter((c) => c !== cantidad)].slice(0, 2);
    if (this.ultimasEscritas.length < 2) {
      return;
    }
    const c = this.formulario.controls;
    const total = Number(c.precioTotal.value);
    const precio = Number(c.precioLitro.value);
    const litros = Number(c.litros.value);
    const calcular = (['precioTotal', 'precioLitro', 'litros'] as Cantidad[]).find(
      (x) => !this.ultimasEscritas.includes(x),
    );
    let valor: number | null = null;
    if (calcular === 'precioTotal' && precio > 0 && litros > 0) {
      valor = redondear(precio * litros, 2);
    } else if (calcular === 'precioLitro' && total > 0 && litros > 0) {
      valor = redondear(total / litros, 3);
    } else if (calcular === 'litros' && total > 0 && precio > 0) {
      valor = redondear(total / precio, 2);
    }
    if (calcular && valor !== null) {
      this.calculando = true;
      c[calcular].setValue(valor);
      this.calculando = false;
    }
  }

  private claveCategoria(): string {
    return `mf.repostaje.categoria.${this.vehiculoId}`;
  }

  /** La última usada en este vehículo; si no, una que parezca de combustible; si solo hay una, esa. */
  private categoriaPorDefecto(categorias: Categoria[]): number | null {
    try {
      const guardada = Number(localStorage.getItem(this.claveCategoria()));
      if (categorias.some((c) => c.id === guardada)) {
        return guardada;
      }
    } catch {
      // Sin acceso al almacenamiento: se sigue con las demás opciones
    }
    return (
      categorias.find((c) => CATEGORIA_PROBABLE.test(c.nombre))?.id ??
      (categorias.length === 1 ? categorias[0].id : null)
    );
  }

  private recordarCategoria(id: number): void {
    try {
      localStorage.setItem(this.claveCategoria(), String(id));
    } catch {
      // Solo es una comodidad: si no se puede guardar no pasa nada
    }
  }

  private ejecutar(peticion: Observable<unknown>, resultado: ResultadoRepostaje): void {
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
