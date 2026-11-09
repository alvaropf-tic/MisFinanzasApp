import { DecimalPipe } from '@angular/common';
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
  constructOutline,
  createOutline,
  discOutline,
  documentTextOutline,
  flaskOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  speedometerOutline,
  trashOutline,
} from 'ionicons/icons';
import { type Observable, of, switchMap } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import type { TicketEscaneado } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';
import { FotoTicketComponent } from '../../shared/foto-ticket/foto-ticket.component';
import type { Categoria } from '../../models/categoria.model';
import { METODOS_PAGO, type MetodoPago } from '../../models/gasto.model';
import { ICONOS_METODO } from '../../models/movimiento.model';
import {
  POSICIONES_NEUMATICOS,
  type PosicionNeumaticos,
  RESULTADOS_ITV,
  type RegistroVehiculo,
  type RegistroVehiculoDatos,
  type ResultadoItv,
  TIPOS_MANTENIMIENTO,
  type TipoMantenimiento,
  type TipoRegistro,
} from '../../models/vehiculo.model';
import { CategoriaService } from '../../services/categoria.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { pedirNombreCategoria } from '../../shared/pedir-nombre-categoria';
import { monedaActual, simboloMoneda } from '../../core/moneda';

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: monedaActual() });

/** Textos e icono de cada tipo de registro (el icono también se usa en el historial del vehículo). */
export const TIPOS_REGISTRO: Record<TipoRegistro, { nombre: string; icono: string; editar: string }> = {
  aceite: { nombre: 'Cambio de aceite', icono: 'flask-outline', editar: 'Editar cambio de aceite' },
  neumatico: { nombre: 'Neumáticos', icono: 'disc-outline', editar: 'Editar neumáticos' },
  mantenimiento: { nombre: 'Mantenimiento', icono: 'construct-outline', editar: 'Editar mantenimiento' },
  itv: { nombre: 'ITV', icono: 'shield-checkmark-outline', editar: 'Editar ITV' },
};

/** Categoría que suele usarse para el mantenimiento del vehículo, si aún no se ha elegido ninguna. */
const CATEGORIA_PROBABLE = /mantenim|taller|revisi|coche|veh[ií]cul|moto/i;

/** Fecha local sin hora: "2026-11-07". */
function fechaLocal(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** 'gasto-normal': desde un ticket escaneado, el usuario prefiere guardarlo como gasto normal. */
export type ResultadoRegistro = 'guardado' | 'eliminado' | 'gasto-normal';

/** Abre la hoja de un registro (nuevo si no se pasa `registro`). Los km se proponen con los actuales del vehículo. */
export async function abrirFormularioRegistro(
  modalController: ModalController,
  tipo: TipoRegistro,
  vehiculoId: number,
  kilometrosActuales: number | null,
  registro: RegistroVehiculo | null = null,
  ticket: TicketEscaneado | null = null,
): Promise<ResultadoRegistro | null> {
  const modal = await modalController.create({
    component: RegistroVehiculoFormComponent,
    componentProps: { tipo, vehiculoId, kilometrosActuales, registro, ticket },
    breakpoints: [0, 1],
    initialBreakpoint: 1,
    handle: true,
  });
  await modal.present();
  const { role } = await modal.onWillDismiss();
  return role === 'guardado' || role === 'eliminado' || role === 'gasto-normal' ? role : null;
}

/**
 * Hoja común de los registros de vehículo que no son repostajes: cambio de aceite, neumáticos,
 * mantenimiento o avería e ITV. Comparten precio, km, fecha, notas, categoría y método; cada uno
 * añade lo suyo (posición, tipo y título, resultado). Crea o edita también su gasto.
 */
@Component({
  selector: 'app-registro-vehiculo-form',
  templateUrl: 'registro-vehiculo-form.component.html',
  styleUrls: ['registro-vehiculo-form.component.scss'],
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
  ],
})
export class RegistroVehiculoFormComponent implements OnInit {
  /** Símbolo de la moneda elegida para el campo de importe. */
  readonly simboloMoneda = simboloMoneda();

  private readonly vehiculoService = inject(VehiculoService);
  private readonly ticketService = inject(TicketService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);

  // `componentProps` del modal asigna las propiedades directamente: con input() de señal las sustituiría
  @Input() tipo: TipoRegistro = 'aceite';
  @Input() vehiculoId = 0;
  @Input() kilometrosActuales: number | null = null;
  /** Ticket escaneado: rellena la hoja y su foto se guarda con el gasto del registro. */
  @Input() ticket: TicketEscaneado | null = null;
  @Input() registro: RegistroVehiculo | null = null;

  readonly metodos = METODOS_PAGO;
  readonly iconosMetodo = ICONOS_METODO;
  readonly posiciones = Object.entries(POSICIONES_NEUMATICOS) as [PosicionNeumaticos, string][];
  readonly tiposMantenimiento = Object.entries(TIPOS_MANTENIMIENTO) as [TipoMantenimiento, string][];
  readonly resultadosItv = Object.entries(RESULTADOS_ITV) as [ResultadoItv, string][];

  readonly categorias = signal<Categoria[]>([]);
  readonly cargandoCategorias = signal(true);
  readonly enviando = signal(false);

  // Mismas validaciones que el backend (AceiteRegistroDTO, NeumaticoRegistroDTO…)
  readonly formulario = inject(NonNullableFormBuilder).group({
    precio: [null as number | null, [Validators.required, Validators.min(0)]],
    kilometros: [null as number | null, [Validators.required, Validators.min(0)]],
    fecha: [fechaLocal(), Validators.required],
    notas: ['', Validators.maxLength(500)],
    categoriaId: [null as number | null, Validators.required],
    metodoPago: ['TARJETA' as MetodoPago, Validators.required],
    posicion: ['DELANTEROS' as PosicionNeumaticos],
    tipoMantenimiento: ['MANTENIMIENTO' as TipoMantenimiento],
    titulo: ['', Validators.maxLength(100)],
    descripcion: ['', Validators.maxLength(500)],
    resultado: ['FAVORABLE' as ResultadoItv],
  });

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      cardOutline,
      cashOutline,
      checkmarkOutline,
      closeOutline,
      constructOutline,
      createOutline,
      discOutline,
      documentTextOutline,
      flaskOutline,
      phonePortraitOutline,
      shieldCheckmarkOutline,
      speedometerOutline,
      trashOutline,
    });
  }

  get textos(): (typeof TIPOS_REGISTRO)[TipoRegistro] {
    return TIPOS_REGISTRO[this.tipo];
  }

  ngOnInit(): void {
    if (this.tipo === 'mantenimiento') {
      this.formulario.controls.titulo.addValidators(Validators.required);
    }
    const r = this.registro;
    if (r) {
      this.formulario.patchValue({
        precio: r.precio,
        kilometros: r.kilometros,
        fecha: r.fecha,
        notas: r.notas ?? '',
        categoriaId: r.categoriaId,
        metodoPago: r.metodoPago,
      });
      if (r.tipoRegistro === 'neumatico') {
        this.formulario.patchValue({ posicion: r.posicion });
      } else if (r.tipoRegistro === 'mantenimiento') {
        this.formulario.patchValue({ tipoMantenimiento: r.tipo, titulo: r.titulo, descripcion: r.descripcion ?? '' });
      } else if (r.tipoRegistro === 'itv') {
        this.formulario.patchValue({ resultado: r.resultado });
      }
    } else {
      if (this.kilometrosActuales !== null) {
        this.formulario.controls.kilometros.setValue(this.kilometrosActuales);
      }
      const l = this.ticket?.lectura;
      if (l) {
        // Lo que trae el ticket; los km, el resultado de la ITV o el título los pone el usuario
        this.formulario.patchValue({
          ...(l.importe !== null ? { precio: l.importe } : {}),
          ...(l.fecha ? { fecha: l.fecha } : {}),
          ...(l.metodoPago ? { metodoPago: l.metodoPago } : {}),
          ...(l.comercio ? { notas: l.comercio } : {}),
        });
      }
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

  invalido(control: 'precio' | 'kilometros' | 'titulo' | 'categoriaId'): boolean {
    const c = this.formulario.controls[control];
    return c.invalid && c.touched;
  }

  /** "Guardar · 45,00 €" (sin importe mientras no se haya escrito). */
  textoGuardar(): string {
    const valor = this.formulario.controls.precio.value;
    return valor === null || (valor as unknown) === '' ? 'Guardar' : `Guardar · ${FORMATO_EUROS.format(Number(valor))}`;
  }

  elegirCategoria(id: number): void {
    this.formulario.controls.categoriaId.setValue(id);
    this.formulario.controls.categoriaId.markAsTouched();
  }

  async nuevaCategoria(): Promise<void> {
    const nombre = await pedirNombreCategoria(this.alertController, 'Mantenimiento coche');
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
    const datos: RegistroVehiculoDatos = {
      fecha: v.fecha.substring(0, 10),
      kilometros: Math.round(Number(v.kilometros)),
      precio: Number(v.precio),
      notas: v.notas.trim() || null,
      categoriaId: v.categoriaId as number,
      metodoPago: v.metodoPago,
    };
    if (this.tipo === 'neumatico') {
      datos.posicion = v.posicion;
    } else if (this.tipo === 'mantenimiento') {
      datos.tipo = v.tipoMantenimiento;
      datos.titulo = v.titulo.trim();
      datos.descripcion = v.descripcion.trim() || null;
    } else if (this.tipo === 'itv') {
      datos.resultado = v.resultado;
    }
    this.recordarCategoria(datos.categoriaId);
    const r = this.registro;
    this.ejecutar(
      r
        ? this.vehiculoService.actualizarRegistro(this.vehiculoId, this.tipo, r.id, datos)
        : this.conTicket(this.vehiculoService.crearRegistro(this.vehiculoId, this.tipo, datos)),
      'guardado',
    );
  }

  async eliminar(): Promise<void> {
    const r = this.registro;
    if (!r) {
      return;
    }
    const alerta = await this.alertController.create({
      header: '¿Eliminar este registro?',
      message: `${this.textos.nombre} · ${FORMATO_EUROS.format(r.precio)}. También se borra su gasto. No se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role === 'destructive') {
      this.ejecutar(this.vehiculoService.eliminarRegistro(this.vehiculoId, this.tipo, r.id), 'eliminado');
    }
  }

  /** Aceite, neumáticos, mantenimiento e ITV suelen ir a la misma categoría: se recuerda una por vehículo. */
  private claveCategoria(): string {
    return `mf.vehiculo.categoria.${this.vehiculoId}`;
  }

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

  private ejecutar(peticion: Observable<unknown>, resultado: ResultadoRegistro): void {
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
