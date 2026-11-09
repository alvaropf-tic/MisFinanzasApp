import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, type OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ModalController,
  NavController,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  cloudOfflineOutline,
  constructOutline,
  createOutline,
  discOutline,
  flaskOutline,
  listOutline,
  shieldCheckmarkOutline,
  waterOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { AvisoService } from '../../core/aviso.service';
import { esNoAutorizado } from '../../core/mensaje-error';
import {
  POSICIONES_NEUMATICOS,
  RESULTADOS_ITV,
  type RegistroVehiculo,
  type Repostaje,
  type ResumenVehiculo,
  TIPOS_MANTENIMIENTO,
  type TipoRegistro,
  type Vehiculo,
} from '../../models/vehiculo.model';
import { TicketService } from '../../services/ticket.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { TIPOS_REGISTRO, abrirFormularioRegistro } from '../registro-vehiculo-form/registro-vehiculo-form.component';
import { abrirFormularioRepostaje } from '../repostaje-form/repostaje-form.component';
import { MENSAJES_VEHICULO, abrirFormularioVehiculo } from '../vehiculo-form/vehiculo-form.component';
import { monedaActual, simboloMoneda } from '../../core/moneda';
import { CabeceraPantallaComponent } from '../../shared/cabecera-pantalla/cabecera-pantalla.component';

/** Cualquier registro del vehículo: los repostajes y los otros cuatro tipos. */
type TipoHistorial = 'repostaje' | TipoRegistro;

/** Fila del historial, ya con sus textos. `registro` es el original para abrir su hoja. */
interface ElementoHistorial {
  clave: string;
  tipo: TipoHistorial;
  fecha: string;
  id: number;
  icono: string;
  titulo: string;
  detalle: string;
  importe: number;
  registro: Repostaje | RegistroVehiculo;
}

/** Opciones del "+" y de los chips de filtro, en este orden. */
const TIPOS_HISTORIAL: { tipo: TipoHistorial; nombre: string; icono: string }[] = [
  { tipo: 'repostaje', nombre: 'Repostaje', icono: 'water-outline' },
  ...(Object.entries(TIPOS_REGISTRO) as [TipoRegistro, (typeof TIPOS_REGISTRO)[TipoRegistro]][]).map(([tipo, t]) => ({
    tipo,
    nombre: tipo === 'aceite' ? 'Aceite' : t.nombre,
    icono: t.icono,
  })),
];

const TIPOS_DE_REGISTRO: TipoRegistro[] = ['aceite', 'neumatico', 'mantenimiento', 'itv'];

/** Detalle de un vehículo: cifras (km, consumo, costes) e historial de todos sus registros. */
@Component({
  selector: 'app-vehiculo-detalle',
  templateUrl: 'vehiculo-detalle.page.html',
  styleUrls: ['vehiculo-detalle.page.scss'],
  imports: [
    CabeceraPantallaComponent,
    CurrencyPipe,
    DecimalPipe,
    EmptyStateComponent,
    IonButton,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonModal,
    IonIcon,
    IonSpinner,
  ],
})
export class VehiculoDetallePage implements OnInit {
  private readonly vehiculoService = inject(VehiculoService);
  private readonly ticketService = inject(TicketService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly navController = inject(NavController);

  /** Parámetro `:id` de la ruta. */
  readonly id = input.required<string>();

  readonly vehiculo = signal<Vehiculo | null>(null);
  readonly resumen = signal<ResumenVehiculo | null>(null);
  readonly repostajes = signal<Repostaje[]>([]);
  readonly registros = signal<RegistroVehiculo[]>([]);
  readonly cargandoInicial = signal(true);
  readonly errorCarga = signal(false);

  readonly tiposHistorial = TIPOS_HISTORIAL;
  readonly filtro = signal<'todos' | TipoHistorial>('todos');
  /** Modal del "+" para elegir qué registrar. */
  readonly eligiendoTipo = signal(false);

  /** Todos los registros por fecha (más reciente primero), con sus textos. */
  private readonly todos = computed<ElementoHistorial[]>(() =>
    [...this.repostajes().map((r) => this.deRepostaje(r)), ...this.registros().map((r) => this.deRegistro(r))].sort(
      (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id,
    ),
  );
  readonly historial = computed(() => {
    const filtro = this.filtro();
    return filtro === 'todos' ? this.todos() : this.todos().filter((e) => e.tipo === filtro);
  });
  /** Chips de filtro: solo los tipos que tienen algún registro. */
  readonly filtros = computed(() => {
    const presentes = new Set(this.todos().map((e) => e.tipo));
    return TIPOS_HISTORIAL.filter((t) => presentes.has(t.tipo));
  });

  constructor() {
    addIcons({
      add,
      cloudOfflineOutline,
      constructOutline,
      createOutline,
      discOutline,
      flaskOutline,
      listOutline,
      shieldCheckmarkOutline,
      waterOutline,
    });

    let primeraVez = true;
    effect(() => {
      this.vehiculoService.cambios();
      // La foto de un ticket escaneado se guarda justo después de crear el registro
      this.ticketService.cambios();
      if (primeraVez) {
        primeraVez = false;
        return;
      }
      untracked(() => void this.cargar());
    });
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    const id = Number(this.id());
    this.errorCarga.set(false);
    try {
      const [vehiculo, resumen, repostajes, ...registros] = await Promise.all([
        firstValueFrom(this.vehiculoService.obtener(id)),
        firstValueFrom(this.vehiculoService.resumen(id)),
        firstValueFrom(this.vehiculoService.repostajes(id)),
        ...TIPOS_DE_REGISTRO.map((tipo) => firstValueFrom(this.vehiculoService.registros(id, tipo))),
      ]);
      this.vehiculo.set(vehiculo);
      this.resumen.set(resumen);
      this.repostajes.set(repostajes);
      this.registros.set(registros.flat());
      // Si el tipo filtrado se ha quedado sin registros (p. ej. al borrar el último), se vuelve a "Todos"
      const filtro = this.filtro();
      if (filtro !== 'todos' && !this.filtros().some((f) => f.tipo === filtro)) {
        this.filtro.set('todos');
      }
    } catch (error) {
      this.errorCarga.set(!esNoAutorizado(error) && this.vehiculo() === null);
      void this.avisos.errorHttp(error);
    } finally {
      this.cargandoInicial.set(false);
    }
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await this.cargar();
    await evento.target.complete();
  }

  async editarVehiculo(): Promise<void> {
    const resultado = await abrirFormularioVehiculo(this.modalController, this.vehiculo());
    if (!resultado) {
      return;
    }
    void this.avisos.exito(MENSAJES_VEHICULO[resultado]);
    if (resultado === 'eliminado') {
      await this.navController.navigateBack('/vehiculos');
    }
  }

  /** Opción elegida en el modal del "+". */
  async nuevo(tipo: TipoHistorial): Promise<void> {
    this.eligiendoTipo.set(false);
    await this.abrirHoja(tipo, null);
  }

  async abrir(elemento: ElementoHistorial): Promise<void> {
    await this.abrirHoja(elemento.tipo, elemento.registro);
  }

  private async abrirHoja(tipo: TipoHistorial, registro: Repostaje | RegistroVehiculo | null): Promise<void> {
    const vehiculoId = Number(this.id());
    const kilometros = this.resumen()?.kilometrosActuales ?? null;
    const resultado =
      tipo === 'repostaje'
        ? await abrirFormularioRepostaje(this.modalController, vehiculoId, kilometros, registro as Repostaje | null)
        : await abrirFormularioRegistro(
            this.modalController,
            tipo,
            vehiculoId,
            kilometros,
            registro as RegistroVehiculo | null,
          );
    if (resultado) {
      const nombre = TIPOS_HISTORIAL.find((t) => t.tipo === tipo)?.nombre ?? 'Registro';
      void this.avisos.exito(`${nombre}: ${resultado === 'guardado' ? 'guardado' : 'eliminado'}`);
    }
  }

  /** Importe con 3 decimales ("0,094 €") o una raya si no hay datos. */
  euros(valor: number | null): string {
    return valor === null
      ? '—'
      : valor.toLocaleString('es-ES', { style: 'currency', currency: monedaActual(), minimumFractionDigits: 3 });
  }

  /** Día y mes abreviado de una fecha sin hora, leída como local. */
  fecha(fecha: string): { dia: number; mes: string } {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return { dia, mes: new Date(anio, mes - 1, dia).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') };
  }

  private deRepostaje(r: Repostaje): ElementoHistorial {
    const numero = (n: number, decimales: number) =>
      n.toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    const partes: string[] = [];
    const km = r.kilometrosTramo ?? r.kilometrosRecorridos;
    if (km !== null) {
      partes.push(`${km.toLocaleString('es-ES')} km`);
    }
    if (!r.lleno) {
      partes.push('Parcial');
    } else if (r.consumoReal !== null) {
      partes.push(`Real ${numero(r.consumoReal, 2)} l/100`);
    }
    if (r.consumoOrdenador !== null) {
      partes.push(`Coche ${numero(r.consumoOrdenador, 1)}`);
    }
    if (r.velocidadMedia !== null) {
      partes.push(`${numero(r.velocidadMedia, 0)} km/h`);
    }
    return {
      clave: `repostaje:${r.id}`,
      tipo: 'repostaje',
      fecha: r.fecha,
      id: r.id,
      icono: 'water-outline',
      titulo: `${numero(r.litros, 2)} L · ${numero(r.precioLitro, 3)} ${simboloMoneda()}/L`,
      detalle: partes.join(' · '),
      importe: r.precioTotal,
      registro: r,
    };
  }

  private deRegistro(r: RegistroVehiculo): ElementoHistorial {
    const km = `${r.kilometros.toLocaleString('es-ES')} km`;
    let titulo: string;
    let detalle = km;
    switch (r.tipoRegistro) {
      case 'aceite':
        titulo = 'Cambio de aceite';
        break;
      case 'neumatico':
        titulo = `Neumáticos · ${POSICIONES_NEUMATICOS[r.posicion]}`;
        break;
      case 'mantenimiento':
        titulo = r.titulo;
        detalle = `${TIPOS_MANTENIMIENTO[r.tipo]} · ${km}`;
        break;
      case 'itv':
        titulo = `ITV · ${RESULTADOS_ITV[r.resultado]}`;
        break;
    }
    return {
      clave: `${r.tipoRegistro}:${r.id}`,
      tipo: r.tipoRegistro,
      fecha: r.fecha,
      id: r.id,
      icono: TIPOS_REGISTRO[r.tipoRegistro].icono,
      titulo,
      detalle: r.notas ? `${detalle} · ${r.notas}` : detalle,
      importe: r.precio,
      registro: r,
    };
  }
}
