import { CurrencyPipe } from '@angular/common';
import { Component, type OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  type InfiniteScrollCustomEvent,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  ModalController,
  NavController,
  type RefresherCustomEvent,
  type SegmentCustomEvent,
  type SelectCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  cloudOfflineOutline,
  filterOutline,
  repeatOutline,
  scanOutline,
  trendingDownOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import { MovementCardComponent } from '../../components/movement-card/movement-card.component';
import { AvisoService } from '../../core/aviso.service';
import type { Categoria } from '../../models/categoria.model';
import { type Movimiento, type TipoMovimiento, esGasto } from '../../models/movimiento.model';
import type { ResumenRecurrentes, ResumenRecurrentesMes } from '../../models/recurrente.model';
import { CategoriaIngresoService } from '../../services/categoria-ingreso.service';
import { CategoriaService } from '../../services/categoria.service';
import { GastoService } from '../../services/gasto.service';
import { IngresoService } from '../../services/ingreso.service';
import { EscanerTicketService } from '../../services/escaner-ticket.service';
import { RecurrenteService } from '../../services/recurrente.service';
import { RegistroGastoService } from '../../services/registro-gasto.service';
import { TicketService } from '../../services/ticket.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { CabeceraComponent } from '../../shared/cabecera/cabecera.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { ListaMovimientos, type PedirPagina } from '../../shared/lista-movimientos';
import {
  ORIGENES_VEHICULO,
  abrirFormularioMovimiento,
  mensajeMovimiento,
} from '../movimiento-form/movimiento-form.component';
import { abrirFormularioRecurrente, mensajeRecurrente } from '../recurrente-form/recurrente-form.component';
import { monedaActual } from '../../core/moneda';

const TAMANIO_PAGINA = 20;

type FiltroTipo = 'todos' | TipoMovimiento;

/** Opción del filtro de categoría; `valor` es "gasto:3" o "ingreso:1" porque los ids se repiten entre tipos. */
interface OpcionCategoria {
  valor: string;
  etiqueta: string;
}

/** Pestaña Finanzas: gastos e ingresos en una sola lista cronológica; el icono de filtro limita por tipo y categoría. */
@Component({
  selector: 'app-finanzas',
  templateUrl: 'finanzas.page.html',
  styleUrls: ['finanzas.page.scss'],
  imports: [
    CurrencyPipe,
    RouterLink,
    MovementCardComponent,
    CabeceraComponent,
    EmptyStateComponent,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonModal,
    IonSpinner,
    IonText,
  ],
})
export class FinanzasPage implements OnInit {
  private readonly gastoService = inject(GastoService);
  private readonly ingresoService = inject(IngresoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly categoriaIngresoService = inject(CategoriaIngresoService);
  private readonly avisos = inject(AvisoService);
  private readonly modalController = inject(ModalController);
  private readonly navController = inject(NavController);
  private readonly recurrenteService = inject(RecurrenteService);
  private readonly ticketService = inject(TicketService);
  private readonly escaner = inject(EscanerTicketService);
  private readonly registroGasto = inject(RegistroGastoService);
  private readonly vehiculoService = inject(VehiculoService);

  readonly lista = new ListaMovimientos((error) => void this.avisos.errorHttp(error));

  /** Filtros aplicados a la lista. */
  readonly tipo = signal<FiltroTipo>('todos');
  /** Categoría aplicada ("gasto:3", "ingreso:1") o '' para todas. */
  readonly categoria = signal('');
  readonly hayFiltros = computed(() => this.tipo() !== 'todos' || this.categoria() !== '');
  /** Resumen de los filtros aplicados para la línea sobre la lista, p. ej. "Gastos · Comida". */
  readonly resumenFiltros = computed(() => {
    const partes = [];
    if (this.tipo() !== 'todos') {
      partes.push(this.tipo() === 'gasto' ? 'Gastos' : 'Ingresos');
    }
    const [de, id] = this.categoria().split(':');
    const categorias = de === 'gasto' ? this.categoriasGasto() : this.categoriasIngreso();
    const nombre = categorias.find((c) => c.id === Number(id))?.nombre;
    if (nombre) {
      partes.push(nombre);
    }
    return partes.join(' · ');
  });
  /** Estado vacío: distinto si no hay nada todavía o si es que los filtros no dejan nada. */
  readonly vacio = computed(() =>
    this.hayFiltros()
      ? {
          icono: 'filter-outline',
          titulo: 'No hay movimientos con estos filtros',
          mensaje: 'Prueba con otro tipo u otra categoría.',
        }
      : {
          icono: 'wallet-outline',
          titulo: 'Todavía no hay movimientos',
          mensaje: 'Pulsa + para registrar tu primer gasto o ingreso.',
        },
  );

  /** Lo que se va eligiendo en el modal de filtros; no se aplica hasta pulsar Aplicar. */
  readonly filtrando = signal(false);
  readonly borradorTipo = signal<FiltroTipo>('todos');
  readonly borradorCategoria = signal('');

  private readonly categoriasGasto = signal<Categoria[]>([]);
  private readonly categoriasIngreso = signal<Categoria[]>([]);
  /** Con "Todos" se ofrecen las categorías de los dos tipos, marcando a cuál pertenece cada una. */
  readonly opcionesCategoria = computed<OpcionCategoria[]>(() => {
    const tipo = this.borradorTipo();
    const opciones = (lista: Categoria[], de: TipoMovimiento): OpcionCategoria[] =>
      lista.map((c) => ({
        valor: `${de}:${c.id}`,
        etiqueta: tipo === 'todos' ? `${c.nombre} (${de})` : c.nombre,
      }));
    return [
      ...(tipo !== 'ingreso' ? opciones(this.categoriasGasto(), 'gasto') : []),
      ...(tipo !== 'gasto' ? opciones(this.categoriasIngreso(), 'ingreso') : []),
    ];
  });

  readonly eligiendoTipo = signal(false);

  /** Pagos y cobros recurrentes del mes actual. */
  readonly recurrentes = signal<ResumenRecurrentesMes | null>(null);
  /**
   * Sección de recurrentes según el filtro de tipo: con «Gastos» solo los pagos, con «Ingresos» solo los cobros.
   * Cada cifra es lo que falta en el mes; `proximo` es el más cercano de los que se ven.
   */
  readonly seccionRecurrentes = computed(() => {
    const r = this.recurrentes();
    if (!r) {
      return null;
    }
    const tipo = this.tipo();
    const grupos: { resumen: ResumenRecurrentes; signo: string; etiqueta: string; clase: string }[] = [];
    if (tipo !== 'ingreso') {
      grupos.push({ resumen: r.pagos, signo: '−', etiqueta: 'Pagos pendientes', clase: 'gasto' });
    }
    if (tipo !== 'gasto') {
      grupos.push({ resumen: r.cobros, signo: '+', etiqueta: 'Cobros pendientes', clase: 'ingreso' });
    }
    const activos = grupos.reduce((n, g) => n + g.resumen.activos, 0);
    const conDatos = grupos.some((g) => g.resumen.activos > 0 || g.resumen.total > 0);
    const proximo = grupos
      .filter((g) => g.resumen.proximaFecha && g.resumen.proximoDescripcion && g.resumen.proximoImporte !== null)
      .sort((a, b) => (a.resumen.proximaFecha as string).localeCompare(b.resumen.proximaFecha as string))[0];
    return {
      activos: `${activos} ${activos === 1 ? 'activo' : 'activos'}`,
      cifras: conDatos ? grupos : [],
      proximo: proximo ? this.textoProximo(proximo.resumen, proximo.signo) : '',
    };
  });

  constructor() {
    addIcons({
      add,
      walletOutline,
      cloudOfflineOutline,
      filterOutline,
      repeatOutline,
      scanOutline,
      trendingDownOutline,
      trendingUpOutline,
    });

    // Crear, cambiar o borrar un recurrente (aquí o en Recurrentes) puede apuntar movimientos y cambia la sección
    let primeraVez = true;
    effect(() => {
      // Los registros de vehículos también crean y cambian gastos
      this.recurrenteService.cambios();
      this.vehiculoService.cambios();
      // Y los tickets que se pasan a gastos desde la pestaña IA
      this.ticketService.cambios();
      if (primeraVez) {
        primeraVez = false;
        return;
      }
      untracked(() => void Promise.all([this.recargar(), this.cargarRecurrentes(), this.cargarCategorias()]));
    });
  }

  ngOnInit(): void {
    void this.recargar();
    void this.cargarCategorias();
    void this.cargarRecurrentes();
  }

  /** Con el filtro en «Ingresos» la hoja empieza como cobro; si no, como pago (en ella se puede cambiar). */
  async nuevoRecurrente(): Promise<void> {
    const cierre = await abrirFormularioRecurrente(
      this.modalController,
      this.tipo() === 'ingreso' ? 'ingreso' : 'gasto',
    );
    if (cierre) {
      void this.avisos.exito(mensajeRecurrente(cierre));
    }
  }

  abrirFiltros(): void {
    this.borradorTipo.set(this.tipo());
    this.borradorCategoria.set(this.categoria());
    this.filtrando.set(true);
  }

  cambiarBorradorTipo(evento: SegmentCustomEvent): void {
    this.borradorTipo.set(evento.detail.value as FiltroTipo);
    // Una categoría del otro tipo ya no tiene sentido con el nuevo tipo
    if (!this.opcionesCategoria().some((o) => o.valor === this.borradorCategoria())) {
      this.borradorCategoria.set('');
    }
  }

  cambiarBorradorCategoria(evento: SelectCustomEvent<string>): void {
    this.borradorCategoria.set(evento.detail.value ?? '');
  }

  aplicarFiltros(): void {
    this.filtrando.set(false);
    this.cambiarFiltros(this.borradorTipo(), this.borradorCategoria());
  }

  quitarFiltros(): void {
    this.filtrando.set(false);
    this.cambiarFiltros('todos', '');
  }

  recargar(opciones?: { limpiar?: boolean }): Promise<void> {
    return this.lista.recargar(this.pedidores(), opciones);
  }

  async cargarMas(evento: InfiniteScrollCustomEvent): Promise<void> {
    await this.lista.cargarMas();
    await evento.target.complete();
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    await Promise.all([this.recargar(), this.cargarCategorias(), this.cargarRecurrentes()]);
    await evento.target.complete();
  }

  /** Los ids se repiten entre gastos e ingresos: la clave incluye el tipo. */
  clave(movimiento: Movimiento): string {
    return `${esGasto(movimiento) ? 'gasto' : 'ingreso'}:${movimiento.id}`;
  }

  /** «Ticket» del "+": foto → la IA rellena el gasto → revisar y guardar. El selector se abre en el mismo clic. */
  async escanear(): Promise<void> {
    const escaneo = this.escaner.escanear();
    this.eligiendoTipo.set(false);
    const mensaje = await escaneo;
    if (mensaje) {
      void this.avisos.exito(mensaje);
    }
  }

  /** Opción elegida en el modal del "+". */
  async elegir(tipo: TipoMovimiento): Promise<void> {
    this.eligiendoTipo.set(false);
    await this.abrirHoja(tipo, null);
  }

  /** Al tocar un movimiento se abre su hoja para editarlo o eliminarlo. */
  async editar(movimiento: Movimiento): Promise<void> {
    // Los gastos de vehículos se editan en su registro (repostaje, ITV…): se abre su hoja aquí mismo
    if (esGasto(movimiento) && ORIGENES_VEHICULO.includes(movimiento.origen)) {
      const mensaje = await this.registroGasto.abrir(movimiento);
      if (mensaje) {
        void this.avisos.exito(mensaje);
        await this.recargar();
      }
      return;
    }
    await this.abrirHoja(esGasto(movimiento) ? 'gasto' : 'ingreso', movimiento);
  }

  private async abrirHoja(tipo: TipoMovimiento, movimiento: Movimiento | null): Promise<void> {
    const resultado = await abrirFormularioMovimiento(this.modalController, tipo, movimiento);
    if (resultado) {
      void this.avisos.exito(mensajeMovimiento(tipo, resultado));
      // Desde el formulario se pueden crear categorías, y un gasto de recurrente cambia la sección
      await Promise.all([this.recargar(), this.cargarCategorias(), this.cargarRecurrentes()]);
    }
  }

  private cambiarFiltros(tipo: FiltroTipo, categoria: string): void {
    if (tipo === this.tipo() && categoria === this.categoria()) {
      return;
    }
    this.tipo.set(tipo);
    this.categoria.set(categoria);
    void this.recargar({ limpiar: true });
  }

  /** Un pedidor por cada tipo que deja pasar el filtro, con la categoría si es de ese tipo. */
  private pedidores(): PedirPagina[] {
    const tipo = this.tipo();
    const [tipoCategoria, id] = this.categoria().split(':');
    const categoriaId = id ? Number(id) : undefined;
    const pedidores: PedirPagina[] = [];
    if (tipo !== 'ingreso' && (!categoriaId || tipoCategoria === 'gasto')) {
      pedidores.push((page) => this.gastoService.listar({ page, size: TAMANIO_PAGINA, categoriaId }));
    }
    if (tipo !== 'gasto' && (!categoriaId || tipoCategoria === 'ingreso')) {
      pedidores.push((page) =>
        this.ingresoService.listar({ page, size: TAMANIO_PAGINA, categoriaIngresoId: categoriaId }),
      );
    }
    return pedidores;
  }

  /** "Próximo: Netflix · 15 nov · −9,99 €" */
  private textoProximo(r: ResumenRecurrentes, signo: string): string {
    // La fecha llega sin hora ("2026-11-15"): se lee como fecha local para no cambiar de día
    const [anio, mes, dia] = (r.proximaFecha as string).split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const importe = (r.proximoImporte as number).toLocaleString('es-ES', {
      style: 'currency',
      currency: monedaActual(),
    });
    return `Próximo: ${r.proximoDescripcion} · ${fecha} · ${signo}${importe}`;
  }

  private async cargarRecurrentes(): Promise<void> {
    const hoy = new Date();
    try {
      this.recurrentes.set(await firstValueFrom(this.recurrenteService.resumen(hoy.getFullYear(), hoy.getMonth() + 1)));
    } catch {
      // La sección es secundaria: si falla se oculta y la lista sigue funcionando (sus errores ya se avisan)
      this.recurrentes.set(null);
    }
  }

  private async cargarCategorias(): Promise<void> {
    try {
      const [gasto, ingreso] = await Promise.all([
        firstValueFrom(this.categoriaService.listar()),
        firstValueFrom(this.categoriaIngresoService.listar()),
      ]);
      this.categoriasGasto.set(gasto);
      this.categoriasIngreso.set(ingreso);
    } catch (error) {
      void this.avisos.errorHttp(error);
    }
  }
}
